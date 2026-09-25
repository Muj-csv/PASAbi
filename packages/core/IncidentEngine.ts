// The incident engine. ARCHITECTURE section 3, BR-003 to BR-007.
//
// Pure TypeScript: no react, no react-native, no DOM (CLAUDE.md).
// `now` is always a parameter. The engine never reads the clock, because a
// deterministic result is what lets every device agree without a coordinator
// (ADR-002, NFR-002).

import {
  CATEGORY_BASE,
  CORROBORATED_AT,
  CORROBORATION_BONUS_MAX,
  CORROBORATION_PER_EXTRA_REPORTER,
  MIN_OPEN_SCORE,
  PEOPLE_BONUS,
  PEOPLE_BONUS_MAX_INDEX,
  RESOLVED_SCORE,
  R_METRES,
  SAFE_CHECKIN,
  STALENESS_MAX,
  STALENESS_PER_HOUR,
  STRONGLY_CORROBORATED_AT,
  T_SECONDS,
  UNACKNOWLEDGED_BONUS,
} from "./rules";
import type {
  Category,
  CorroborationLevel,
  Incident,
  IncidentStatus,
  Observation,
  SafeCheckinCounts,
  ScoreBreakdown,
} from "./types";

const EARTH_RADIUS_M = 6371008.8;
const SECONDS_PER_HOUR = 3600;
const METRES_PER_DEGREE_LAT = (Math.PI * EARTH_RADIUS_M) / 180;

/** BR-003: lowercase, trim, collapse internal whitespace. */
export function normalizeArea(text: string | undefined | null): string {
  if (!text) return "";
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Great-circle distance in metres. Used only for threshold comparisons, and
 * the test vectors keep distances well away from R so the last few bits of a
 * double can never flip a grouping decision (NFR-002).
 */
export function haversineMetres(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
): number {
  const toRad = Math.PI / 180;
  const lat1 = aLat * toRad;
  const lat2 = bLat * toRad;
  const dLat = (bLat - aLat) * toRad;
  const dLon = (bLon - aLon) * toRad;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

function hasFix(o: Observation): boolean {
  return (
    typeof o.lat === "number" &&
    typeof o.lon === "number" &&
    Number.isFinite(o.lat) &&
    Number.isFinite(o.lon)
  );
}

function compareIds(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Ascending by time, then by ID, so grouping never depends on input order. */
function byTimeThenId(a: Observation, b: Observation): number {
  if (a.created_at !== b.created_at) return a.created_at - b.created_at;
  return compareIds(a.id, b.id);
}

/** Union-find with path compression and union by rank. */
class DisjointSet {
  private readonly parent: Int32Array;
  private readonly rank: Int32Array;

  constructor(size: number) {
    this.parent = new Int32Array(size);
    this.rank = new Int32Array(size);
    for (let i = 0; i < size; i++) this.parent[i] = i;
  }

  find(x: number): number {
    let root = x;
    while (this.parent[root] !== root) root = this.parent[root];
    let walk = x;
    while (this.parent[walk] !== root) {
      const next = this.parent[walk];
      this.parent[walk] = root;
      walk = next;
    }
    return root;
  }

  union(a: number, b: number): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;
    if (this.rank[ra] < this.rank[rb]) {
      this.parent[ra] = rb;
    } else if (this.rank[ra] > this.rank[rb]) {
      this.parent[rb] = ra;
    } else {
      this.parent[rb] = ra;
      this.rank[ra] += 1;
    }
  }
}

/**
 * BR-003 branch (a): both observations have a fix, so distance decides.
 *
 * ponytail: time-sorted window scan with a latitude pre-reject, not the
 * 150 m grid ARCHITECTURE section 3 suggests. The 3,000-observation
 * benchmark in IncidentEngine.test.ts is the arbiter; add the grid only if
 * that benchmark fails NFR-003.
 */
function linkByDistance(list: Observation[], ds: DisjointSet): void {
  const maxLatDelta = R_METRES / METRES_PER_DEGREE_LAT;
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (!hasFix(a)) continue;
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      if (b.created_at - a.created_at > T_SECONDS) break;
      if (!hasFix(b)) continue;
      if (ds.find(i) === ds.find(j)) continue;
      if (Math.abs((b.lat as number) - (a.lat as number)) > maxLatDelta) {
        continue;
      }
      const metres = haversineMetres(
        a.lat as number,
        a.lon as number,
        b.lat as number,
        b.lon as number,
      );
      if (metres <= R_METRES) ds.union(i, j);
    }
  }
}

