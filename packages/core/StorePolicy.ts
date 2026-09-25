// Expiry, eviction and the creation-side rules. BR-002, BR-007 to BR-010.
// Pure TypeScript: no react, no react-native, no DOM (CLAUDE.md).

import { compute } from "./IncidentEngine";
import {
  RATE_LIMIT_PER_HOUR,
  RATE_LIMIT_WINDOW_SECONDS,
  SAFE_CHECKIN,
  TTL_SAFE_CHECKIN_SECONDS,
  TTL_SECONDS,
} from "./rules";
import type { Observation } from "./types";

/** R-8: IDs are lowercase UUIDs, so ordering is stable on every runtime. */
export function normalizeId(id: string): string {
  return id.trim().toLowerCase();
}

/** Applied on ingest, to everything: own, received, or restored from disk. */
export function normalizeObservation(o: Observation): Observation {
  const normalized: Observation = { ...o, id: normalizeId(o.id) };
  if (o.refs) normalized.refs = o.refs.map(normalizeId);
  return normalized;
}

// ---------------------------------------------------------------- BR-009

export function ttlSecondsFor(o: Observation): number {
  return o.category === SAFE_CHECKIN ? TTL_SAFE_CHECKIN_SECONDS : TTL_SECONDS;
}

export function isExpired(o: Observation, now: number): boolean {
  return now - o.created_at >= ttlSecondsFor(o);
}

export function expire(
  observations: Observation[],
  now: number,
): Observation[] {
  return observations.filter((o) => !isExpired(o, now));
}

// ---------------------------------------------------------------- BR-010

/**
 * D-017: REPORT observations only.
 *
 * BR-010 exists to stop one device flooding the network with reports. STATUS
 * observations are operator actions, and a station working through a busy
 * board would be locked out after six acknowledgements, which penalises the
 * primary user (PRD section 3) with a rule aimed at spam. Status actions are
 * inherently bounded anyway: they can only reference incidents that already
 * exist.
 */
export function ownObservationsInWindow(
  observations: Observation[],
  deviceId: string,
  now: number,
): number {
  const since = now - RATE_LIMIT_WINDOW_SECONDS;
  let count = 0;
  for (const o of observations) {
    if (o.type !== "REPORT") continue;
    if (o.device_id === deviceId && o.created_at > since) count += 1;
  }
  return count;
}

export function canCreate(
  observations: Observation[],
  deviceId: string,
  now: number,
): boolean {
  return (
    ownObservationsInWindow(observations, deviceId, now) < RATE_LIMIT_PER_HOUR
  );
}

// ---------------------------------------------------------------- BR-007

/**
 * R-6. A status must never look older than what it answers, or a station
 * whose clock is behind could resolve an incident that then never shows as
 * resolved. Clamping at CREATION keeps the engine deterministic, because the
 * clamped value travels with the observation. A fix based on local
 * received_at would differ per device and would break NFR-002.
 */
export function statusCreatedAt(
  deviceNow: number,
  referencedReports: Observation[],
): number {
  let latest = Number.NEGATIVE_INFINITY;
  for (const o of referencedReports) {
    if (o.created_at > latest) latest = o.created_at;
  }
  if (latest === Number.NEGATIVE_INFINITY) return deviceNow;
  return Math.max(deviceNow, latest + 1);
}

// ---------------------------------------------------------------- BR-008

/** A device never evicts its own un-uploaded work except as a last resort. */
function isProtectedOwn(o: Observation): boolean {
  return o.own === true && o.uploaded !== true;
}

function oldestFirst(a: Observation, b: Observation): number {
  if (a.created_at !== b.created_at) return a.created_at - b.created_at;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * BR-008 eviction order:
 *   1. SAFE_CHECKIN first
 *   2. then members of the lowest-urgency incident, always keeping that
 *      incident's earliest and latest observation
 *   3. then the oldest
 *
 * Own un-uploaded observations are skipped entirely until nothing else is
 * left, and only then evicted oldest-first (R-5), rather than refusing to
 * record something new.
 *
 * ponytail: incidents are computed ONCE and the ranking is not refreshed as
 * members are removed, so the order goes very slightly stale mid-eviction.
 * Recomputing per victim would be O(n) engine runs for no practical gain.
 */
export function evict(
  observations: Observation[],
  capacity: number,
  now: number,
): Observation[] {
  if (observations.length <= capacity) return [...observations];

  const byId = new Map<string, Observation>();
  for (const o of observations) byId.set(o.id, o);

  const victims: Observation[] = [];
  const queued = new Set<string>();

  const enqueue = (o: Observation | undefined): void => {
    if (!o || queued.has(o.id) || isProtectedOwn(o)) return;
    queued.add(o.id);
    victims.push(o);
  };

  // 1. SAFE_CHECKIN, oldest first.
  observations
    .filter((o) => o.category === SAFE_CHECKIN)
    .sort(oldestFirst)
    .forEach((o) => enqueue(o));

  // 2. Least urgent incidents first, keeping each one's earliest and latest.
  const incidents = compute(observations, now);
  const leastUrgentFirst = [...incidents].sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
  });
  for (const incident of leastUrgentFirst) {
    const members = incident.observationIds
      .map((id) => byId.get(id))
      .filter((o): o is Observation => o !== undefined)
      .sort(oldestFirst);
    // With two or fewer members, earliest and latest are all there is.
    if (members.length <= 2) continue;
    members.slice(1, -1).forEach((o) => enqueue(o));
  }

  // 3. Everything else, oldest first.
  [...observations].sort(oldestFirst).forEach((o) => enqueue(o));

  const doomed = new Set<string>();
  let over = observations.length - capacity;
  for (const victim of victims) {
    if (over <= 0) break;
    doomed.add(victim.id);
    over -= 1;
  }

  // Last resort (R-5): the store is full of this device's own un-uploaded
  // observations. Losing the oldest of those beats refusing to record a new
  // emergency, which is the one outcome a disaster tool cannot have.
  if (over > 0) {
    const ownOldest = observations
      .filter((o) => isProtectedOwn(o) && !doomed.has(o.id))
      .sort(oldestFirst);
    for (const victim of ownOldest) {
      if (over <= 0) break;
      doomed.add(victim.id);
      over -= 1;
    }
  }

  return observations.filter((o) => !doomed.has(o.id));
}

/**
 * The one entry point the store should call: normalize, expire, then evict.
 * FR-002, run inside the same write so the invariants cannot be skipped.
 */
export function applyPolicy(
  observations: Observation[],
  capacity: number,
  now: number,
): Observation[] {
  const normalized = observations.map(normalizeObservation);
  return evict(expire(normalized, now), capacity, now);
}
