// Bluetooth pass-on (D-033): every phone in range, one tap. The protocol is
// core's SyncSession (hello, summary, what you're missing, bye; most urgent
// first; FR-005), the same one the mock network tests. The radio is behind
// the Transport interface (ADR-007): Multipeer in the native app, nothing in
// the browser, where Bluetooth between phones is not possible.

import {
  SYNC_BUDGET_MS,
  SyncSession,
  type Observation,
  type Role,
  type SyncContext,
} from "@pasabi/core";

import type { PeerId, Transport } from "../../packages/transport/types";
import {
  MultipeerTransport,
  multipeerAvailable,
  onBluetoothState,
  requestBluetooth,
  type BluetoothState,
} from "../../packages/transport/multipeer";

import { deviceIdSync } from "./storage/device";
import { kvGet, kvSet, live } from "./storage/kv";
import {
  markPassedOn,
  nowSeconds,
  observations,
  receiveObservations,
  storeCapacity,
} from "./storage/observations";
import { station } from "./storage/station";

/** What a NearbyNode needs from the phone's store. Injected, so tests use memory. */
export interface NearbyStore {
  role(): Role;
  observations(): Observation[];
  /** Must go through the one ingest path (receiveObservations, R0). */
  apply(incoming: Observation[], from: PeerId): void;
  freeCapacity(): number;
  /** BR-015: a batch actually went out to a peer that claimed `role`. */
  onSent(ids: string[], role: Role): void;
}

export interface PingResult {
  /** Phones that finished the exchange. */
  reached: number;
  /** Observations sent across all of them. */
  sent: number;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** One phone's Bluetooth presence: who is in range, and a sync per peer. */
export class NearbyNode {
  readonly peers = new Set<PeerId>();
  private readonly sessions = new Map<PeerId, SyncSession>();
  onChange: (() => void) | null = null;

  constructor(
    private readonly transport: Transport,
    private readonly store: NearbyStore,
    private readonly now: () => number,
  ) {}

  start(): Promise<void> {
    return this.transport.start({
      onPeerFound: (peer) => {
        this.peers.add(peer);
        this.onChange?.();
      },
      onPeerLost: (peer) => {
        this.peers.delete(peer);
        this.sessions.delete(peer);
        this.onChange?.();
      },
      // A peer that pinged us: answer through the same session type.
      onPayload: (peer, payload) => void this.session(peer).receive(payload),
    });
  }

  stop(): Promise<void> {
    this.peers.clear();
    this.sessions.clear();
    return this.transport.stop();
  }

  private session(peer: PeerId): SyncSession {
    const existing = this.sessions.get(peer);
    if (existing) return existing;
    const context: SyncContext = {
      deviceId: this.transport.deviceId,
      role: this.store.role(),
      now: this.now,
      observations: () => this.store.observations(),
      apply: (incoming) => this.store.apply(incoming, peer),
      freeCapacity: () => this.store.freeCapacity(),
      onSent: (ids, role) => this.store.onSent(ids, role),
      maxPayloadBytes: this.transport.maxPayloadBytes,
    };
    const s = new SyncSession(context, peer, (payload) => this.transport.send(peer, payload));
    this.sessions.set(peer, s);
    void s.finished.then(() => {
      if (this.sessions.get(peer) === s) this.sessions.delete(peer);
    });
    return s;
  }

