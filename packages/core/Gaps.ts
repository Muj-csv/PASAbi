// Information gaps: what is known nearby, and what is not yet reported.
// BR-013, FR-016, ARCHITECTURE 3a. R4.
// Pure TypeScript: no react, no react-native, no DOM (CLAUDE.md).
//
// Computed FROM compute() output and never fed back into it. An unknown is
// a missing REPORT, never an absence: the UI says "no report yet of people
// trapped nearby", never "no one trapped" (BR-017).

import { haversineMetres, normalizeArea } from "./IncidentEngine";
import { GAP_QUESTIONS, GAP_RADIUS_METRES, T_SECONDS } from "./rules";
import type { Category, Incident, Observation } from "./types";

export interface KnownGap {
  category: Category;
  /** The related incident, so the UI can open it. */
  key: string;
  sourceCount: number;
}

export interface Gaps {
  /** Related categories reported nearby, in GAP_QUESTIONS order. */
  known: KnownGap[];
  /** Related categories with no report nearby yet, in GAP_QUESTIONS order. */
  unknown: Category[];
  /** No member reported a people count: "not reported", never "none". */
  peopleUnknown: boolean;
}

interface Place {
  fixes: { lat: number; lon: number }[];
  areas: Set<string>;
}

function placeOf(incident: Incident, byId: Map<string, Observation>): Place {
  const place: Place = { fixes: [], areas: new Set() };
  for (const id of incident.observationIds) {
    const o = byId.get(id);
    if (!o) continue;
    if (
      typeof o.lat === "number" &&
      typeof o.lon === "number" &&
      Number.isFinite(o.lat) &&
      Number.isFinite(o.lon)
    ) {
      place.fixes.push({ lat: o.lat, lon: o.lon });
    }
    const area = normalizeArea(o.area_text);
    if (area) place.areas.add(area);
  }
  return place;
}

/**
 * BR-013 "nearby": any GPS member of one within GAP_RADIUS_METRES of any GPS
 * member of the other (member to member, because a chained incident can be
 * wider than the radius, ARGUS finding 4). When either has no GPS members,
 * a shared normalized area text stands in, as it does for grouping (R-1).
 */
function isNearby(a: Place, b: Place): boolean {
  if (a.fixes.length > 0 && b.fixes.length > 0) {
    for (const p of a.fixes) {
      for (const q of b.fixes) {
        if (haversineMetres(p.lat, p.lon, q.lat, q.lon) <= GAP_RADIUS_METRES) {
          return true;
        }
      }
    }
    return false;
  }
  for (const area of a.areas) if (b.areas.has(area)) return true;
  return false;
}

/**
 * FR-016 for ONE incident, the one being viewed. ponytail: every candidate
 * is checked member to member, O(incidents x members^2); fine per viewed
 * incident (0.04 ms on the 1,705-incident benchmark), too slow to run for a
 * whole board on every change (110 ms), which is why nothing does.
 *
 * `allIncidents` is compute() output, already in rank order, so when several
 * related incidents qualify the highest ranked one is named.
 */
export function gapsFor(
  incident: Incident,
  allIncidents: Incident[],
  observations: Observation[],
): Gaps {
  const byId = new Map(observations.map((o) => [o.id, o]));
  const here = placeOf(incident, byId);

  const known: KnownGap[] = [];
  const unknown: Category[] = [];
  for (const category of GAP_QUESTIONS[incident.category]) {
    const match = allIncidents.find(
      (other) =>
        other.category === category &&
        other.status !== "resolved" &&
        Math.abs(other.lastSeen - incident.lastSeen) <= T_SECONDS &&
        isNearby(here, placeOf(other, byId)),
    );
    if (match) {
      known.push({
        category,
        key: match.key,
        sourceCount: match.independentReporters,
      });
    } else {
      unknown.push(category);
    }
  }

  return { known, unknown, peopleUnknown: incident.peopleAffected === 0 };
}
