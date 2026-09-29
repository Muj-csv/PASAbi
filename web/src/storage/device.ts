import { kvGet, kvSet } from "./kv";

const DEVICE_ID_KEY = "device_id.v1";

let cached: string | null = null;

/**
 * Lowercase UUIDv4 (CLAUDE.md). getRandomValues works outside a secure
 * context too, unlike crypto.randomUUID, so a LAN dev build never breaks.
 */
export function uuid4(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** NFR-007: a random per-install value. No account, no name. */
export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  try {
    const stored = await kvGet<string>(DEVICE_ID_KEY);
    if (stored) return (cached = stored);
    const fresh = uuid4();
    await kvSet(DEVICE_ID_KEY, fresh);
    return (cached = fresh);
  } catch {
    // No storage (private tab): an in-memory ID keeps reporting possible.
    return (cached = uuid4());
  }
}

/** Only valid after getDeviceId() resolved once (main.tsx does that at boot). */
export function deviceIdSync(): string {
  if (!cached) throw new Error("device id not loaded");
  return cached;
}
