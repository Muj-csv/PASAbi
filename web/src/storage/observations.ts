// Port of src/storage/observations.ts onto IndexedDB (ADR-009). Same rules:
// every write runs StorePolicy, writes are serialized, and
// receiveObservations() is the ONLY way another phone's data gets in (R0).

import {
  applyPolicy,
  CAPACITY_RESIDENT,
  markPropagated,
  mergeReceived,
  statusCreatedAt,
  type Category,
  type Observation,
  type Role,
  type StatusAction,
} from "@pasabi/core";

import { uuid4 } from "./device";
import { kvGet, kvSet, live } from "./kv";

const KEY = "observations.v1";

/** What the screens render from. Updated after every write. */
export const observations = live<Observation[]>([]);

/** BR-008: 500 on a resident phone, 3,000 on a station (station.ts sets it). */
let capacity: number = CAPACITY_RESIDENT;

export function setStoreCapacity(next: number): void {
  capacity = next;
}

export function storeCapacity(): number {
  return capacity;
}

// ponytail: one promise chain serializes read-modify-write on the single
// blob (D-015); cheaper than a lock, and the engine loads everything anyway.
let queue: Promise<unknown> = Promise.resolve();

function serialize<T>(work: () => Promise<T>): Promise<T> {
  const next = queue.then(work, work);
  queue = next.catch(() => undefined);
  return next;
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

async function load(): Promise<Observation[]> {
  try {
    const stored = await kvGet<Observation[]>(KEY);
    return Array.isArray(stored) ? stored : [];
  } catch {
    // A broken store must not brick the app during a disaster.
    return [];
  }
}

async function persist(list: Observation[], now: number): Promise<Observation[]> {
  const kept = applyPolicy(list, capacity, now);
  await kvSet(KEY, kept);
  observations.set(kept);
  return kept;
}

export function addObservation(o: Observation): Promise<Observation[]> {
  return serialize(async () => persist([...(await load()), o], nowSeconds()));
}

export interface ReportInput {
  category: Category;
  people?: number;
  note?: string;
  area_text?: string;
  fix?: { lat: number; lon: number; accuracy_m?: number } | null;
}

/**
 * FR-001: one new REPORT from this phone. Works fully offline. The caller
 * has already checked BR-010 (canCreate) and the location rule; this only
 * builds the immutable observation and stores it. Resolves to its ID.
 */
export async function createReport(input: ReportInput, deviceId: string): Promise<string> {
  const now = nowSeconds();
  const id = uuid4();
  await addObservation({
    id,
    type: "REPORT",
    category: input.category,
    device_id: deviceId,
    created_at: now,
    people: input.people,
    note: input.note?.trim() || undefined,
    area_text: input.area_text?.trim() || undefined,
    lat: input.fix?.lat,
    lon: input.fix?.lon,
    accuracy_m: input.fix?.accuracy_m,
    received_at: now,
    hops: 0,
    own: true,
    uploaded: false,
  });
  return id;
}

/** FR-011: own observations only, this phone only. */
export function deleteOwnObservation(id: string): Promise<Observation[]> {
  return serialize(async () =>
    persist(
      (await load()).filter((o) => !(o.id === id && o.own === true)),
      nowSeconds(),
    ),
  );
}

/** FR-009. `uploaded` is local-only and never travels (BR-016). */
export function markUploaded(ids: string[]): Promise<Observation[]> {
  const wanted = new Set(ids);
  return serialize(async () =>
    persist(
      (await load()).map((o) => (wanted.has(o.id) ? { ...o, uploaded: true } : o)),
      nowSeconds(),
    ),
  );
}

/**
 * R0: the ONE ingest path for another phone's data. mergeReceived drops
 * malformed items, resets local-only fields and never replaces what is held.
 * Resolves to how many new observations survived ("Got N · M new").
 */
export function receiveObservations(incoming: unknown[]): Promise<number> {
  return serialize(async () => {
    const now = nowSeconds();
    const existing = await load();
    const before = new Set(existing.map((o) => o.id));
    const kept = await persist(mergeReceived(existing, incoming, now), now);
    return kept.filter((o) => !before.has(o.id)).length;
  });
}

/** BR-015: flags only ever go false to true, and only from a scanned receipt. */
export function markPassedOn(ids: string[], peerRole: Role): Promise<Observation[]> {
  return serialize(async () =>
    persist(markPropagated(await load(), ids, peerRole), nowSeconds()),
  );
}

/** Loads the store (and re-runs expiry) without adding anything. */
export function refreshStore(): Promise<Observation[]> {
  return serialize(async () => persist(await load(), nowSeconds()));
}

/** FR-008 acknowledge / resolve, with the R-6 clock clamp. */
export function addStatusObservation(
  action: StatusAction,
  refs: string[],
  deviceId: string,
): Promise<Observation[]> {
  return serialize(async () => {
    const deviceNow = nowSeconds();
    const existing = await load();
    const referenced = existing.filter((o) => o.type === "REPORT" && refs.includes(o.id));
    const status: Observation = {
      id: uuid4(),
      type: "STATUS",
      action,
      refs,
      device_id: deviceId,
      created_at: statusCreatedAt(deviceNow, referenced),
      received_at: deviceNow,
      hops: 0,
      own: true,
      uploaded: false,
    };
    return persist([...existing, status], deviceNow);
  });
}
