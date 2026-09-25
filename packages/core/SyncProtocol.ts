// Encounter sync. ARCHITECTURE section 4, FR-005, NFR-004.
//
// HELLO -> SUMMARY -> BATCH -> BYE, symmetric: both devices run a session.
// Pure TypeScript, and deliberately ignorant of any Transport: the session is
// handed a `send` callback, so core never imports packages/transport.

import { compute } from "./IncidentEngine";
import { MAX_PAYLOAD_BYTES, PROTO_VERSION, SYNC_BUDGET_MS } from "./rules";
import type { Incident, Observation } from "./types";
import {
  decode,
  encodeBatch,
  encodeBye,
  encodeHello,
  encodeSummary,
  idsPerSummaryChunk,
  MSG_BATCH,
  MSG_BYE,
  MSG_HELLO,
  MSG_SUMMARY,
  type Role,
} from "./wire";

export interface SyncContext {
  deviceId: string;
  role: Role;
  /** Integer epoch seconds. Passed in, never read from a clock in here. */
  now(): number;
  /** Everything this device currently holds. */
  observations(): Observation[];
  /**
   * Apply a received batch atomically, through StorePolicy. The store decides
   * what survives; the protocol never writes directly.
   */
  apply(incoming: Observation[]): void;
  freeCapacity(): number;
  maxPayloadBytes?: number;
  budgetMs?: number;
  /** Injectable so tests do not depend on wall-clock time. */
  monotonicMs?: () => number;
}

export interface SyncStats {
  payloadsSent: number;
  payloadsReceived: number;
  observationsSent: number;
  observationsReceived: number;
  /** True when the encounter ran out of budget before sending everything. */
  truncated: boolean;
}

/**
 * FR-005: "most urgent incident first". Maps every observation to the score
 * of the incident it belongs to, so a batch can be ordered before sending.
 * STATUS observations inherit the best score among the incidents they
 * reference, because a resolution is worth as much as what it resolves.
 * Check-ins and orphans sort last, which matches BR-008 eviction order.
 */
export function urgencyByObservation(
  observations: Observation[],
  now: number,
): Map<string, number> {
  const incidents: Incident[] = compute(observations, now);
  const score = new Map<string, number>();
  for (const incident of incidents) {
    for (const id of incident.observationIds) score.set(id, incident.score);
  }
  for (const o of observations) {
    if (o.type !== "STATUS" || !o.refs) continue;
    let best = -1;
    for (const ref of o.refs) {
      const refScore = score.get(ref);
      if (refScore !== undefined && refScore > best) best = refScore;
    }
    score.set(o.id, best);
  }
  return score;
}

function byUrgencyThenId(
  urgency: Map<string, number>,
): (a: Observation, b: Observation) => number {
  return (a, b) => {
    const sa = urgency.get(a.id) ?? -1;
    const sb = urgency.get(b.id) ?? -1;
    if (sa !== sb) return sb - sa;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  };
}