  /**
   * Ping: exchange with every phone in range at once. A phone already mid-
   * exchange is waited on, not restarted. A phone that does not finish in
   * time counts as not reached; nothing is marked passed on for it beyond
   * the batches that actually went out (onSent).
   */
  async pingAll(): Promise<PingResult> {
    const results = await Promise.all(
      [...this.peers].map(async (peer) => {
        const running = this.sessions.get(peer);
        const s = running ?? this.session(peer);
        try {
          if (!running) {
            await this.transport.connect(peer);
            await s.begin();
          }
        } catch {
          this.sessions.delete(peer);
          return null;
        }
        const finished = await Promise.race([
          s.finished.then(() => true),
          sleep(SYNC_BUDGET_MS + 5000).then(() => false),
        ]);
        if (!finished) {
          this.sessions.delete(peer);
          return null;
        }
        return s.stats.observationsSent;
      }),
    );
    const done = results.filter((r): r is number => r !== null);
    return { reached: done.length, sent: done.reduce((a, b) => a + b, 0) };
  }
}

// ------------------------------------------------------------ the app's node

export interface NearbyState {
  /** True only inside the native app, where the radio exists. */
  available: boolean;
  running: boolean;
  peers: PeerId[];
}

export const nearby = live<NearbyState>({ available: false, running: false, peers: [] });

/**
 * What iOS says about Bluetooth for PASAbi. "web" = the browser build,
 * where Bluetooth between phones does not exist at all.
 */
export const bluetooth = live<BluetoothState | "unknown" | "web">("unknown");

/** The last batch that arrived by Bluetooth, for the Receive screen. */
export interface InboxEntry {
  at: number;
  from: string;
  received: number;
  added: number;
}
export const inbox = live<InboxEntry | null>(null);

/** The person said yes once; later launches ask iOS again without the sheet. */
const ALLOWED_KEY = "nearby.allowed.v1";

let node: NearbyNode | null = null;

const phoneStore: NearbyStore = {
  role: () => (station.get().enabled ? "station" : "resident"),
  observations: () => observations.get(),
  // Waiting for pings: every batch from any phone goes through the one
  // ingest path (R0), and the Receive screen hears about it.
  apply: (incoming, from) =>
    void receiveObservations(incoming).then((added) =>
      inbox.set({ at: nowSeconds(), from, received: incoming.length, added }),
    ),
  freeCapacity: () => Math.max(0, storeCapacity() - observations.get().length),
  onSent: (ids, role) => void markPassedOn(ids, role),
};

function publish(): void {
  nearby.set({
    available: multipeerAvailable(),
    running: node !== null,
    peers: node ? [...node.peers].sort() : [],
  });
}

/**
 * Starts advertising and browsing. On iOS this is what raises the system
 * Bluetooth / Local Network permission prompts; the app never switches
 * Bluetooth on itself (CLAUDE.md), it only asks. Resolves false in the
 * browser or when the radio could not start.
 */
export async function startNearby(): Promise<boolean> {
  if (!multipeerAvailable()) {
    publish();
    return false;
  }
  if (node) return true;
  const next = new NearbyNode(new MultipeerTransport(deviceIdSync()), phoneStore, nowSeconds);
  next.onChange = publish;
  try {
    await next.start();
    node = next;
  } catch {
    node = null;
  }
  publish();
  return node !== null;
}

export function pingAll(): Promise<PingResult> {
  return node ? node.pingAll() : Promise.resolve({ reached: 0, sent: 0 });
}

/**
 * Ask iOS for Bluetooth, and start passing on and listening if it is on.
 * The first time this shows iOS's permission prompt; whenever Bluetooth is
 * off it shows iOS's own "Turn On Bluetooth" alert. Never switches it on.
 */
export async function allowBluetooth(): Promise<BluetoothState | "web"> {
  if (!multipeerAvailable()) {
    bluetooth.set("web");
    return "web";
  }
  let state: BluetoothState;
  try {
    state = await requestBluetooth();
  } catch {
    state = "unsupported";
  }
  bluetooth.set(state);
  await kvSet(ALLOWED_KEY, true);
  if (state === "on") await startNearby();
  return state;
}

/**
 * Boot. In the browser: mark Bluetooth as unavailable. In the native app:
 * follow Bluetooth being switched on and off, and if the person already
 * allowed it once, ask iOS again right away (the startup ask, D-033).
 * Otherwise the StartupAsk sheet explains first, then asks.
 */
export async function restoreNearby(): Promise<void> {
  publish();
  if (!multipeerAvailable()) {
    bluetooth.set("web");
    return;
  }
  onBluetoothState((state) => {
    bluetooth.set(state);
    if (state === "on") void startNearby();
  });
  if ((await kvGet<boolean>(ALLOWED_KEY)) === true) await allowBluetooth();
}
