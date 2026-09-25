import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  applyPolicy,
  canCreate,
  CAPACITY_RESIDENT,
  statusCreatedAt,
  type Observation,
  type StatusAction,
} from "@pasabi/core";

import { newObservationId } from "./device";

const OBSERVATIONS_KEY = "pasabi.observations.v1";

/**
 * BR-008: 500 on a resident phone, 3,000 on a station. Station mode sets this
 * (src/storage/station.ts) and restores it at startup, so a device that was a
 * station before a restart does not silently evict down to resident size on
 * its first write.
 */
let capacity: number = CAPACITY_RESIDENT;

export function setStoreCapacity(next: number): void {
  capacity = next;
}

export function storeCapacity(): number {
  return capacity;
}

/**
 * D-015: the whole store is one JSON blob. A station at capacity is roughly
 * 900 KB, and the engine already loads every observation into memory to
 * compute incidents, so SQLite would buy nothing yet. Move to expo-sqlite if
 * the store ever outgrows this.
 */

/**
 * ponytail: writes are serialized through one promise chain. Read-modify-write
 * on a single blob is a lost-update waiting to happen when two submits land
 * together, and a chain is cheaper than a real lock.
 */
let writeQueue: Promise<unknown> = Promise.resolve();

function serialize<T>(work: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(work, work);
  writeQueue = next.catch(() => undefined);
  return next;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export async function loadObservations(): Promise<Observation[]> {
  const raw = await AsyncStorage.getItem(OBSERVATIONS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Observation[]) : [];
  } catch {
    // A corrupt blob must not brick the app during a disaster. Start clean
    // and keep going; the observations that matter re-arrive by sync.
    return [];
  }
}

/** FR-002: every write runs StorePolicy, so BR-008 and BR-009 cannot be skipped. */
async function persist(
  observations: Observation[],
  now: number,
): Promise<Observation[]> {
  const kept = applyPolicy(observations, capacity, now);
  await AsyncStorage.setItem(OBSERVATIONS_KEY, JSON.stringify(kept));
  return kept;
}

export function addObservation(
  observation: Observation,
): Promise<Observation[]> {
  return serialize(async () => {
    const now = nowSeconds();
    const existing = await loadObservations();
    return persist([...existing, observation], now);
  });
}

/** FR-011: a user may delete observations they created, on this device only. */
export function deleteOwnObservation(id: string): Promise<Observation[]> {
  return serialize(async () => {
    const now = nowSeconds();
    const existing = await loadObservations();
    const kept = existing.filter((o) => !(o.id === id && o.own === true));
    return persist(kept, now);
  });
}

/**
 * FR-009: record that these observations reached the server.
 *
 * This does not contradict BR-002. `uploaded` is a local-only field
 * describing this device's relationship to an observation, not part of the
 * observation itself, and it never travels (see toServerRow). It is also
 * load-bearing for BR-008: own observations are protected from eviction only
 * until they are uploaded, so failing to mark them would slowly fill a
 * resident store with data it is not allowed to evict.
 */
export function markUploaded(ids: string[]): Promise<Observation[]> {
  const wanted = new Set(ids);
  return serialize(async () => {
    const now = nowSeconds();
    const existing = await loadObservations();
    const marked = existing.map((o) =>
      wanted.has(o.id) ? { ...o, uploaded: true } : o,
    );
    return persist(marked, now);
  });
}

/** Re-runs expiry and eviction without adding anything. */
export function refreshStore(): Promise<Observation[]> {
  return serialize(async () => persist(await loadObservations(), nowSeconds()));
}

/** BR-010, checked before the form will accept a new observation. */
export async function canCreateNow(deviceId: string): Promise<boolean> {
  return canCreate(await loadObservations(), deviceId, nowSeconds());
}

/**
 * FR-008: acknowledge or resolve, as a STATUS observation that spreads like
 * any other. `created_at` goes through the BR-007 clamp so a station whose
 * clock is behind cannot produce a status that looks older than the report it
 * answers, which would leave the incident stuck open forever (R-6).
 */
export function addStatusObservation(
  action: StatusAction,
  refs: string[],
  deviceId: string,
): Promise<Observation[]> {
  return serialize(async () => {
    const deviceNow = nowSeconds();
    const existing = await loadObservations();
    const referenced = existing.filter(
      (o) => o.type === "REPORT" && refs.includes(o.id),
    );
    const createdAt = statusCreatedAt(deviceNow, referenced);

    const status: Observation = {
      id: newObservationId(),
      type: "STATUS",
      action,
      refs,
      device_id: deviceId,
      created_at: createdAt,
      received_at: deviceNow,
      hops: 0,
      own: true,
      uploaded: false,
    };
    return persist([...existing, status], deviceNow);
  });
}
