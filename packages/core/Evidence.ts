// Evidence and "Last Known Truth". FR-014, BR-011, BR-012, ARCHITECTURE 3a.
// Pure TypeScript: no react, no react-native, no DOM (CLAUDE.md).
//
// Computed FROM compute() output and never fed back into it, so grouping,
// scoring and status are untouched and the engine's vectors stay valid.
// `now` is a parameter; nothing here reads a clock (NFR-002).

import { statusRefersTo } from "./IncidentEngine";
import {
  FRESH_MAX_AGE_SECONDS,
  SOURCE_LABEL_CHARS,
  STALE_MIN_AGE_SECONDS,
} from "./rules";
import type {
  Category,
  Incident,
  Observation,
  ObservationType,
  StatusAction,
} from "./types";

/** BR-011. A separate field from `status`, never a new IncidentStatus. */
export type Freshness = "fresh" | "aging" | "stale";

export interface TimelineEntry {
  id: string;
  type: ObservationType;
  category?: Category;
  action?: StatusAction;
  people?: number;
  note?: string;
  area_text?: string;
  /** Pseudonymous: the first SOURCE_LABEL_CHARS of device_id (NFR-007). */
  source: string;
  created_at: number;
}

export interface Evidence {
  /** REPORT observations in the incident (BR-012). */
  reportCount: number;
  /** Independent reporters: distinct phones, not people (BR-004). */
  sourceCount: number;
  firstSeen: number;
  lastSeen: number;
  /** now - lastSeen, floored at 0 so a clock behind never reads negative. */
  latestAgeSeconds: number;
  freshness: Freshness;
  /** Reports and the statuses referencing them, oldest first, then by ID. */
  timeline: TimelineEntry[];
}

/** BR-011 boundaries: fresh if age < 3600, stale if age >= 10800. */
export function freshnessOf(ageSeconds: number): Freshness {
  if (ageSeconds < FRESH_MAX_AGE_SECONDS) return "fresh";
  if (ageSeconds >= STALE_MIN_AGE_SECONDS) return "stale";
  return "aging";
}

export function sourceLabel(deviceId: string): string {
  return deviceId.slice(0, SOURCE_LABEL_CHARS);
}

function entryOf(o: Observation): TimelineEntry {
  const entry: TimelineEntry = {
    id: o.id,
    type: o.type,
    source: sourceLabel(o.device_id),
    created_at: o.created_at,
  };
  if (o.category !== undefined) entry.category = o.category;
  if (o.action !== undefined) entry.action = o.action;
  if (o.people !== undefined) entry.people = o.people;
  if (o.note !== undefined) entry.note = o.note;
  if (o.area_text !== undefined) entry.area_text = o.area_text;
  return entry;
}

function byTimeThenId(a: TimelineEntry, b: TimelineEntry): number {
  if (a.created_at !== b.created_at) return a.created_at - b.created_at;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** FR-014: how do we know, and how recent is it? */
export function evidenceOf(
  incident: Incident,
  observations: Observation[],
  now: number,
): Evidence {
  const members = new Set(incident.observationIds);
  const timeline = observations
    .filter(
      (o) =>
        members.has(o.id) ||
        (o.type === "STATUS" && statusRefersTo(o, members)),
    )
    .map(entryOf)
    .sort(byTimeThenId);

  const latestAgeSeconds = Math.max(0, now - incident.lastSeen);
  return {
    reportCount: incident.observationIds.length,
    sourceCount: incident.independentReporters,
    firstSeen: incident.firstSeen,
    lastSeen: incident.lastSeen,
    latestAgeSeconds,
    freshness: freshnessOf(latestAgeSeconds),
    timeline,
  };
}
