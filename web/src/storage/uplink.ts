import type { SupabaseClient } from "@supabase/supabase-js";

import {
  toServerRow,
  type Observation,
  type ServerObservationRow,
} from "@pasabi/core";

import { kvGet, kvSet, live } from "./kv";
import { markUploaded, nowSeconds, observations } from "./observations";

/**
 * FR-009 uplink. The ANON key is public and ships in the bundle; that is
 * safe only because db/rls.sql limits it to insert/upsert observations and
 * read the view. A service-role key must never appear anywhere in web/.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const TABLE = "observations";
const READ_VIEW = "observations_public";
const CHUNK = 300;
const LAST_UPLOAD_KEY = "lastUpload.v1";

let client: SupabaseClient | null = null;

/** Epoch seconds of this phone's last successful upload, or null. */
export const lastUpload = live<number | null>(null);

export async function restoreLastUpload(): Promise<void> {
  const v = await kvGet<number>(LAST_UPLOAD_KEY);
  lastUpload.set(typeof v === "number" ? v : null);
}

export function isConfigured(): boolean {
  return Boolean(SUPABASE_URL) && Boolean(ANON);
}

/**
 * Loaded on first use: only Upload and the responder view need it, so it
 * stays out of the first download (it is still precached for offline).
 */
async function supabase(): Promise<SupabaseClient | null> {
  if (!isConfigured()) return null;
  if (client === null) {
    const { createClient } = await import("@supabase/supabase-js");
    client = createClient(SUPABASE_URL as string, ANON as string, {
      auth: { persistSession: false },
    });
  }
  return client;
}

export interface UploadResult {
  uploaded: number;
  pending: number;
  error: string | null;
}

/**
 * Uploads everything this phone carries that has not gone up yet (FR-009).
 * Upserts are idempotent by id, so a retry after a partial failure is safe.
 */
export async function uploadPending(): Promise<UploadResult> {
  const db = await supabase();
  const pending = observations.get().filter((o) => o.uploaded !== true);
  if (db === null) return { uploaded: 0, pending: pending.length, error: "not-configured" };

  let uploaded = 0;
  for (let i = 0; i < pending.length; i += CHUNK) {
    const batch: Observation[] = pending.slice(i, i + CHUNK);
    const { error } = await db.from(TABLE).upsert(batch.map(toServerRow), { onConflict: "id" });
    if (error) return { uploaded, pending: pending.length - uploaded, error: error.message };
    await markUploaded(batch.map((o) => o.id));
    uploaded += batch.length;
  }
  const at = nowSeconds();
  await kvSet(LAST_UPLOAD_KEY, at);
  lastUpload.set(at);
  return { uploaded, pending: 0, error: null };
}

/** FR-010: the responder view reads the read-only view, never the table. */
export async function fetchObservations(): Promise<ServerObservationRow[]> {
  const db = await supabase();
  if (db === null) return [];
  const { data, error } = await db
    .from(READ_VIEW)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ServerObservationRow[];
}
