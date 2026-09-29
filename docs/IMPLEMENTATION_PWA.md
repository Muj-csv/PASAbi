# PASAbi: Edge-first PWA rewrite

**Date:** 2026-09-29 (PHT) · **Deadline:** submit by Sept 30, 22:00 PHT (hard: Oct 1, 05:00 PHT)
**Read this after** `CLAUDE.md`. Where this file and older docs disagree, **this file wins**, including `docs/IMPLEMENTATION_UPDATE.md`.

**Inputs:**
- `docs/EDGE_FIRST_PWA_PLAN.md`: the "Final Edge-First PWA Implementation Plan". It was written for AgapAI, so read "AgapAI" as PASAbi.
- `docs/design/`: the locked "logbook + stamp" design package (DESIGN_BRIEF, UX_MAP, SCREENS, and the code kit under `docs/design/code/`).

---

## 1. Decisions taken on 2026-09-29 (team)

| # | Decision | Replaces |
|---|---|---|
| D-028 | **Rewrite the app as a React + TypeScript + Vite PWA** that installs to the iPhone Home Screen and runs offline (service worker + IndexedDB). `packages/core` is reused unchanged. The Expo app keeps working until W5 retires it. | ADR-006 → ADR-009 |
| D-029 | **The app is mobile-only.** Every screen, including the responder view, is laid out for a phone (360–430 px), with a single column. There is no desktop layout. SCREENS.md W1's two-column layout at ≥ 1024 px is dropped. | SCREENS.md W1 |
| D-030 | **AI-assisted reporting is allowed, inside a hard boundary** (ADR-010). AI can only draft the report form from voice or text. A person confirms the draft, and the stored observation is the confirmed structured form. Grouping, corroboration, freshness and ranking stay deterministic. | CLAUDE.md "No ML, no LLM", ADR-004 (narrowed, not removed) |
| D-031 | **UI = the locked design package** (`docs/design/`). Where the plan's example screens disagree (red/orange/yellow priority emoji, ALL-CAPS labels, a "CRITICAL" headline, "Need help / Alert my contacts"), **the design package wins**, because those examples break DESIGN_BRIEF §11 and ISO 22324 / PAGASA. Colour values come from `docs/design/code/src/design/theme.ts`, not from the Expo re-skin in `src/theme/tokens.ts` (PR #13). | PR #12/#13 re-skin |
| D-032 | **The product name stays PASAbi.** The plan's "AgapAI" naming, API routes (`/report`, `/resolve`, `/describe`) and region packs belong to another codebase and are not ported. | — |

**ADR-009: Vite PWA replaces Expo.** *Accepted (D-028), supersedes ADR-006.*
- *Why:* the plan makes the installable offline web app the required baseline. It also fixes D-024's weak spot: Expo Go can't restart offline, while an installed PWA can relaunch from its service-worker cache.
- *Cost:* no Multipeer or Nearby radio from a browser. QR (ADR-008) becomes the only phone-to-phone path, and R6 is dropped. iOS can evict web storage, so the app asks for `navigator.storage.persist()` and says plainly when storage isn't persistent.

**ADR-010: AI boundary.** *Accepted (D-030), narrows ADR-004.*
- AI runs **only** in a server function. No model key ever reaches the browser bundle, and no AI code goes in `packages/core`.
- **AI may:** transcribe speech, and draft `category`, `people`, `note` and `area_text` from what the person said. Each drafted field records whether it was said outright or inferred (plan §7.2 `evidence_basis`).
- **AI may not:** invent a location or an area, create or merge incidents, change a score, set ACK/RESOLVE, or claim anyone was notified. It never writes an observation.
- The person always sees the draft in the normal form and taps Save. **Offline, or if AI fails, the form still works on its own** (plan §3.5 "AI unavailable → deterministic fallback").

---

## 2. Reconciliation: the plan's phases against this repo

