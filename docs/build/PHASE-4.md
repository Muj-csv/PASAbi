# Phase 4: Uplink + responder dashboard

**Goal:** once anything gets internet, responders see the same picture plus what changed.
**Implements:** FR-009, FR-010, FR-007 (dashboard side).

The engine is **not** ported here — the dashboard is a route in the same app, using the same `packages/core`. That is the ADR-006 dividend; don't reintroduce a second implementation.

## Tasks
1. Resolve **D-006** (Supabase vs Vercel Postgres), then `db/schema.sql` + `db/rls.sql` per ARCHITECTURE §5–6: the anon role can only insert/upsert observations; the dashboard reads a read-only view.
2. `src/storage/Uplink.ts`: upload when a network is available, idempotent upsert by `id`, mark uploaded. Un-uploaded own observations are what BR-008's last-resort rung protects — check the two agree.
3. Dashboard route on the web build: ranked incident list with breakdown, Leaflet map (OSM tiles), category filter, per-area safe counts, and **Since last sync** (compare against incidents rebuilt from observations whose `first_uploaded_at` precedes the viewer's last visit, stored in localStorage).
4. State the corroboration limitation (PRD §12) visibly on the dashboard.
5. Deploy and put the URL in the README.

## Acceptance
- For the same observations, dashboard incidents match a station board exactly — same order, same scores.
- Re-uploading from another device doesn't duplicate anything; `upload_count` increments.
- No admin or service key appears in the web bundle.

## Don't touch
Engine rules (any change goes through the vectors), app UI.

Stop and report the dashboard URL; update `LEARNING.md`.
