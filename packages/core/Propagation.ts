// Honest propagation status for the reporter. BR-015, FR-015, R3.
// Pure TypeScript: no react, no react-native, no DOM (CLAUDE.md).
//
// A reporter sees only what their phone actually knows about where a report
// went: a receipt it scanned, or a sync it completed. Never that responders
// or emergency services received anything (BR-017).

import type { Incident, Observation } from "./types";
import type { Role } from "./wire";

/**
 * Records that these observations left this phone: set by a scanned QR
 * receipt now, and by SyncSession's onSent later. Only this phone's OWN
 * observations are marked (a carried report's status belongs to the phone
 * that made it), and the flags only ever go from false to true.
 *
 * Like `uploaded`, these are local-only fields about this phone's
 * relationship to an observation, never part of it, so BR-002 holds and
 * toWire keeps them off the wire (BR-016).
 */
export function markPropagated(
  held: Observation[],
  sentIds: string[],
  peerRole: Role,
): Observation[] {
  const sent = new Set(sentIds);
  return held.map((o) => {
    if (o.own !== true || !sent.has(o.id)) return o;
    const reachedStation = o.reached_station === true || peerRole === "station";
    if (o.passed_on === true && o.reached_station === reachedStation) return o;
    return { ...o, passed_on: true, reached_station: reachedStation };
  });
}

export interface Propagation {
  passedOn: boolean;
  reachedStation: boolean;
  uploaded: boolean;
  /** Other phones reporting the same incident (BR-004 counts phones). */
  groupedWith: number;
}

/**
 * FR-015: the status of each of this phone's own observations. Each flag is
 * reported as it is; a stronger step never implies a weaker one, because an
 * observation can be uploaded without ever having been passed on.
 */
export function propagationFor(
  held: Observation[],
  incidents: Incident[],
): Map<string, Propagation> {
  const reporters = new Map<string, number>();
  for (const incident of incidents) {
    for (const id of incident.observationIds) {
      reporters.set(id, incident.independentReporters);
    }
  }

  const status = new Map<string, Propagation>();
  for (const o of held) {
    if (o.own !== true) continue;
    status.set(o.id, {
      passedOn: o.passed_on === true,
      reachedStation: o.reached_station === true,
      uploaded: o.uploaded === true,
      groupedWith: Math.max(0, (reporters.get(o.id) ?? 1) - 1),
    });
  }
  return status;
}
