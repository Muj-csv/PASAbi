// Incident Passport (spec §3, D-035, D-039, D-040). A portable, self-
// explaining document for ONE incident, built on demand. It is a derived
// document, never incident state: between PASAbi phones only its
// `supportingEvidence` (wire-format observations) ever travels, and the
// receiving phone re-derives the incident itself (ADR-002).
// Pure TypeScript: no react, no react-native, no DOM (CLAUDE.md).

import { compute } from "./IncidentEngine";
import { evidenceOf, type Freshness, type TimelineEntry } from "./Evidence";
import { gapsFor, type KnownGap } from "./Gaps";
import { isObservation, toWire } from "./ingest";
import { R_METRES } from "./rules";
import type {
  Category,
  CorroborationLevel,
  IncidentStatus,
  Observation,
  ScoreBreakdown,
} from "./types";
import { epochSecondsToIso } from "./upload";

export const PASSPORT_SCHEMA = "pasabi.incident-passport";
export const PASSPORT_VERSION = 1;

/** Why this picture might be wrong or incomplete. Codes; the UI words them. */
export type UncertaintyCode =
  | "single_source" // one phone only: nothing independent backs it
  | "aging" // latest report 1–3 h old
  | "stale" // latest report over 3 h old: may have changed
  | "people_not_reported" // no report gave a count
  | "wide_spread"; // reports span more than the grouping radius (chain risk, §6)

/** Fixed caveats every reader must see (BR-012, BR-013, BR-017). */
export type CaveatCode = "counts_phones_not_people" | "not_verified" | "no_report_is_not_none";

export interface PropagationEntry {
  observationId: string;
  /** This phone made it. */
  own: boolean;
  /** When this phone received it (not when it was reported). */
  receivedAt: string | null;
  /** D-039: only what THIS phone can prove; the full relay chain is not kept. */
  passedOn: boolean;
  reachedStation: boolean;
  uploaded: boolean;
}

export interface IncidentPassport {
  schema: typeof PASSPORT_SCHEMA;
  version: typeof PASSPORT_VERSION;
  generatedAt: string;
  incidentId: string;
  category: Category;
  location: {
    areaText: string | null;
    centroid: { lat: number; lon: number } | null;
    spatialExtentM: number;
  };
  /** The LARGEST count any single report gave, not a total or a latest. */
  affectedPeople: { upTo: number | null; reported: boolean };
  firstObservedAt: string;
  lastObservedAt: string;
  freshness: { state: Freshness; latestAgeSeconds: number };
  reportCount: number;
  independentSourceCount: number;
  corroboration: CorroborationLevel;
  currentStatus: IncidentStatus;
  /** Rule-based rank, with every term (ADR-004). Never a danger rating. */
  ranking: { score: number; breakdown: ScoreBreakdown };
  evidenceTimeline: (Omit<TimelineEntry, "created_at"> & { at: string })[];
  uncertainty: UncertaintyCode[];
  unknowns: { notYetReportedNearby: Category[]; peopleUnknown: boolean };
  knownNearby: KnownGap[];
  spatialExtent: { metres: number };
  propagationHistory: PropagationEntry[];
  /** The observations behind it, wire fields only (BR-016). */
  supportingEvidence: Observation[];
  caveats: CaveatCode[];
}

/**
 * Builds the Passport for one incident from what this phone holds, or null
 * if the key no longer names an incident (keys follow the smallest member).
 */
export function passportOf(incidentKey: string, held: Observation[], now: number): IncidentPassport | null {
  const incidents = compute(held, now);
  const incident =
    incidents.find((i) => i.key === incidentKey) ??
    incidents.find((i) => i.observationIds.includes(incidentKey));
  if (!incident) return null;

  const evidence = evidenceOf(incident, held, now);
  const gaps = gapsFor(incident, incidents, held);
  const members = new Set(incident.observationIds);
  const inTimeline = new Set(evidence.timeline.map((e) => e.id));
  // Reports plus the statuses that answer them, the same set the timeline shows.
  const supporting = held.filter((o) => members.has(o.id) || inTimeline.has(o.id));

  const uncertainty: UncertaintyCode[] = [];
  if (evidence.sourceCount <= 1) uncertainty.push("single_source");
  if (evidence.freshness === "aging") uncertainty.push("aging");
  if (evidence.freshness === "stale") uncertainty.push("stale");
  if (gaps.peopleUnknown) uncertainty.push("people_not_reported");
  if (incident.spatialExtentM > R_METRES) uncertainty.push("wide_spread");

  return {
    schema: PASSPORT_SCHEMA,
    version: PASSPORT_VERSION,
    generatedAt: epochSecondsToIso(now),
    incidentId: incident.key,
    category: incident.category,
    location: {
      areaText: incident.areaText ?? null,
      centroid: incident.centroid ?? null,
      spatialExtentM: incident.spatialExtentM,
    },
    affectedPeople: {
      upTo: gaps.peopleUnknown ? null : incident.peopleAffected,
      reported: !gaps.peopleUnknown,
    },
    firstObservedAt: epochSecondsToIso(evidence.firstSeen),
    lastObservedAt: epochSecondsToIso(evidence.lastSeen),
    freshness: { state: evidence.freshness, latestAgeSeconds: evidence.latestAgeSeconds },
    reportCount: evidence.reportCount,
    independentSourceCount: evidence.sourceCount,
    corroboration: incident.corroboration,
    currentStatus: incident.status,
    ranking: { score: incident.score, breakdown: incident.breakdown },
    evidenceTimeline: evidence.timeline.map(({ created_at, ...rest }) => ({ ...rest, at: epochSecondsToIso(created_at) })),
    uncertainty,
    unknowns: { notYetReportedNearby: gaps.unknown, peopleUnknown: gaps.peopleUnknown },
    knownNearby: gaps.known,
    spatialExtent: { metres: incident.spatialExtentM },
    propagationHistory: supporting.map((o) => ({
      observationId: o.id,
      own: o.own === true,
      receivedAt: typeof o.received_at === "number" ? epochSecondsToIso(o.received_at) : null,
      passedOn: o.passed_on === true,
      reachedStation: o.reached_station === true,
      uploaded: o.uploaded === true,
    })),
    supportingEvidence: supporting.map(toWire),
    caveats: ["counts_phones_not_people", "not_verified", "no_report_is_not_none"],
  };
}