| Plan phase | Status in PASAbi | Where |
|---|---|---|
| 1 Canonical report | **Done** (observation model) | `packages/core/types.ts` |
| 2 AI extraction | **New: W6**, under ADR-010 | server function + form draft |
| 3 Incident aggregation | **Done** | `IncidentEngine.ts` |
| 4 Corroboration (reports ≠ sources) | **Done** | `independentReporters`, `Evidence.ts` |
| 5 Evidence timeline | **Done** | `Evidence.ts` |
| 6 Freshness | **Done** (global thresholds) | `Evidence.ts`. Per-category values are deferred. |
| 7 Known / not reported | **Done** | `Gaps.ts` |
| 8 Coverage | **Done** | `Coverage.ts` |
| 9 Explainable priority | **Done** (score + breakdown) | `IncidentEngine.ts`. Priority *classes* are not shown (DESIGN_BRIEF: the score is never a headline). |
| 10 Honest propagation | **Done** | `Propagation.ts`, QR receipts |
| 11–13 Relay, QR, priority first | **Done in core** (paged, urgent first) | `qr.ts`. Needs a browser camera and QR renderer (W3). |
| 14 Dedup / idempotency | **Done** | UUID ids, `receiveObservations()`, upserts |
| 15 Gateway | **Done** as station mode | UI rebuilt in W4 |
| 16 Server sync | **Done** (Supabase upsert) | `src/storage/uplink.ts` → ported in W4 |
| 17 Lifecycle | **Partly done** (open / acknowledged / resolved / reopened) | IN_PROGRESS and ASSIGNED are deferred |
| 18 What changed | **Done** | `Snapshot.ts` |
| 19 Contradictions | Deferred | — |
| 20–23 Location tracks, map, facilities, hazards | Deferred | — |
| 23A PWA requirements | **New: W1** | manifest, service worker, IndexedDB, "Ready offline" |
| 24 Encrypted relay | Deferred. A key shared by the whole community only obscures data, so it needs a real key design first. | — |
| 25 Responder auth | Deferred. The station PIN still only hides a UI mode. | — |
| 29–30 Mobile UI, responder board | **W2–W4**, built from the design package | — |

