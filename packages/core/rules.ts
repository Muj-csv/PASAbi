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
