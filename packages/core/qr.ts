// QR bundle transfer. FR-013, ADR-008, D-025, D-027.
// Pure TypeScript: no react, no react-native, no DOM (CLAUDE.md). fflate is
// pure JavaScript, so it is allowed here.
//
// A one-way, camera-read transfer: one phone shows cycling frames, the other
// scans them. It sits BESIDE Transport, not behind it (ADR-008), and reuses
// what matters: encodeBatch (so toWire strips local-only fields),
// urgencyByObservation for ordering, and the normal ingest path on arrival.

import { deflateSync, inflateSync } from "fflate";

import {
  QR_ACK_MEMORY_RECEIVERS,
  QR_FRAME_CHARS,
  QR_MAX_OBSERVATIONS,
} from "./rules";
import { isExpired } from "./StorePolicy";
import { byUrgencyThenId, urgencyByObservation } from "./SyncProtocol";
import type { Observation } from "./types";
import { decode, encodeBatch, MSG_BATCH, type Role } from "./wire";

// ---------------------------------------------------------------- paging

/**
 * D-025: everything this phone holds, minus what this receiver already
 * acknowledged, most urgent first, in pages of QR_MAX_OBSERVATIONS. A fixed
 * "top 60" would resend the same 60 every time, and anything ranked lower
 * would never cross by QR.
 */
export function bundlePages(
  observations: Observation[],
  now: number,
  alreadyAcked: ReadonlySet<string>,
): Observation[][] {
  const held = observations.filter((o) => !isExpired(o, now));
  // Urgency is ranked over everything held, so a page is ordered by the
  // same incident scores the board shows.
  const urgency = urgencyByObservation(held, now);
  const pending = held
    .filter((o) => !alreadyAcked.has(o.id))
    .sort(byUrgencyThenId(urgency));

  const pages: Observation[][] = [];
  for (let i = 0; i < pending.length; i += QR_MAX_OBSERVATIONS) {
    pages.push(pending.slice(i, i + QR_MAX_OBSERVATIONS));
  }
  return pages;
}

// ---------------------------------------------------------------- base64
// React Native has no Buffer, and core may not depend on the platform.

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const B64_INDEX = new Map([...B64].map((c, i) => [c, i]));

export function toBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (a << 16) | (b << 8) | c;
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    out += i + 1 < bytes.length ? B64[(n >> 6) & 63] : "=";
    out += i + 2 < bytes.length ? B64[n & 63] : "=";
  }
  return out;
}

/** Throws on anything that is not base64; callers here catch it. */
export function fromBase64(text: string): Uint8Array {
  if (text.length % 4 !== 0) throw new Error("base64 length");
  const padding = text.endsWith("==") ? 2 : text.endsWith("=") ? 1 : 0;
  const out = new Uint8Array((text.length / 4) * 3 - padding);
  let o = 0;
  for (let i = 0; i < text.length; i += 4) {
    let n = 0;
    for (let j = 0; j < 4; j++) {
      const ch = text[i + j];
      const v = ch === "=" ? 0 : B64_INDEX.get(ch);
      if (v === undefined) throw new Error("base64 character");
      n = (n << 6) | v;
    }
    if (o < out.length) out[o++] = (n >> 16) & 255;
    if (o < out.length) out[o++] = (n >> 8) & 255;
    if (o < out.length) out[o++] = n & 255;
  }
  return out;
}

// ---------------------------------------------------------------- frames

const BUNDLE_ID = /^[0-9a-z]{1,16}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const FRAME = /^PSB1:([0-9a-z]{1,16}):(\d{1,4})\/(\d{1,4}):([A-Za-z0-9+/=]+)$/;
const RECEIPT = /^PSR1:([0-9a-z]{1,16}):(resident|station):([0-9a-f-]{36})$/;
const ID_FRAME = /^PSI1:(resident|station):([0-9a-f-]{36})$/;

/**
 * D-027: toWire + encodeBatch, raw deflate, base64, then QR_FRAME_CHARS
 * per frame. Frames are PSB1:<bundleId>:<i>/<n>:<chunk>, i counting from 1.
 * `bundleId` comes from the caller, because core never reads randomness.
 */
export function encodeBundle(page: Observation[], bundleId: string): string[] {
  if (!BUNDLE_ID.test(bundleId)) throw new Error("bad bundle id: " + bundleId);
  const text = toBase64(deflateSync(encodeBatch(page), { level: 9 }));
  const count = Math.max(1, Math.ceil(text.length / QR_FRAME_CHARS));
  const frames: string[] = [];
  for (let i = 0; i < count; i++) {
    const chunk = text.slice(i * QR_FRAME_CHARS, (i + 1) * QR_FRAME_CHARS);
    frames.push("PSB1:" + bundleId + ":" + (i + 1) + "/" + count + ":" + chunk);
  }
  return frames;
}

