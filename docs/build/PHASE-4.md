# Phase 4: Uplink + responder dashboard

**Goal:** once anything gets internet, responders see the same picture plus what changed.
**Implements:** FR-009, FR-010, FR-007 (dashboard side).

## Tasks
1. `supabase/schema.sql` + `rls.sql` (ARCHITECTURE §5–6): the anon role can only insert/upsert observations; the dashboard reads a view.
2. `data/Uplink.kt` (WorkManager, network constraint): idempotent upsert, mark uploaded.
3. `dashboard/src/engine/`: TypeScript port of IncidentEngine reading `shared/rules.json`; run `shared/test-vectors/` in `npm test`.
4. Dashboard UI: ranked incident list with breakdown, Leaflet map (OSM tiles), category filter, per-area safe counts, and **Since last sync** (compare against incidents rebuilt from observations with `first_uploaded_at` before the viewer's last visit, stored in localStorage).
5. Deploy the dashboard to a free static host; put the URL in the README.

## Acceptance
- TS engine passes every shared vector.
- For the same observations, dashboard incidents match the station board exactly.
- Re-uploading from another phone doesn't duplicate anything.

## Don't touch
Engine rules (any change goes through the vectors), app UI.

Stop and report; update `LEARNING.md`.
