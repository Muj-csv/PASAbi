// The single source of truth for every tunable in Pasabi (PRD section 7).
// Nothing else may hard-code a threshold or a weight (CLAUDE.md).
// Changing a value here is a decision: see docs/DECISIONS.md, D-003.

import type { Category } from "./types";

/** Wire-protocol version carried in every HELLO. ARCHITECTURE section 4. */
export const PROTO_VERSION = 1;

// ---------------------------------------------------------------- BR-001

export const CATEGORIES: readonly Category[] = [
  "MEDICAL",
  "TRAPPED",
  "STRUCTURAL",
  "FLOOD",
  "ROAD_BLOCKED",
  "MISSING_PERSON",
  "WATER_FOOD",
  "SHELTER",
  "SAFE_CHECKIN",
];

/** BR-006: this one never forms incidents. */
export const SAFE_CHECKIN: Category = "SAFE_CHECKIN";

// ---------------------------------------------------------------- BR-003

/** Grouping radius in metres, used only when BOTH observations have a fix. */
export const R_METRES = 150;

/** Grouping window in seconds (6 h). */
export const T_SECONDS = 6 * 3600;

// ---------------------------------------------------------------- BR-004

export const CORROBORATED_AT = 2;
export const STRONGLY_CORROBORATED_AT = 3;

// ---------------------------------------------------------------- BR-005

export const CATEGORY_BASE: Record<Category, number> = {
  MEDICAL: 50,
  TRAPPED: 50,
  STRUCTURAL: 35,
  FLOOD: 30,
  MISSING_PERSON: 30,
  ROAD_BLOCKED: 20,
  WATER_FOOD: 20,
  SHELTER: 15,
  // Never scored: SAFE_CHECKIN forms no incidents (BR-006). Present so the
  // record is total and a missing category cannot silently read undefined.
  SAFE_CHECKIN: 0,
};

/** Per independent reporter beyond the first. */
export const CORROBORATION_PER_EXTRA_REPORTER = 10;
export const CORROBORATION_BONUS_MAX = 30;

/**
 * R-3: replaces 5 x log2(1 + people). Integer lookup, so scoring has no
 * floating point at all and cannot drift between runtimes (NFR-002).
 * The term caps at +20 once people reaches 15, so 0..15 is the whole domain.
 * Index = min(people, 15).
 */
export const PEOPLE_BONUS: readonly number[] = [
  0, 5, 8, 10, 12, 13, 14, 15, 16, 17, 17, 18, 19, 19, 20, 20,
];

export const PEOPLE_BONUS_MAX_INDEX = PEOPLE_BONUS.length - 1;

export const UNACKNOWLEDGED_BONUS = 10;

/** Subtracted per whole hour since the latest observation. */
export const STALENESS_PER_HOUR = 1;
export const STALENESS_MAX = 20;

/** R-2: open incidents never score below this. Resolved score exactly 0. */
export const MIN_OPEN_SCORE = 0;
export const RESOLVED_SCORE = 0;

// ---------------------------------------------------------------- BR-008

/**
 * R-5: 500, not 300. BR-009 and BR-010 together permit at most
 * RATE_LIMIT_PER_HOUR * (TTL_SECONDS / 3600) = 432 own observations, so a
 * resident store above that can never fill with un-evictable own data.
 */
export const CAPACITY_RESIDENT = 500;
export const CAPACITY_STATION = 3000;

// ---------------------------------------------------------------- BR-009

export const TTL_SECONDS = 72 * 3600;
export const TTL_SAFE_CHECKIN_SECONDS = 24 * 3600;

// ---------------------------------------------------------------- BR-010

export const RATE_LIMIT_PER_HOUR = 6;
export const RATE_LIMIT_WINDOW_SECONDS = 3600;

/**
 * The R-5 invariant, asserted by a test rather than trusted: the most own
 * observations a device can hold must stay below resident capacity.
 */
export const MAX_OWN_OBSERVATIONS =
  RATE_LIMIT_PER_HOUR * (TTL_SECONDS / RATE_LIMIT_WINDOW_SECONDS);

// ------------------------------------------- Encounter sync (ARCHITECTURE 4)

/** FR-005 and NFR-004: one encounter gets ten seconds. */
export const SYNC_BUDGET_MS = 10000;

/** Skip a peer for two minutes after a sync that exchanged nothing. */
export const PEER_COOLDOWN_MS = 120000;

/** Ceiling for a single payload. Adapters may report less; never more. */
export const MAX_PAYLOAD_BYTES = 30000;

// ------------------------------------ Evidence and freshness (BR-011, R1)
// Separate from the score's staleness term, which is unchanged. Initial
// values, to tune after the field test (D-023).

/** D-023: latest evidence younger than this is FRESH (age < 3600). */
export const FRESH_MAX_AGE_SECONDS = 60 * 60;

/** D-023: latest evidence this old or older is STALE (age >= 10800). */
export const STALE_MIN_AGE_SECONDS = 3 * 60 * 60;

/**
 * ARCHITECTURE section 3a: timeline sources show this many characters of
 * device_id. Four collide too often (about 7 % among 100 devices).
 */
export const SOURCE_LABEL_CHARS = 6;

// --------------------------------------- QR bundle transfer (R2, ADR-008)

/**
 * D-027: payload characters per frame, after deflate + base64 (was 700).
 * 60 observations fit in about 18 frames at QR version 18. The RS spike
 * confirms or lowers this; its fallback is 400.
 */
export const QR_FRAME_CHARS = 500;

/** D-025: observations per page, most urgent first. Spike fallback: 20. */
export const QR_MAX_OBSERVATIONS = 60;

/** Auto-advance on the showing phone. */
export const QR_FRAME_INTERVAL_MS = 400;

/** D-025: receivers whose acknowledgements a sender remembers. */
export const QR_ACK_MEMORY_RECEIVERS = 20;

// ------------------------------------- Information gaps (BR-013, R4)

/**
 * D-023: "nearby" for related incidents, measured member to member, not
 * centroid to centroid (3.5 % of benchmark incidents span more than 300 m).
 */
export const GAP_RADIUS_METRES = 300;

/**
 * BR-013: for each category, the related problems worth asking about.
 * Each is either reported nearby (known) or not yet reported (unknown).
 */
export const GAP_QUESTIONS: Record<Category, readonly Category[]> = {
  FLOOD: ["TRAPPED", "MEDICAL", "ROAD_BLOCKED", "SHELTER"],
  TRAPPED: ["MEDICAL", "ROAD_BLOCKED"],
  MEDICAL: ["TRAPPED", "ROAD_BLOCKED"],
  STRUCTURAL: ["TRAPPED", "MEDICAL"],
  ROAD_BLOCKED: ["TRAPPED", "MEDICAL"],
  MISSING_PERSON: ["TRAPPED", "MEDICAL"],
  WATER_FOOD: ["SHELTER", "MEDICAL"],
  SHELTER: ["WATER_FOOD", "MEDICAL"],
  SAFE_CHECKIN: [],
};

// ----------------------------------- Coverage per area (BR-014, R5)
// Initial values, to tune after the field test (D-023).

/** D-023: distinct devices are counted over this window (age < 3 h). */
export const COVERAGE_WINDOW_SECONDS = 3 * 60 * 60;

/** D-023: this many distinct devices in the window is HIGH coverage. */
export const COVERAGE_HIGH_DEVICES = 3;

/** D-023: an area whose latest observation is this old or older is STALE. */
export const COVERAGE_STALE_SECONDS = 3 * 60 * 60;

/** Expected areas (puroks) a station can list; a small cap keeps it a list. */
export const EXPECTED_AREAS_MAX = 50;
