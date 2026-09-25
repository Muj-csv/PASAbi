// Data shapes shared by the engine, the store and the UI.
// Pure TypeScript: no react, no react-native, no DOM (CLAUDE.md).

/** BR-001. */
export type Category =
  | "MEDICAL"
  | "TRAPPED"
  | "STRUCTURAL"
  | "FLOOD"
  | "ROAD_BLOCKED"
  | "MISSING_PERSON"
  | "WATER_FOOD"
  | "SHELTER"
  | "SAFE_CHECKIN";

export type ObservationType = "REPORT" | "STATUS";

/** BR-007. */
export type StatusAction = "ACK" | "RESOLVE";

/**
 * BR-002: immutable, identified by a lowercase UUIDv4. Only ever added or
 * evicted, never edited. Times are integer epoch SECONDS (NFR-002).
 */
export interface Observation {
  id: string;
  type: ObservationType;
  category?: Category;
  people?: number;
  note?: string;
  lat?: number;
  lon?: number;
  accuracy_m?: number;
  area_text?: string;
  created_at: number;
  device_id: string;
  /** STATUS only: the observation IDs this status refers to. */
  refs?: string[];
  /** STATUS only. */
  action?: StatusAction;
  sig?: string;

  // Local-only fields. Never sent over the wire.
  received_at?: number;
  hops?: number;
  own?: boolean;
  uploaded?: boolean;
}

/** BR-007. */
export type IncidentStatus = "open" | "acknowledged" | "resolved";

/** BR-004. */
export type CorroborationLevel =
  | "single"
  | "corroborated"
  | "strongly_corroborated";

/**
 * BR-005, every term kept so the UI can show "why ranked here" (FR-006).
 * `total` is the raw sum before the open-incident clamp at 0 (R-2), so the
 * breakdown stays honest even when the displayed score is floored.
 */
export interface ScoreBreakdown {
  base: number;
  corroboration: number;
  people: number;
  unacknowledged: number;
  staleness: number;
  total: number;
}

export interface Incident {
  /** Smallest observation ID in the group, lowercase UUID ordering (R-8). */
  key: string;
  category: Category;
  /** Ascending, so output is order-independent (NFR-002). */
  observationIds: string[];
  independentReporters: number;
  corroboration: CorroborationLevel;
  peopleAffected: number;
  firstSeen: number;
  lastSeen: number;
  /** Mean of members that have a GPS fix. Absent when none do. */
  centroid?: { lat: number; lon: number };
  /** Raw area text of the lowest-ID member that has one. */
  areaText?: string;
  /** Greatest distance between any two GPS members, whole metres (D-010). */
  spatialExtentM: number;
  status: IncidentStatus;
  score: number;
  breakdown: ScoreBreakdown;
}

/** BR-006: per-area counts, keyed by normalized area text. */
export type SafeCheckinCounts = Record<string, number>;