// ------------------------------------------------------------ exporters
// Spec §3.4: one Passport, many formats. Each exporter is a pure function;
// PDF is the web app's print view (D-040). No third-party integrations.

export interface Exporter {
  mime: string;
  extension: string;
  render(p: IncidentPassport): string;
}

export function passportToJson(p: IncidentPassport): string {
  return JSON.stringify(p, null, 2);
}

/** Parses a Passport back. Rejects anything that isn't one; drops bad evidence. */
export function passportFromJson(text: string): IncidentPassport | null {
  try {
    const p = JSON.parse(text) as Partial<IncidentPassport>;
    if (p.schema !== PASSPORT_SCHEMA || p.version !== PASSPORT_VERSION) return null;
    if (typeof p.incidentId !== "string" || !Array.isArray(p.supportingEvidence)) return null;
    return { ...(p as IncidentPassport), supportingEvidence: p.supportingEvidence.filter(isObservation) };
  } catch {
    return null;
  }
}

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : Array.isArray(value) ? value.join("; ") : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Summary as field,value rows, a blank line, then one row per timeline entry. */
export function passportToCsv(p: IncidentPassport): string {
  const summary: [string, unknown][] = [
    ["incidentId", p.incidentId],
    ["category", p.category],
    ["areaText", p.location.areaText],
    ["centroid", p.location.centroid ? `${p.location.centroid.lat},${p.location.centroid.lon}` : null],
    ["affectedPeopleUpTo", p.affectedPeople.upTo],
    ["firstObservedAt", p.firstObservedAt],
    ["lastObservedAt", p.lastObservedAt],
    ["freshness", p.freshness.state],
    ["reportCount", p.reportCount],
    ["independentSourceCount", p.independentSourceCount],
    ["currentStatus", p.currentStatus],
    ["uncertainty", p.uncertainty],
    ["notYetReportedNearby", p.unknowns.notYetReportedNearby],
    ["caveats", p.caveats],
    ["generatedAt", p.generatedAt],
  ];
  const rows = [
    "field,value",
    ...summary.map(([k, v]) => `${k},${csvCell(v)}`),
    "",
    "at,type,category,action,source,people,note,area_text",
    ...p.evidenceTimeline.map((e) =>
      [e.at, e.type, e.category, e.action, e.source, e.people, e.note, e.area_text].map(csvCell).join(","),
    ),
  ];
  return rows.join("\r\n") + "\r\n";
}

/** A versioned body a connected system can accept (spec §13); no network here. */
export function passportToApiPayload(p: IncidentPassport): string {
  return JSON.stringify({ schema: PASSPORT_SCHEMA, version: PASSPORT_VERSION, passport: p });
}

export const EXPORTERS = {
  json: { mime: "application/json", extension: "json", render: passportToJson },
  csv: { mime: "text/csv", extension: "csv", render: passportToCsv },
  api: { mime: "application/json", extension: "api.json", render: passportToApiPayload },
} as const satisfies Record<string, Exporter>;

/**
 * P6 (THREAT_MODEL T5): exports leave the app with COARSE location by
 * default: about 110 m (3 decimals), with the accuracy dropped. Exact
 * location is the reader's explicit choice. The QR is never coarsened: the
 * receiving engine needs exact fixes to group reports.
 */
export function coarsePassport(p: IncidentPassport, decimals = 3): IncidentPassport {
  const f = 10 ** decimals;
  const r = (v: number) => Math.round(v * f) / f;
  return {
    ...p,
    location: { ...p.location, centroid: p.location.centroid ? { lat: r(p.location.centroid.lat), lon: r(p.location.centroid.lon) } : null },
    supportingEvidence: p.supportingEvidence.map(({ accuracy_m: _drop, ...o }) => ({
      ...o,
      ...(typeof o.lat === "number" ? { lat: r(o.lat) } : {}),
      ...(typeof o.lon === "number" ? { lon: r(o.lon) } : {}),
    })),
  };
}
