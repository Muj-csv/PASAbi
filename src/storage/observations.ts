import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  applyPolicy,
  canCreate,
  CAPACITY_RESIDENT,
  type Observation,
} from "@pasabi/core";

const OBSERVATIONS_KEY = "pasabi.observations.v1";

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
  const kept = applyPolicy(observations, CAPACITY_RESIDENT, now);
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

/** Re-runs expiry and eviction without adding anything. */
export function refreshStore(): Promise<Observation[]> {
  return serialize(async () => persist(await loadObservations(), nowSeconds()));
}

/** BR-010, checked before the form will accept a new observation. */
export async function canCreateNow(deviceId: string): Promise<boolean> {
  return canCreate(await loadObservations(), deviceId, nowSeconds());
}
