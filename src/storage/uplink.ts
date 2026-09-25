import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  toServerRow,
  type Observation,
  type ServerObservationRow,
} from "@pasabi/core";

import { loadObservations, markUploaded } from "./observations";

/**
 * FR-009 uplink. ARCHITECTURE section 6.
 *
 * The anon key is PUBLIC and ships in the bundle. That is safe only because
 * of db/rls.sql: anon may insert and upsert observations and read the view,
 * and the immutability trigger means an upsert can change nothing except
 * upload_count. A service-role key must never appear here, or anywhere else
 * in the app or the web bundle.
 */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const TABLE = "observations";
const READ_VIEW = "observations_public";

/** Chunked so one failed request loses a batch, not the whole store. */
const CHUNK = 300;

let client: SupabaseClient | null = null;

export function isConfigured(): boolean {
  return Boolean(SUPABASE_URL) && Boolean(SUPABASE_ANON_KEY);
}

function supabase(): SupabaseClient | null {
  if (!isConfigured()) return null;
  if (client === null) {
    client = createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
      auth: { persistSession: false },
    });
  }
  return client;
}

export interface UploadResult {
  /** False when no database is configured, so the UI can say why. */
  attempted: boolean;
  uploaded: number;
  pending: number;
  error: string | null;
}

/**
 * Uploads everything this device carries that has not gone up yet, not
 * merely its own observations: a station that reaches the internet is the
 * fastest way the whole barangay's picture gets out (FR-009).
 *
 * Upsert is idempotent by id, so retrying after a partial failure costs
 * nothing but bandwidth.
 */
export async function uploadPending(): Promise<UploadResult> {
  const db = supabase();
  const all = await loadObservations();
  const pending = all.filter((o) => o.uploaded !== true);

  if (db === null) {
    return {
      attempted: false,
      uploaded: 0,
      pending: pending.length,
      error: null,
    };
  }
  if (pending.length === 0) {
    return { attempted: true, uploaded: 0, pending: 0, error: null };
  }

  let uploaded = 0;
  for (let i = 0; i < pending.length; i += CHUNK) {
    const batch: Observation[] = pending.slice(i, i + CHUNK);
    const { error } = await db
      .from(TABLE)
      .upsert(batch.map(toServerRow), { onConflict: "id" });

    if (error) {
      // Whatever already went up stays marked; the rest retries next time.
      return {
        attempted: true,
        uploaded,
        pending: pending.length - uploaded,
        error: error.message,
      };
    }

    await markUploaded(batch.map((o) => o.id));
    uploaded += batch.length;
  }

  return { attempted: true, uploaded, pending: 0, error: null };
}

/** FR-010: the dashboard reads the read-only view, never the base table. */
export async function fetchObservations(): Promise<ServerObservationRow[]> {
  const db = supabase();
  if (db === null) return [];
  const { data, error } = await db
    .from(READ_VIEW)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ServerObservationRow[];
}
