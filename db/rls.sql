-- Pasabi access rules. ARCHITECTURE section 6.
-- Run after db/schema.sql.
--
-- The app ships a PUBLIC anon key. That is safe only because of what
-- follows: anon may INSERT observations and may UPSERT its own row by id,
-- and may read through the view. It may not UPDATE arbitrary columns and
-- may not DELETE anything. No service-role key ever appears in the app or
-- the web bundle.

alter table public.observations enable row level security;

-- FR-009: any device may contribute an observation.
drop policy if exists observations_anon_insert on public.observations;
create policy observations_anon_insert
  on public.observations
  for insert
  to anon
  with check (true);

-- The dashboard reads. Reading the base table is allowed so the view works
-- for the anon role; the view is what the client is pointed at.
drop policy if exists observations_anon_select on public.observations;
create policy observations_anon_select
  on public.observations
  for select
  to anon
  using (true);

-- Uploads are idempotent upserts by id, which Postgres implements as an
-- UPDATE when the row exists, so anon needs a narrow update path.
-- BR-002 says observations are immutable: this trigger enforces that the
-- only things an upload may change are the two server-side counters, no
-- matter what the client sends.
create or replace function public.observations_immutable()
returns trigger
language plpgsql
as $$
begin
  new.id                := old.id;
  new.type              := old.type;
  new.category          := old.category;
  new.people            := old.people;
  new.note              := old.note;
  new.lat               := old.lat;
  new.lon               := old.lon;
  new.accuracy_m        := old.accuracy_m;
  new.area_text         := old.area_text;
  new.created_at        := old.created_at;
  new.device_id         := old.device_id;
  new.refs              := old.refs;
  new.action            := old.action;
  -- Never moves: the dashboard diffs "since last sync" against it.
  new.first_uploaded_at := old.first_uploaded_at;
  new.upload_count      := old.upload_count + 1;
  return new;
end;
$$;

drop trigger if exists observations_immutable_trigger on public.observations;
create trigger observations_immutable_trigger
  before update on public.observations
  for each row execute function public.observations_immutable();

drop policy if exists observations_anon_update on public.observations;
create policy observations_anon_update
  on public.observations
  for update
  to anon
  using (true)
  with check (true);

-- No delete policy is defined, so anon cannot delete. Retention (D-008,
-- 30 days after the event) is an operator task, run with a key that never
-- ships in a client.

grant select on public.observations_public to anon;
