// Information gaps per area, with reasons (spec §4.2, §5; D-038).
// "No reports" is a gap, never "safe". Every gap says why, in codes the UI
// words. Thresholds come only from rules.ts. Pure TypeScript.

import { coverageByArea } from "./Coverage";
import { compute, normalizeArea } from "./IncidentEngine";
import { CORROBORATED_AT, COVERAGE_WINDOW_SECONDS } from "./rules";
import type { Category, Observation } from "./types";

export type GapReason =
  | "no_observations" // an expected area nobody has reported from
  | "stale" // nothing newer than the coverage window
  | "single_source" // only one phone reported from the area lately
  | "uncertain"; // an open incident there rests on one phone

export interface AreaGap {
  /** Normalized area text; null = "No area named". */
  area: string | null;
  label: string | null;
  reasons: GapReason[];
  lastObservedAt: number | null;
  /** Distinct phones within the coverage window. */
  sourceCount: number;
  /** D-037: categories a sweep checked here lately and did not see. Never "safe". */
  notSeenWhenChecked: Category[];
}

/** Every area the station knows of, worst first, each with its reasons (possibly none). */
export function areaGaps(held: Observation[], now: number, expectedAreas: readonly string[] = []): AreaGap[] {
  const openIncidents = compute(held, now).filter((i) => i.status !== "resolved");
  return coverageByArea(held, now, expectedAreas).map((c) => {
    const reasons: GapReason[] = [];
    if (c.level === "none") reasons.push("no_observations");
    if (c.level === "stale") reasons.push("stale");
    if (c.level !== "none" && c.level !== "stale" && c.distinctDevices < CORROBORATED_AT) reasons.push("single_source");
    if (
      c.area !== null &&
      openIncidents.some((i) => normalizeArea(i.areaText) === c.area && i.independentReporters < CORROBORATED_AT)
    ) {
      reasons.push("uncertain");
    }
    const notSeen = new Set<Category>();
    for (const o of held) {
      if (o.type !== "CHECK" || !o.category || now - o.created_at >= COVERAGE_WINDOW_SECONDS) continue;
      if (normalizeArea(o.area_text) === c.area) notSeen.add(o.category);
    }
    return {
      area: c.area,
      label: c.label,
      reasons,
      lastObservedAt: c.lastObservationAt,
      sourceCount: c.distinctDevices,
      notSeenWhenChecked: [...notSeen].sort(),
    };
  });
}