export type AssembleResult =
  | { kind: "progress"; received: number; total: number }
  | { kind: "complete"; bundleId: string; observations: unknown[] }
  | { kind: "wrong-bundle" }
  | { kind: "invalid" };

/**
 * Collects frames in any order, ignores duplicates, locks onto the first
 * bundle it sees and rejects frames from any other. Returns the decoded
 * observations when every frame has arrived. Never throws into the UI:
 * malformed input is "invalid". The observations are still UNTRUSTED;
 * receiveObservations() checks each one on the way into the store.
 */
export class BundleAssembler {
  private bundleId: string | null = null;
  private total = 0;
  private readonly chunks = new Map<number, string>();
  private result: unknown[] | null = null;

  get received(): number {
    return this.chunks.size;
  }

  get expected(): number {
    return this.total;
  }

  reset(): void {
    this.bundleId = null;
    this.total = 0;
    this.chunks.clear();
    this.result = null;
  }

  accept(text: string): AssembleResult {
    const m = FRAME.exec(text.trim());
    if (!m) return { kind: "invalid" };
    const [, id, i, n, chunk] = m;
    const index = Number(i);
    const count = Number(n);
    if (count < 1 || index < 1 || index > count) return { kind: "invalid" };

    if (this.bundleId === null) {
      this.bundleId = id;
      this.total = count;
    } else if (id !== this.bundleId || count !== this.total) {
      return { kind: "wrong-bundle" };
    }

    if (this.result !== null) {
      return { kind: "complete", bundleId: id, observations: this.result };
    }

    this.chunks.set(index, chunk);
    if (this.chunks.size < this.total) {
      return { kind: "progress", received: this.chunks.size, total: this.total };
    }

    try {
      let joined = "";
      for (let k = 1; k <= this.total; k++) joined += this.chunks.get(k) ?? "";
      const message = decode(inflateSync(fromBase64(joined)));
      if (message.type !== MSG_BATCH || !Array.isArray(message.observations)) {
        throw new Error("not a batch");
      }
      this.result = message.observations;
      return { kind: "complete", bundleId: id, observations: this.result };
    } catch {
      // Every frame arrived but they do not decode: start again rather than
      // stay stuck on a bundle that can never complete.
      this.reset();
      return { kind: "invalid" };
    }
  }
}

// ------------------------------------------------- receipts and ID frames

export interface Receipt {
  bundleId: string;
  role: Role;
  deviceId: string;
}

/** FR-013: one frame the receiver shows back, naming its role and device. */
export function encodeReceipt(r: Receipt): string {
  return "PSR1:" + r.bundleId + ":" + r.role + ":" + r.deviceId;
}

export function decodeReceipt(text: string): Receipt | null {
  const m = RECEIPT.exec(text.trim());
  if (!m || !UUID.test(m[3])) return null;
  return { bundleId: m[1], role: m[2] as Role, deviceId: m[3] };
}

/** The optional frame a receiver shows first, so the sender can skip what it has. */
export function encodeId(role: Role, deviceId: string): string {
  return "PSI1:" + role + ":" + deviceId;
}

export function decodeId(text: string): { role: Role; deviceId: string } | null {
  const m = ID_FRAME.exec(text.trim());
  if (!m || !UUID.test(m[2])) return null;
  return { role: m[1] as Role, deviceId: m[2] };
}

// --------------------------------------------- sender-side memory (D-025)

/** Receiver device ID -> observation IDs it acknowledged. Local only. */
export type AckMemory = Record<string, { ids: string[]; at: number }>;

/**
 * Records a receipt. IDs this phone no longer holds are dropped, so an entry
 * never outgrows the store, and only the QR_ACK_MEMORY_RECEIVERS most recent
 * receivers are kept, so the map never grows without bound.
 */
export function rememberReceipt(
  memory: AckMemory,
  receiverId: string,
  ackedIds: string[],
  heldIds: ReadonlySet<string>,
  now: number,
): AckMemory {
  const merged = new Set([...(memory[receiverId]?.ids ?? []), ...ackedIds]);
  const ids = [...merged].filter((id) => heldIds.has(id)).sort();
  const next: AckMemory = { ...memory, [receiverId]: { ids, at: now } };
  const kept = Object.entries(next)
    .sort((a, b) => b[1].at - a[1].at || (a[0] < b[0] ? -1 : 1))
    .slice(0, QR_ACK_MEMORY_RECEIVERS);
  return Object.fromEntries(kept);
}
