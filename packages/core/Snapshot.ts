// "What changed since last seen". FR-007, ARCHITECTURE section 3.
// Pure TypeScript: no react, no react-native, no DOM (CLAUDE.md).

import type { Incident, IncidentStatus } from "./types";

export type IncidentChange =
  | "new"
  | "escalated"
  | "newly_corroborated"
  | "resolved";

export interface SnapshotIncident {
  key: string;
  score: number;
  reporters: number;
  status: IncidentStatus;
  /** What the diff matches on. Keys are not stable; membership is. */
  observationIds: string[];
}

export interface StationSnapshot {
  /** Integer epoch seconds, taken when the operator marked the board seen. */
  takenAt: number;
  incidents: SnapshotIncident[];
}

export function snapshotOf(
  incidents: Incident[],
  takenAt: number,
): StationSnapshot {
  return {
    takenAt,
    incidents: incidents.map((i) => ({
      key: i.key,
      score: i.score,
      reporters: i.independentReporters,
      status: i.status,
      observationIds: [...i.observationIds],
    })),
  };
}

/**
 * Incidents are matched across snapshots by OVERLAPPING OBSERVATION IDS, not
 * by key. The key is the smallest observation ID in the group, so evicting
 * that one observation renames the incident even though nothing about the
 * situation changed. Matching on membership survives that, and it also
 * survives two incidents merging as a chain fills in (D-010).
 *
 * Where several previous incidents overlap, the one sharing the most
 * observations wins, with the lowest key breaking a tie so the result stays
 * deterministic (NFR-002).
 */
function matchPrevious(
  current: Incident,
  previous: StationSnapshot,
): SnapshotIncident | null {
  const ids = new Set(current.observationIds);
  let best: SnapshotIncident | null = null;
  let bestOverlap = 0;

  for (const candidate of previous.incidents) {
    let overlap = 0;
    for (const id of candidate.observationIds) if (ids.has(id)) overlap += 1;
    if (overlap === 0) continue;
    if (
      overlap > bestOverlap ||
      (overlap === bestOverlap && (best === null || candidate.key < best.key))
    ) {
      best = candidate;
      bestOverlap = overlap;
    }
  }

  return best;
}

/**
 * FR-007. Returns only the incidents that changed, keyed by CURRENT key.
 *
 * With no previous snapshot the result is empty rather than "everything is
 * new": the operator has not established a baseline yet, and opening the
 * board to a wall of highlights is noise, not signal. The first
 * "Mark as seen" is what starts the tracking.
 */
export function changesSince(
  previous: StationSnapshot | null,
  current: Incident[],
): Map<string, IncidentChange[]> {
  const changes = new Map<string, IncidentChange[]>();
  if (!previous) return changes;

  for (const incident of current) {
    const before = matchPrevious(incident, previous);

    if (before === null) {
      changes.set(incident.key, ["new"]);
      continue;
    }

    const found: IncidentChange[] = [];
    // Score rises when a report is added or corroboration grows, and falls
    // with staleness, so only an increase counts as escalation.
    if (incident.score > before.score) found.push("escalated");
    if (incident.independentReporters > before.reporters) {
      found.push("newly_corroborated");
    }
    if (incident.status === "resolved" && before.status !== "resolved") {
      found.push("resolved");
    }

    if (found.length > 0) changes.set(incident.key, found);
  }

  return changes;
}
