// ADR-007: one interface, three implementations. multipeer (iOS), nearby
// (Android), mock (web and tests). Nothing above this line knows which.
//
// Pure TypeScript. The platform adapters live in their own files and are the
// only place a native module is allowed to appear.

export type PeerId = string;

export interface TransportListener {
  /** A Pasabi device came into range. */
  onPeerFound(peer: PeerId): void;
  /** It went out of range, or the connection dropped. */
  onPeerLost(peer: PeerId): void;
  /** One complete payload arrived. Framing is the protocol concern. */
  onPayload(from: PeerId, payload: Uint8Array): void;
}

export interface Transport {
  /** Human name for logs and the field test notes. */
  readonly name: string;

  /** This device, as peers see it. */
  readonly deviceId: PeerId;

  /**
   * Largest single payload the radio will carry. ARCHITECTURE section 4 caps
   * messages at 30 KB; each adapter reports what its own stack allows, and
   * SyncProtocol chunks to fit.
   */
  readonly maxPayloadBytes: number;

  /** Begin advertising and discovering. */
  start(listener: TransportListener): Promise<void>;

  /** Stop both, and drop every connection. */
  stop(): Promise<void>;

  /**
   * Nearby Connections and Multipeer both need an explicit session before
   * bytes move. Adapters where that is implicit may no-op.
   */
  connect(peer: PeerId): Promise<void>;

  disconnect(peer: PeerId): Promise<void>;

  send(to: PeerId, payload: Uint8Array): Promise<void>;
}
