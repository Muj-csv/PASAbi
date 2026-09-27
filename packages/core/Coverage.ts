// Coverage per area: "no report is not the same as safe". BR-014, FR-017.
// Pure TypeScript: no react, no react-native, no DOM (CLAUDE.md). R5.
//
// Reads ALL observation types, because any activity from an area is
// evidence someone is there. `now` is a parameter; nothing here reads a
// clock (NFR-002).

import { normalizeArea } from "./IncidentEngine";
import {
  COVERAGE_HIGH_DEVICES,
  COVERAGE_STALE_SECONDS,
  COVERAGE_WINDOW_SECONDS,
} from "./rules";
import type { Observation } from "./types";

/**
 * BR-014. "none" is an expected area with no observations at all: the UI
 * always says it does not mean the area is safe.
 */
export type CoverageLevel = "high" | "limited" | "stale" | "none";

export interface AreaCoverage {
  /** Normalized area text; null for the "No area named" bucket. */
  area: string | null;
  /** How people wrote it (the latest observation's text); null for the bucket. */
  label: string | null;
  level: CoverageLevel;
  /** Latest observation from the area; null when there is none. */
  lastObservationAt: number | null;
  /** Distinct phones that reported from the area in the last window. */
  distinctDevices: number;
}

const LEVEL_ORDER: Record<CoverageLevel, number> = {
  none: 0,
  stale: 1,
  limited: 2,
  high: 3,
};

function hasFix(o: Observation): boolean {
  return (
    typeof o.lat === "number" &&
    typeof o.lon === "number" &&
    Number.isFinite(o.lat) &&
    Number.isFinite(o.lon)
  );
}

interface Bucket {
  area: string | null;
  label: string | null;
  labelAt: number;
  labelId: string;
  last: number;
  devices: Set<string>;
}

/**
 * FR-017. One row per area, thinnest information first (none, stale,
 * limited, high), then by area name, with "No area named" last in its level.
 * An observation with neither area text nor GPS (a STATUS action, say)
 * belongs to no area and is skipped.
 */
export function coverageByArea(
  observations: Observation[],
  now: number,
  expectedAreas: readonly string[] = [],
): AreaCoverage[] {
  const buckets = new Map<string | null, Bucket>();

  for (const o of observations) {
    const normalized = normalizeArea(o.area_text);
    const area = normalized ? normalized : hasFix(o) ? null : undefined;
    if (area === undefined) continue;

    let b = buckets.get(area);
    if (!b) {
      b = {
        area,
        label: null,
        labelAt: -Infinity,
        labelId: "",
        last: -Infinity,
        devices: new Set(),
      };
      buckets.set(area, b);
    }
    if (o.created_at > b.last) b.last = o.created_at;
    if (now - o.created_at < COVERAGE_WINDOW_SECONDS) b.devices.add(o.device_id);
    // Show the most recent spelling; ties by ID so the result is order-free.
    if (
      area !== null &&
      (o.created_at > b.labelAt ||
        (o.created_at === b.labelAt && o.id < b.labelId))
    ) {
      b.label = (o.area_text ?? "").trim();
      b.labelAt = o.created_at;
      b.labelId = o.id;
    }
  }

  const rows: AreaCoverage[] = [...buckets.values()].map((b) => ({
    area: b.area,
    label: b.label,
    level:
      now - b.last >= COVERAGE_STALE_SECONDS
        ? "stale"
        : b.devices.size >= COVERAGE_HIGH_DEVICES
          ? "high"
          : "limited",
    lastObservationAt: b.last,
    distinctDevices: b.devices.size,
  }));

  // Expected areas with no observations: silence, shown as missing
  // information. The smallest spelling wins so input order never matters.
  const missing = new Map<string, string>();
  for (const raw of expectedAreas) {
    const area = normalizeArea(raw);
    if (!area || buckets.has(area)) continue;
    const label = raw.trim();
    const seen = missing.get(area);
    if (seen === undefined || label < seen) missing.set(area, label);
  }
  for (const [area, label] of missing) {
    rows.push({
      area,
      label,
      level: "none",
      lastObservationAt: null,
      distinctDevices: 0,
    });
  }

  return rows.sort((a, b) => {
    if (a.level !== b.level) return LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
    if (a.area === null) return b.area === null ? 0 : 1;
    if (b.area === null) return -1;
    return a.area < b.area ? -1 : a.area > b.area ? 1 : 0;
  });
}