/**
 * BR-003 branch (b), as fixed by R-1: matching area text links a pair only
 * when AT LEAST ONE of them has no GPS fix. Two observations that both have
 * a fix are decided by distance alone, however their area text reads.
 *
 * ponytail: O(members without a fix x window). A bucket is one exact area
 * string inside a 6 h window, so buckets stay small in practice. If a real
 * barangay ever produces a huge single-area bucket, index it by time.
 */
function linkByAreaText(list: Observation[], ds: DisjointSet): void {
  const buckets = new Map<string, number[]>();
  for (let i = 0; i < list.length; i++) {
    const area = normalizeArea(list[i].area_text);
    if (!area) continue;
    const bucket = buckets.get(area);
    if (bucket) bucket.push(i);
    else buckets.set(area, [i]);
  }

  for (const bucket of buckets.values()) {
    // `list` is time-sorted, so ascending indices are time-ascending too.
    for (let p = 0; p < bucket.length; p++) {
      const i = bucket[p];
      if (hasFix(list[i])) continue;
      for (let q = p + 1; q < bucket.length; q++) {
        const j = bucket[q];
        if (list[j].created_at - list[i].created_at > T_SECONDS) break;
        ds.union(i, j);
      }
      for (let q = p - 1; q >= 0; q--) {
        const j = bucket[q];
        if (list[i].created_at - list[j].created_at > T_SECONDS) break;
        ds.union(i, j);
      }
    }
  }
}

function groupsOf(list: Observation[], ds: DisjointSet): Observation[][] {
  const byRoot = new Map<number, Observation[]>();
  for (let i = 0; i < list.length; i++) {
    const root = ds.find(i);
    const group = byRoot.get(root);
    if (group) group.push(list[i]);
    else byRoot.set(root, [list[i]]);
  }
  return [...byRoot.values()];
}

function corroborationOf(reporters: number): CorroborationLevel {
  if (reporters >= STRONGLY_CORROBORATED_AT) return "strongly_corroborated";
  if (reporters >= CORROBORATED_AT) return "corroborated";
  return "single";
}

/**
 * ARCHITECTURE section 3 step 4. Resolved when a RESOLVE was created after
 * the group's latest REPORT, which is what makes a newer report reopen it
 * (BR-007). A stale RESOLVE does not imply an ACK.
 */
function statusOf(
  observationIds: Set<string>,
  lastSeen: number,
  statuses: Observation[],
): IncidentStatus {
  let resolved = false;
  let acknowledged = false;
  for (const s of statuses) {
    if (!s.refs || !s.refs.some((ref) => observationIds.has(ref))) continue;
    if (s.action === "RESOLVE") {
      if (s.created_at > lastSeen) resolved = true;
    } else if (s.action === "ACK") {
      acknowledged = true;
    }
  }
  if (resolved) return "resolved";
  if (acknowledged) return "acknowledged";
  return "open";
}

/** BR-005. Integer arithmetic throughout: no floating point in scoring (R-3). */
function scoreOf(
  category: Category,
  reporters: number,
  peopleAffected: number,
  lastSeen: number,
  status: IncidentStatus,
  now: number,
): { score: number; breakdown: ScoreBreakdown } {
  const base = CATEGORY_BASE[category];
  const corroboration = Math.min(
    (reporters - 1) * CORROBORATION_PER_EXTRA_REPORTER,
    CORROBORATION_BONUS_MAX,
  );
  const people = PEOPLE_BONUS[Math.min(peopleAffected, PEOPLE_BONUS_MAX_INDEX)];
  const unacknowledged = status === "open" ? UNACKNOWLEDGED_BONUS : 0;
  // Hours clamped at zero so a skewed `now` can never award a staleness bonus.
  const hours = Math.max(0, Math.floor((now - lastSeen) / SECONDS_PER_HOUR));
  // `0 - x` rather than `-x`: unary negation of 0 yields -0, which is a
  // distinct value that survives into snapshots and sync payloads and
  // compares unequal to 0 under Object.is. Binary subtraction yields +0.
  const staleness = 0 - Math.min(hours * STALENESS_PER_HOUR, STALENESS_MAX);

  const total = base + corroboration + people + unacknowledged + staleness;
  // R-2: resolved is exactly 0, and open never drops below 0, so an open
  // incident can never sort underneath a resolved one.
  const score =
    status === "resolved" ? RESOLVED_SCORE : Math.max(MIN_OPEN_SCORE, total);

  return {
    score,
    breakdown: { base, corroboration, people, unacknowledged, staleness, total },
  };
}

