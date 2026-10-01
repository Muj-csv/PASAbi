// How observations leave and enter a device. BR-016, IMPLEMENTATION_UPDATE R0.
// Pure TypeScript: no react, no react-native, no DOM (CLAUDE.md).

import { CATEGORIES } from "./rules";
import { normalizeObservation } from "./StorePolicy";
import type { Category, Observation } from "./types";

/**
 * The fields that describe the observation itself and travel with it. Every
 * other field describes this device's relationship to it and stays here.
 * toServerRow (upload.ts) names the same set minus `sig`, which the server
 * has no column for yet; ingest.test.ts holds the two together.
 */
export const WIRE_FIELDS = [
  "id",
  "type",
  "category",
  "people",
  "note",
  "lat",
  "lon",
  "accuracy_m",
  "area_text",
  "created_at",
  "device_id",
  "refs",
  "action",
  "sig",
] as const satisfies readonly (keyof Observation)[];

/** Only the shared fields. encodeBatch applies it to every batch. */
export function toWire(o: Observation): Observation {
  const out: Record<string, unknown> = {};
  for (const field of WIRE_FIELDS) {
    const value = o[field];
    if (value === undefined) continue;
    out[field] = Array.isArray(value) ? [...value] : value;
  }
  return out as unknown as Observation;
}

/**
 * An observation that arrived from another phone is never this device's own
 * and was never uploaded FROM this device, whatever the sender's copy said.
 * Otherwise a relayed report would be protected from eviction as if it were
 * ours (BR-008) and could be marked uploaded when it never was (FR-009).
 * passed_on and reached_station are dropped by toWire, which reads as false.
 */
export function asReceived(o: Observation, now: number): Observation {
  return { ...toWire(o), received_at: now, own: false, uploaded: false };
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuid = (v: unknown): boolean =>
  typeof v === "string" && UUID.test(v.trim());
const isNumber = (v: unknown): boolean =>
  typeof v === "number" && Number.isFinite(v);
const isString = (v: unknown): boolean => typeof v === "string";

function optional(value: unknown, check: (v: unknown) => boolean): boolean {
  return value === undefined || check(value);
}

/**
 * Received data is untrusted input from another phone. One bad item must not
 * break the store or the next encounter: a non-UUID id makes encodeSummary
 * throw on every later sync, an unknown category scores NaN, and a non-string
 * note crashes the screen that renders it. Failing items are dropped, never
 * repaired.
 */
export function isObservation(value: unknown): value is Observation {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    isUuid(o.id) &&
    (o.type === "REPORT" || o.type === "STATUS" || o.type === "CHECK") &&
    // A CHECK means nothing without what was checked and where (D-037).
    (o.type !== "CHECK" ||
      (CATEGORIES.includes(o.category as Category) && typeof o.area_text === "string" && o.area_text.trim().length > 0)) &&
    Number.isInteger(o.created_at) &&
    typeof o.device_id === "string" &&
    o.device_id.length > 0 &&
    optional(o.category, (v) => CATEGORIES.includes(v as Category)) &&
    optional(o.action, (v) => v === "ACK" || v === "RESOLVE") &&
    optional(o.refs, (v) => Array.isArray(v) && v.every(isUuid)) &&
    optional(o.people, isNumber) &&
    optional(o.lat, isNumber) &&
    optional(o.lon, isNumber) &&
    optional(o.accuracy_m, isNumber) &&
    optional(o.note, isString) &&
    optional(o.area_text, isString) &&
    optional(o.sig, isString)
  );
}

/**
 * The one way received observations join a store. Items already held are
 * skipped rather than replaced, so an own observation that comes back from a
 * peer stays own (and BR-002 holds). Returns the merged set BEFORE
 * StorePolicy; the caller runs applyPolicy in the same write.
 */
export function mergeReceived(
  held: Observation[],
  incoming: unknown[],
  now: number,
): Observation[] {
  const known = new Set(held.map((o) => o.id));
  const merged = [...held];
  for (const value of incoming) {
    if (!isObservation(value)) continue;
    const o = asReceived(normalizeObservation(value), now);
    if (known.has(o.id)) continue;
    known.add(o.id);
    merged.push(o);
  }
  return merged;
}