**Not adopted:** a Node API with PostGIS (the plan's §56.1 says to leave it out of a first build, and Supabase stays), region packs and jurisdiction resolution (AgapAI-specific), and "Alert my contacts".

---

## 3. Target layout

```
packages/core/        unchanged. Pure TS engine, shared by everything.
packages/transport/   unchanged. Transport interface + mock (radio adapters dropped, ADR-009).
web/                  the Vite PWA
  index.html
  public/             manifest icons, apple-touch-icon
  src/
    main.tsx, routes.tsx
    design/           tokens.css (from theme.ts), copy.ts (from docs/design kit), pictograms.tsx
    components/       DESIGN_BRIEF §12 kit, ported from React Native to DOM + CSS
    screens/          one file per screen ID (R1…R8, S1…S4, W1)
    storage/          IndexedDB store; receiveObservations() is the only ingest path
api/                  Vercel server functions (W6 AI draft only)
```

**Routes** (plan §47.1, renamed to the design package's screens):

- `/` R1 Home
- `/report` R2 → R3
- `/mine` R6
- `/pass` R4
- `/receive` R5
- `/settings` R7
- `/station` S1
- `/station/incident/:key` S2
- `/station/status` S4
- `/responder` W1
- `/sim` W2

---

## 4. Phases

Do **one phase at a time**, in order. At the end of each phase:
- run `npm test`, `npm run typecheck`, `npm run lint`, the web build, and `node docs/design/code/scripts/check-design.mjs web/src`
- add 3–5 lines to `LEARNING.md`
- update the README Features table
- **stop and report**

### W0: Docs and rules (this change)
Import the design package and the plan into `docs/`, write this file, amend `CLAUDE.md`, and record D-028 to D-032, ADR-009 and ADR-010.

### W1: PWA shell and camera spike
1. `web/` Vite + React + TS app with the `@pasabi/core` alias, a router, and the design tokens as CSS variables. Load Doto from a bundled package (not a CDN) so it works offline.
2. `vite-plugin-pwa`: a manifest (standalone, PASAbi icons, plus the iOS `apple-touch-icon` and meta tags), a precached app shell, and a navigation fallback so every route opens offline.
3. An IndexedDB observation store that ports `src/storage/observations.ts` behaviour (rate limit, `StorePolicy` eviction, `receiveObservations()` as the single ingest path, `toWire` on the way out). Ask for `navigator.storage.persist()`.
4. `StatusBand`, including the "Ready offline" state (plan §23A.5). Show it only once the service worker reports the shell as cached.
5. **Camera spike** (like RS/D-026): a hidden `/spike` route that renders a cycling multi-frame QR and scans one with the camera, using the QR libraries chosen here. **A human installs it from a Vercel preview onto 2 iPhones, in airplane mode, and records the catch rate.** If scanning doesn't work in the standalone Home Screen app, stop and report before W3.
6. Vercel builds `web/`. The CI "no service_role in the bundle" check covers the new output folder.

**Acceptance:** the app installs to the Home Screen, relaunches in airplane mode after being closed, and an observation saved offline survives a relaunch. Spike result recorded in `docs/FIELD_TEST.md`.

### W2: Resident screens
R1 Home, R2 report (4 steps), R3 saved slip with stamps, R6 My reports (Mine / Carrying, delete confirm + undo), R7 Settings (language, what PASAbi saves, station PIN), R8 I'm safe. Build them per `SCREENS.md`, with strings from `copy.ts` and components from the §12 kit.
**Acceptance:** the report flow works offline in ≤ 20 s one-handed, every state in SCREENS.md exists, and the design check is clean.

### W3: QR relay in the browser
R4 Pass on and R5 Receive on top of `packages/core/qr.ts`: paging, "Next batch", receipts, and stamps applied only from a scanned receipt. The screen stays awake while a QR is showing (Wake Lock API where supported).
**Acceptance:** the §9 demo scenario in `IMPLEMENTATION_UPDATE.md` runs between two installed iPhones in airplane mode.

### W4: Station and responder
- S1 Ledger with the coverage strip and change marks
- S2 Incident: evidence counts, facts, "Why first?", gaps, log, Acknowledge / Resolve + undo
- S4 Station: upload, leave station mode
- W1 responder view, single column
- `/sim` ported

The station tab bar is Ledger · Pass on · Receive · Station.
**Acceptance:** the demo scenario reaches the board, and an upload shows on the responder view.

### W5: Retire Expo
- Delete `src/`, `app.json` and the Expo, React Native and `eas` dependencies.
- Move `eslint.config.js` and the root scripts to the Vite app.
- Update the README (Features, How it works, Tech stack), `ARCHITECTURE.md` §7–9 and CI.
- Add `check-design.mjs` to CI.

**Acceptance:** CI green with no Expo code left.

### W6: AI-assisted report (stretch, ADR-010)
- A voice or text box on R2 step 1 sends the words to `api/draft` (a Vercel function; the model key lives in the server environment only).
- The function returns a draft of the form fields with `evidence_basis`, and the normal form opens pre-filled for the person to confirm.
- Offline or on failure, the box is hidden and the form works on its own.
- Eval fixtures go in `eval/`: Taglish, Filipino, English, ambiguous, no location (plan §7.4).

**Acceptance:** a draft never saves without a tap, and fixtures check that no location is invented and nulls are preserved.

### W7: Field test and submission
This was R7 in `IMPLEMENTATION_UPDATE.md`. Run it using the installed PWA instead of Expo Go.

---

## 5. Cut order if time runs out

1. W6 (AI). It needs internet, so it is never the emergency path.
2. W5. Leave the Expo code in place but unused; Vercel already serves `web/`.
3. `/sim` port, S3 Coverage detail, dark mode, stamp animation (keep the haptic).
4. R7 Settings becomes the language toggle only.

**Protect W1 → W3 above everything.** Without the installable offline shell and browser QR, there is no phone-to-phone demo.

## 6. Honest limits (for SUBMISSION.md)

- Browser only: no Bluetooth or Wi-Fi radio between phones. Phones exchange by scanning QR codes, in both directions.
- iOS may clear a Home Screen app's storage under pressure. The app asks for persistent storage and says when it didn't get it.
- AI drafting needs internet, and a person always confirms the draft.
- Corroboration counts phones, not people. Thresholds are untuned.