/** Greedy pack into payloads that fit under the transport ceiling. */
function packBatches(
  ordered: Observation[],
  maxPayloadBytes: number,
): Observation[][] {
  const batches: Observation[][] = [];
  let current: Observation[] = [];
  for (const o of ordered) {
    const candidate = [...current, o];
    if (encodeBatch(candidate).byteLength > maxPayloadBytes) {
      if (current.length > 0) {
        batches.push(current);
        current = [o];
        continue;
      }
      // A single observation larger than the ceiling cannot be sent at all.
      // Skipping it beats stalling the encounter, and a 140-character note
      // makes this unreachable in practice.
      continue;
    }
    current = candidate;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

type Phase = "idle" | "greeted" | "summarised" | "done";

/**
 * One side of one encounter. Drive it by calling `begin()` on the initiator
 * and `receive()` with every payload the transport delivers from this peer.
 */
export class SyncSession {
  private phase: Phase = "idle";
  private helloSent = false;
  private summarySent = false;
  private byeSent = false;
  private peerSaidBye = false;
  /** True while the batch loop is running, so a peer BYE cannot cut it off. */
  private sending = false;
  private readonly peerIds: string[] = [];
  private chunksExpected: number | null = null;
  private chunksSeen = 0;
  private startedMs: number;
  private resolveFinished: (() => void) | null = null;

  readonly stats: SyncStats = {
    payloadsSent: 0,
    payloadsReceived: 0,
    observationsSent: 0,
    observationsReceived: 0,
    truncated: false,
  };

  readonly finished: Promise<void>;

  constructor(
    private readonly ctx: SyncContext,
    readonly peer: string,
    private readonly send: (payload: Uint8Array) => Promise<void>,
  ) {
    this.startedMs = this.clock();
    this.finished = new Promise((resolve) => {
      this.resolveFinished = resolve;
    });
  }

  private clock(): number {
    return (this.ctx.monotonicMs ?? (() => Date.now()))();
  }

  private get budgetMs(): number {
    return this.ctx.budgetMs ?? SYNC_BUDGET_MS;
  }

  private get maxPayloadBytes(): number {
    return this.ctx.maxPayloadBytes ?? MAX_PAYLOAD_BYTES;
  }

  private outOfBudget(): boolean {
    return this.clock() - this.startedMs >= this.budgetMs;
  }

  private async transmit(payload: Uint8Array): Promise<void> {
    await this.send(payload);
    this.stats.payloadsSent += 1;
  }

  /** Called by the initiator. The other side answers on receiving HELLO. */
  async begin(): Promise<void> {
    this.startedMs = this.clock();
    await this.sendHello();
  }

  private async sendHello(): Promise<void> {
    if (this.helloSent) return;
    this.helloSent = true;
    await this.transmit(
      encodeHello({
        proto: PROTO_VERSION,
        role: this.ctx.role,
        freeCapacity: this.ctx.freeCapacity(),
      }),
    );
  }

  private async sendSummary(): Promise<void> {
    if (this.summarySent) return;
    this.summarySent = true;

    const ids = this.ctx
      .observations()
      .map((o) => o.id)
      .sort();
    const perChunk = idsPerSummaryChunk(this.maxPayloadBytes);
    const chunkCount = Math.max(1, Math.ceil(ids.length / perChunk));
    for (let i = 0; i < chunkCount; i++) {
      await this.transmit(
        encodeSummary({
          chunkIndex: i,
          chunkCount,
          ids: ids.slice(i * perChunk, (i + 1) * perChunk),
        }),
      );
    }
  }

  private async sendMissingThenBye(): Promise<void> {
    this.sending = true;
    const mine = this.ctx.observations();
    const theirs = new Set(this.peerIds);
    // What they are missing is what I hold and they did not list.
    const missing = mine.filter((o) => !theirs.has(o.id));

    const urgency = urgencyByObservation(mine, this.ctx.now());
    missing.sort(byUrgencyThenId(urgency));

    for (const batch of packBatches(missing, this.maxPayloadBytes)) {
      if (this.outOfBudget()) {
        // NFR-004: the budget is a promise about how long an encounter takes,
        // not a target. Urgency ordering is what makes truncation survivable,
        // because whatever did cross the air was the most important part.
        this.stats.truncated = true;
        break;
      }
      await this.transmit(encodeBatch(batch));
      this.stats.observationsSent += batch.length;
    }

    this.sending = false;
    await this.sendBye();
  }

  private async sendBye(): Promise<void> {
    if (this.byeSent) return;
    this.byeSent = true;
    await this.transmit(encodeBye());
    this.maybeFinish();
  }

  private maybeFinish(): void {
    if (this.phase === "done") return;
    if (this.byeSent && this.peerSaidBye) {
      this.phase = "done";
      this.resolveFinished?.();
    }
  }

  get isDone(): boolean {
    return this.phase === "done";
  }

  async receive(payload: Uint8Array): Promise<void> {
    this.stats.payloadsReceived += 1;
    const message = decode(payload);

    if (message.type === MSG_HELLO) {
      if (message.hello.proto !== PROTO_VERSION) {
        // A device on another protocol version is not something to recover
        // from in the field. End politely and let the operator update.
        await this.sendBye();
        return;
      }
      this.phase = "greeted";
      await this.sendHello();
      await this.sendSummary();
      return;
    }

    if (message.type === MSG_SUMMARY) {
      this.chunksExpected = message.summary.chunkCount;
      this.chunksSeen += 1;
      this.peerIds.push(...message.summary.ids);
      if (this.chunksSeen >= this.chunksExpected) {
        this.phase = "summarised";
        // Answer with our own summary if we have not sent it, so the exchange
        // works whichever side spoke first.
        await this.sendSummary();
        await this.sendMissingThenBye();
      }
      return;
    }

    if (message.type === MSG_BATCH) {
      this.ctx.apply(message.observations);
      this.stats.observationsReceived += message.observations.length;
      return;
    }

    if (message.type === MSG_BYE) {
      this.peerSaidBye = true;
      // Do NOT answer while our own batch loop is still running. Sending BYE
      // here would resolve `finished` with observations still on the wire,
      // and a carry service would tear the connection down mid-transfer.
      // sendMissingThenBye sends ours when it is actually done.
      if (!this.sending) await this.sendBye();
      this.maybeFinish();
    }
  }
}
