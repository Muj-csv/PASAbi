-- Pasabi server schema. ARCHITECTURE section 5.
-- Run once in the Supabase SQL editor, then db/rls.sql.
--
-- The server stores OBSERVATIONS ONLY. Incidents are derived on every client
-- from the same rules (ADR-002), so there is deliberately no incidents table
-- here and there must never be one.

create table if not exists public.observations (
  id                uuid primary key,
  type              text not null check (type in ('REPORT', 'STATUS')),
  category          text,
  people            integer,
  note              text,
  lat               double precision,
  lon               double precision,
  accuracy_m        double precision,
  area_text         text,
  -- Devices keep integer epoch seconds; the client converts on upload.
  created_at        timestamptz not null,
  device_id         text not null,
  refs              uuid[],
  action            text check (action is null or action in ('ACK', 'RESOLVE')),

  -- Server-side only. first_uploaded_at is what the dashboard diffs
  -- "since last sync" against (FR-007), so it must never be overwritten by
  -- a later re-upload of the same observation.
  first_uploaded_at timestamptz not null default now(),
  upload_count      integer not null default 1
);

-- The dashboard lists newest first and filters by category.
create index if not exists observations_created_at_idx
  on public.observations (created_at desc);
create index if not exists observations_first_uploaded_at_idx
  on public.observations (first_uploaded_at desc);
create index if not exists observations_category_idx
  on public.observations (category);

-- A read-only projection for the dashboard. It omits nothing today, but it
-- is the seam where a future column that should not be public (a signature,
-- a raw device identifier) can be withheld without changing the client.
create or replace view public.observations_public as
  select
    id, type, category, people, note,
    lat, lon, accuracy_m, area_text,
    created_at, device_id, refs, action,
    first_uploaded_at, upload_count
  from public.observations;
