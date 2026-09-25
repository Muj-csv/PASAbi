// Wire format for encounter sync. ARCHITECTURE section 4.
// Pure TypeScript: no react, no react-native, no DOM (CLAUDE.md).

import type { Observation } from "./types";

export const MSG_HELLO = 0x01;
export const MSG_SUMMARY = 0x02;
export const MSG_BATCH = 0x03;
export const MSG_BYE = 0x04;

export type Role = "resident" | "station";

export interface Hello {
  proto: number;
  role: Role;
  freeCapacity: number;
}

export interface SummaryChunk {
  chunkIndex: number;
  chunkCount: number;
  ids: string[];
}

const UUID_BYTES = 16;

/**
 * R-9: summaries carry 16 raw bytes per ID, not a 36-character string. That
 * is the difference between a 3,000-ID summary being ~48 KB and ~111 KB, and
 * it is what the chunk sizing in ARCHITECTURE section 4 assumes.
 */
export function uuidToBytes(uuid: string): Uint8Array {
  const hex = uuid.replace(/-/g, "");
  if (hex.length !== 32 || !/^[0-9a-f]{32}$/.test(hex)) {
    throw new Error("not a lowercase UUID: " + uuid);
  }
  const out = new Uint8Array(UUID_BYTES);
  for (let i = 0; i < UUID_BYTES; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function bytesToUuid(bytes: Uint8Array, offset = 0): string {
  let hex = "";
  for (let i = 0; i < UUID_BYTES; i++) {
    hex += bytes[offset + i].toString(16).padStart(2, "0");
  }
  return (
    hex.slice(0, 8) +
    "-" +
    hex.slice(8, 12) +
    "-" +
    hex.slice(12, 16) +
    "-" +
    hex.slice(16, 20) +
    "-" +
    hex.slice(20, 32)
  );
}

function json(type: number, value: unknown): Uint8Array {
  const body = new TextEncoder().encode(JSON.stringify(value));
  const out = new Uint8Array(body.length + 1);
  out[0] = type;
  out.set(body, 1);
  return out;
}

export function encodeHello(hello: Hello): Uint8Array {
  return json(MSG_HELLO, hello);
}

export function encodeBatch(observations: Observation[]): Uint8Array {
  return json(MSG_BATCH, observations);
}

export function encodeBye(): Uint8Array {
  return new Uint8Array([MSG_BYE]);
}

export function encodeSummary(chunk: SummaryChunk): Uint8Array {
  const out = new Uint8Array(5 + chunk.ids.length * UUID_BYTES);
  out[0] = MSG_SUMMARY;
  out[1] = (chunk.chunkIndex >> 8) & 0xff;
  out[2] = chunk.chunkIndex & 0xff;
  out[3] = (chunk.chunkCount >> 8) & 0xff;
  out[4] = chunk.chunkCount & 0xff;
  for (let i = 0; i < chunk.ids.length; i++) {
    out.set(uuidToBytes(chunk.ids[i]), 5 + i * UUID_BYTES);
  }
  return out;
}

export type Decoded =
  | { type: typeof MSG_HELLO; hello: Hello }
  | { type: typeof MSG_SUMMARY; summary: SummaryChunk }
  | { type: typeof MSG_BATCH; observations: Observation[] }
  | { type: typeof MSG_BYE };

export function decode(payload: Uint8Array): Decoded {
  if (payload.length < 1) throw new Error("empty payload");
  const type = payload[0];
  if (type === MSG_BYE) return { type: MSG_BYE };

  if (type === MSG_SUMMARY) {
    if (payload.length < 5) throw new Error("truncated summary header");
    const chunkIndex = (payload[1] << 8) | payload[2];
    const chunkCount = (payload[3] << 8) | payload[4];
    const body = payload.length - 5;
    if (body % UUID_BYTES !== 0) throw new Error("summary is not whole IDs");
    const ids: string[] = [];
    for (let offset = 5; offset < payload.length; offset += UUID_BYTES) {
      ids.push(bytesToUuid(payload, offset));
    }
    return { type: MSG_SUMMARY, summary: { chunkIndex, chunkCount, ids } };
  }

  const text = new TextDecoder().decode(payload.subarray(1));
  if (type === MSG_HELLO) {
    return { type: MSG_HELLO, hello: JSON.parse(text) as Hello };
  }
  if (type === MSG_BATCH) {
    return { type: MSG_BATCH, observations: JSON.parse(text) as Observation[] };
  }
  throw new Error("unknown message type 0x" + type.toString(16));
}

/** How many IDs fit in one payload, given the transport ceiling. */
export function idsPerSummaryChunk(maxPayloadBytes: number): number {
  return Math.max(1, Math.floor((maxPayloadBytes - 5) / UUID_BYTES));
}