function buildIncident(
  category: Category,
  members: Observation[],
  statuses: Observation[],
  now: number,
): Incident {
  const sorted = [...members].sort((a, b) => compareIds(a.id, b.id));
  const observationIds = sorted.map((o) => o.id);

  const devices = new Set<string>();
  let peopleAffected = 0;
  let firstSeen = sorted[0].created_at;
  let lastSeen = sorted[0].created_at;
  let areaText: string | undefined;
  let latSum = 0;
  let lonSum = 0;
  const fixes: Observation[] = [];

  for (const o of sorted) {
    devices.add(o.device_id);
    if (typeof o.people === "number" && Number.isFinite(o.people)) {
      const people = Math.max(0, Math.floor(o.people));
      if (people > peopleAffected) peopleAffected = people;
    }
    if (o.created_at < firstSeen) firstSeen = o.created_at;
    if (o.created_at > lastSeen) lastSeen = o.created_at;
    if (hasFix(o)) {
      fixes.push(o);
      latSum += o.lat as number;
      lonSum += o.lon as number;
    }
    if (areaText === undefined && normalizeArea(o.area_text)) {
      areaText = o.area_text;
    }
  }

  // ponytail: O(k^2) over an incident's GPS members. Incidents are small;
  // revisit only if one ever holds thousands of fixes.
  let spatialExtentM = 0;
  for (let i = 0; i < fixes.length; i++) {
    for (let j = i + 1; j < fixes.length; j++) {
      const metres = haversineMetres(
        fixes[i].lat as number,
        fixes[i].lon as number,
        fixes[j].lat as number,
        fixes[j].lon as number,
      );
      if (metres > spatialExtentM) spatialExtentM = metres;
    }
  }

  const status = statusOf(new Set(observationIds), lastSeen, statuses);
  const reporters = devices.size;
  const { score, breakdown } = scoreOf(
    category,
    reporters,
    peopleAffected,
    lastSeen,
    status,
    now,
  );

  const incident: Incident = {
    key: observationIds[0],
    category,
    observationIds,
    independentReporters: reporters,
    corroboration: corroborationOf(reporters),
    peopleAffected,
    firstSeen,
    lastSeen,
    spatialExtentM: Math.round(spatialExtentM),
    status,
    score,
    breakdown,
  };
  if (fixes.length > 0) {
    incident.centroid = {
      lat: latSum / fixes.length,
      lon: lonSum / fixes.length,
    };
  }
  if (areaText !== undefined) incident.areaText = areaText;
  return incident;
}

/** ARCHITECTURE section 3 step 6. Resolved always last, by status not score. */
function byRank(a: Incident, b: Incident): number {
  const aResolved = a.status === "resolved" ? 1 : 0;
  const bResolved = b.status === "resolved" ? 1 : 0;
  if (aResolved !== bResolved) return aResolved - bResolved;
  if (a.score !== b.score) return b.score - a.score;
  if (a.lastSeen !== b.lastSeen) return b.lastSeen - a.lastSeen;
  return compareIds(a.key, b.key);
}

/**
 * FR-003. Groups the observation set into ranked, corroborated incidents.
 * Output depends only on the set and `now`, never on arrival order.
 */
export function compute(observations: Observation[], now: number): Incident[] {
  const reports: Observation[] = [];
  const statuses: Observation[] = [];
  for (const o of observations) {
    if (o.type === "STATUS") {
      statuses.push(o);
      continue;
    }
    // BR-006: check-ins never form incidents.
    if (!o.category || o.category === SAFE_CHECKIN) continue;
    reports.push(o);
  }

  const byCategory = new Map<Category, Observation[]>();
  for (const o of reports) {
    const category = o.category as Category;
    const list = byCategory.get(category);
    if (list) list.push(o);
    else byCategory.set(category, [o]);
  }

  const incidents: Incident[] = [];
  for (const category of [...byCategory.keys()].sort()) {
    const list = byCategory.get(category) as Observation[];
    list.sort(byTimeThenId);
    const ds = new DisjointSet(list.length);
    linkByDistance(list, ds);
    linkByAreaText(list, ds);
    for (const members of groupsOf(list, ds)) {
      incidents.push(buildIncident(category, members, statuses, now));
    }
  }

  incidents.sort(byRank);
  return incidents;
}

/** BR-006: per-area counts, keyed by normalized area text (required by R-7). */
export function safeCheckinCounts(
  observations: Observation[],
): SafeCheckinCounts {
  const counts: SafeCheckinCounts = {};
  for (const o of observations) {
    if (o.type !== "REPORT" || o.category !== SAFE_CHECKIN) continue;
    const area = normalizeArea(o.area_text);
    if (!area) continue;
    counts[area] = (counts[area] ?? 0) + 1;
  }
  return counts;
}
