// The server row format. FR-009, ARCHITECTURE section 5.
// Pure TypeScript: no react, no react-native, no DOM, no network (CLAUDE.md).
//
// Devices speak integer epoch seconds; Postgres speaks timestamptz. This is
// the one place that conversion happens, so it is also the one place that can
// get it wrong, which is why it lives in core with tests rather than inside
// the network call.

import type {
  Category,
  Observation,
  ObservationType,
  StatusAction,
} from "./types";

/** One row of public.observations. Nulls, not undefined: this is SQL. */
export interface ServerObservationRow {
  id: string;
  type: ObservationType;
  category: Category | null;
  people: number | null;
  note: string | null;
  lat: number | null;
  lon: number | null;
  accuracy_m: number | null;
  area_text: string | null;
  created_at: string;
  device_id: string;
  refs: string[] | null;
  action: StatusAction | null;
  /** Server-assigned. Absent on upload, present on read. */
  first_uploaded_at?: string;
  upload_count?: number;
}

function nullable<T>(value: T | undefined): T | null {
  return value === undefined ? null : value;
}

export function epochSecondsToIso(seconds: number): string {
  return new Date(seconds * 1000).toISOString();
}

export function isoToEpochSeconds(iso: string): number {
  return Math.floor(Date.parse(iso) / 1000);
}

/**
 * Local-only fields (received_at, hops, own, uploaded) are deliberately
 * dropped: they describe this device's relationship to an observation rather
 * than the observation itself, and PRD section 11 keeps them off the wire.
 *
 * `sig` is dropped too, because the server has no column for it yet.
 * Signatures are supporting scope (ARCHITECTURE section 6); adding them
 * means a schema migration, not a change here.
 */
export function toServerRow(o: Observation): ServerObservationRow {
  return {
    id: o.id,
    type: o.type,
    category: nullable(o.category),
    people: nullable(o.people),
    note: nullable(o.note),
    lat: nullable(o.lat),
    lon: nullable(o.lon),
    accuracy_m: nullable(o.accuracy_m),
    area_text: nullable(o.area_text),
    created_at: epochSecondsToIso(o.created_at),
    device_id: o.device_id,
    refs: o.refs === undefined ? null : [...o.refs],
    action: nullable(o.action),
  };
}

/**
 * Rows read back by the dashboard. `own` is false by definition: the
 * dashboard is not a device and created none of these.
 */
export function fromServerRow(row: ServerObservationRow): Observation {
  const observation: Observation = {
    id: row.id,
    type: row.type,
    created_at: isoToEpochSeconds(row.created_at),
    device_id: row.device_id,
    own: false,
  };
  if (row.category !== null) observation.category = row.category;
  if (row.people !== null) observation.people = row.people;
  if (row.note !== null) observation.note = row.note;
  if (row.lat !== null) observation.lat = row.lat;
  if (row.lon !== null) observation.lon = row.lon;
  if (row.accuracy_m !== null) observation.accuracy_m = row.accuracy_m;
  if (row.area_text !== null) observation.area_text = row.area_text;
  if (row.refs !== null) observation.refs = [...row.refs];
  if (row.action !== null) observation.action = row.action;
  return observation;
}

/**
 * FR-007 on the dashboard: the past is rebuilt from observations the server
 * saw BEFORE the viewer last looked. A row missing first_uploaded_at counts
 * as newly arrived, so an unknown upload time can never quietly be treated
 * as already seen.
 */
export function wasUploadedBefore(
  row: ServerObservationRow,
  cutoffSeconds: number,
): boolean {
  if (row.first_uploaded_at === undefined) return false;
  return isoToEpochSeconds(row.first_uploaded_at) < cutoffSeconds;
}
