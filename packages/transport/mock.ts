// The mock transport. ADR-007.
//
// This is what makes encounter sync testable with no phones, in CI and in the
// browser on the Vercel preview. A green mock run is NOT evidence that a real
// radio works: it proves the protocol, not the transport.

import type { PeerId, Transport, TransportListener } from "./types";

export interface MockNetworkOptions {
  /** Simulated one-way latency per payload, milliseconds. */
  latencyMs?: number;
  /** Simulated throughput. 0 disables the size-dependent delay. */
  bytesPerSecond?: number;
  /** Matches the 30 KB ceiling in ARCHITECTURE section 4. */
  maxPayloadBytes?: number;
}

interface Node {
  transport: MockTransport;
  listener: TransportListener | null;
}

/**
 * A set of devices that can see each other. Delivery is ordered per pair and
 * driven by timers, so a test can measure an encounter against the 10 s
 * budget in NFR-004.
 */
export class MockNetwork {
  private readonly nodes = new Map<PeerId, Node>();
  private readonly inRange = new Set<string>();
  readonly latencyMs: number;
  readonly bytesPerSecond: number;
  readonly maxPayloadBytes: number;
  /** Every payload that crossed the air, for assertions about chunking. */
  readonly sent: { from: PeerId; to: PeerId; bytes: number }[] = [];

  constructor(options: MockNetworkOptions = {}) {
    this.latencyMs = options.latencyMs ?? 0;
    this.bytesPerSecond = options.bytesPerSecond ?? 0;
    this.maxPayloadBytes = options.maxPayloadBytes ?? 30000;
  }

  device(deviceId: PeerId): MockTransport {
    const transport = new MockTransport(this, deviceId);
    this.nodes.set(deviceId, { transport, listener: null });
    return transport;
  }

  private static pairKey(a: PeerId, b: PeerId): string {
    return a < b ? a + "|" + b : b + "|" + a;
  }

  /** Bring two devices into range, which is what an encounter starts as. */
  bringTogether(a: PeerId, b: PeerId): void {
    this.inRange.add(MockNetwork.pairKey(a, b));
    this.nodes.get(a)?.listener?.onPeerFound(b);
    this.nodes.get(b)?.listener?.onPeerFound(a);
  }

  separate(a: PeerId, b: PeerId): void {
    this.inRange.delete(MockNetwork.pairKey(a, b));
    this.nodes.get(a)?.listener?.onPeerLost(b);
    this.nodes.get(b)?.listener?.onPeerLost(a);
  }

  canReach(a: PeerId, b: PeerId): boolean {
    return this.inRange.has(MockNetwork.pairKey(a, b));
  }

  register(deviceId: PeerId, listener: TransportListener): void {
    const node = this.nodes.get(deviceId);
    if (node) node.listener = listener;
  }

  unregister(deviceId: PeerId): void {
    const node = this.nodes.get(deviceId);
    if (node) node.listener = null;
  }

  async deliver(
    from: PeerId,
    to: PeerId,
    payload: Uint8Array,
  ): Promise<void> {
    if (payload.byteLength > this.maxPayloadBytes) {
      throw new Error(
        "payload of " +
          payload.byteLength +
          " bytes exceeds the " +
          this.maxPayloadBytes +
          " byte limit; SyncProtocol should have chunked it",
      );
    }
    if (!this.canReach(from, to)) throw new Error(to + " is out of range");

    this.sent.push({ from, to, bytes: payload.byteLength });

    const transferMs =
      this.bytesPerSecond > 0
        ? (payload.byteLength / this.bytesPerSecond) * 1000
        : 0;
    const wait = this.latencyMs + transferMs;
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));

    // Copy, so a caller reusing its buffer cannot mutate what was delivered.
    this.nodes.get(to)?.listener?.onPayload(from, payload.slice());
  }
}

export class MockTransport implements Transport {
  readonly name = "mock";

  constructor(
    private readonly network: MockNetwork,
    readonly deviceId: PeerId,
  ) {}

  get maxPayloadBytes(): number {
    return this.network.maxPayloadBytes;
  }

  async start(listener: TransportListener): Promise<void> {
    this.network.register(this.deviceId, listener);
  }

  async stop(): Promise<void> {
    this.network.unregister(this.deviceId);
  }

  async connect(): Promise<void> {
    // Range is the connection in the mock.
  }

  async disconnect(): Promise<void> {}

  async send(to: PeerId, payload: Uint8Array): Promise<void> {
    await this.network.deliver(this.deviceId, to, payload);
  }
}
