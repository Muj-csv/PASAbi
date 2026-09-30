# Pasabi: Decisions

| ID | Decision | Status | Affects |
|---|---|---|---|
| D-001 | ~~Native Kotlin (ADR-001) vs Flutter~~ | **Superseded by D-014** | Whole app |
| D-002 | ~~≥ 3 physical Android phones (2+ brands) available all week~~ | **Superseded by D-011** | Testing, demo |
| D-003 | Grouping constants R = 150 m, T = 6 h, urgency weights (PRD BR-005) | Proposed, tune after the field test | IncidentEngine |
| D-004 | Incidents derived on every device, never transmitted (ADR-002) | Proposed | Core design |
| D-005 | Rule-based urgency, no ML (ADR-004) | Proposed | Ranking |
| D-006 | Hosted Postgres for uplink: **Supabase** | **Accepted** (2026-09-26). Supabase ships PostgREST and row-level security, so a phone and a browser can talk to Postgres directly with a public anon key. Vercel Postgres (Neon) exposes a connection string, which cannot ship in a client bundle and would have forced the serverless API layer ADR-003 rejects | Uplink, dashboard |
| D-007 | ~~Engine in Kotlin + TypeScript with shared vectors (ADR-005)~~ | **Superseded by D-014** — one TS engine, written once | Dashboard |
| D-008 | Server retention: 30 days after the event | Proposed | Data |
| D-009 | Team split with Sinopia (GIBC V2), same week | **Open** — roster is 7 people (README, 2026-09-27); FirstCommit allows **6** per team, so who is listed on Devpost, and who works on which phase, is still to decide | Staffing, submission |
| D-010 | Transitive chaining is unbounded in space and time: a linear flood can merge into one incident spanning kilometres, with a centroid pointing at nothing real | **Accepted with mitigation** — documented by a 4-hop test vector, and each incident's spatial extent is shown in the UI so an operator can resolve a bad merge. Revisit after the field test | IncidentEngine |
| D-011 | Device and account inventory: Mac, Apple Developer account, iPhones, Android phones | **Open — start Apple enrolment today.** Gates the iOS build and decides which mesh is demoed. Does **not** block engine, UI, web or Android work | Testing, demo, submission |
| D-012 | iOS and Android meshes do **not** interoperate (Multipeer is Apple-only, Nearby Connections is Android-only). Bridging needs the out-of-scope custom BLE layer | **Accepted limitation** — the two islands reconcile through the cloud uplink, free under ADR-002. Field test and demo run on one platform's mesh; the limit is stated, not demonstrated | Transport, demo |
| D-013 | Carry mode is designed **foreground-first** (the iOS baseline); Android's foreground service is an enhancement, not the baseline | **Accepted** — design once to the stricter constraint. Changes PRD §5's roaming-volunteer model into an explicit user action | FR-004, UX |
| D-014 | React Native (Expo) + React Native Web, one codebase, **iOS-first, not iOS-only** (ADR-006) | **Accepted** (leader's instruction, 2026-09-25) | Whole app |
| D-015 | Local store is a single JSON blob in AsyncStorage, not SQLite | Proposed — a 3,000-observation station store is roughly 900 KB, well inside limits, and the engine already loads the full set into memory. Upgrade to expo-sqlite if the store outgrows it | Storage |
| D-016 | Vercel hosts the **web build as the team preview surface and the responder dashboard**; native builds ship through EAS | **Assumed, needs confirmation** — this is the reading of "Vercel will be used for testing" that the rewritten docs are built on | Deployment |
| D-017 | BR-010 rate limit counts REPORT observations only; STATUS actions are exempt | **Accepted** — the limit is anti-spam for reports, and counting acknowledgements would lock a station operator out of their own board after six, penalising the primary user with a rule aimed at flooders | BR-010, FR-008 |
| D-018 | The Relay specification is the product direction. **PASAbi is Relay's name**; no rename of code, packages or aliases | **Accepted** (2026-09-27) | Whole product; PRD v0.5 |
| D-019 | Device inventory (answers D-011 in part): **6 iPhones, no Android phones**. Field test and demo are iPhone-only; the Android Nearby transport is dropped for this round. Whether a Mac with Xcode and an Apple account that can install development builds exist is **still open** and gates R6 only | **Accepted** (2026-09-27) | Transport, demo, field test |
| D-020 | **QR bundle transfer** is the guaranteed phone-to-phone path (ADR-008). Runs in Expo Go, no native module, no Apple account | **Accepted** (2026-09-27) | FR-004, FR-013 |
| D-021 | iOS Multipeer is a **timeboxed stretch** (R6), started only after R1–R5 and a yes on D-019's open part | **Accepted** (2026-09-27) | FR-005, demo |
| D-022 | Relay scope for FirstCommit: adopt freshness, reports-vs-sources, evidence timeline, honest propagation status, information gaps, coverage. Defer the rest (PRD v0.5 §8) | **Accepted** (2026-09-27) | Scope |
| D-023 | Freshness (1 h / 3 h), gap radius (300 m) and coverage (3 devices, 3 h) thresholds | Proposed — initial values, tune after the field test | BR-011, BR-013, BR-014 |
| D-024 | **Expo Go is the runtime for this round.** It loads the JavaScript from the laptop's dev server; nothing is bundled into an installed app. So the demo loads PASAbi while online, then switches to airplane mode and keeps PASAbi in the foreground without reloading. A reload or a killed Expo Go cannot restart offline. A standalone build removes this and needs D-019's open part | **Accepted** (2026-09-27), stated in the honest limits | Demo, FR-002 verification, NFR-001 |
| D-025 | QR bundles **page** through everything the sender holds (most urgent first, `QR_MAX_OBSERVATIONS` per page) and **skip what the same receiver already acknowledged**, using the receiver's device ID carried in the receipt. A fixed "top 60" bundle would resend the same 60 at every exchange, and anything ranked lower would never cross by QR | Recommended (AERIAL review, 2026-09-27) | FR-013 |
| D-026 | Run a 45-minute **QR spike before R1** (pass bar in `VALIDATION.md`) | Recommended (PRISM/AERIAL, 2026-09-27) — skip only by team decision | Schedule |
| D-027 | QR pages are **deflate-compressed** (`fflate`, pure JS) before base64, and frames are **500 characters**. Measured on the real `encodeBatch`: a 60-observation page drops from 33 frames (QR version 22) to 18 (version 18) even with worst-case note text (`docs/analysis/ARGUS_constants.md`) | Recommended (ARGUS, 2026-09-27) — confirm with the QR spike's measured catch rate | FR-013, NFR-009 |

**D-011 update (2026-09-27):** partly answered by D-019 (iPhones only). Mac and Apple account still open.

**ADR-008** (QR bundle transfer sits beside `Transport`, not behind it) is recorded in `ARCHITECTURE.md` §9.

## PWA rewrite (2026-09-29)

The full text of each decision is in `docs/IMPLEMENTATION_PWA.md` §1. Summary:

| # | Decision | Status | Affects |
|---|---|---|---|
| D-028 | Rewrite as a React + Vite **PWA** (installable, offline via service worker + IndexedDB). `packages/core` is unchanged. Expo is retired in W5 (ADR-009, supersedes ADR-006) | **Accepted** (team, 2026-09-29) | Platform, D-024, R6 dropped |
| D-029 | **Mobile-only.** Every screen is single column at phone width, including the responder view | **Accepted** (team, 2026-09-29) | SCREENS.md W1 |
| D-030 | **AI may draft the report form** from voice or text, and a person confirms it. Engine and ranking stay deterministic (ADR-010, narrows ADR-004) | **Accepted** (team, 2026-09-29) | FR-001, CLAUDE.md rules |
| D-031 | The UI is the locked `docs/design/` package. It wins over the plan's example screens and over the PR #13 re-skin colours | **Accepted** (team, 2026-09-29) | All UI |
| D-033 | **Bluetooth pass-on in a native wrapper**. The PWA gets a Capacitor shell, and an iOS Multipeer plugin sits behind `Transport` (ADR-007). **Ping nearby** runs core's `SyncSession` with every phone in range. A radar shows who is in range, with no distance and no Street View (offline, map-as-hero ban). Bluetooth is asked for once at start, never switched on. The web build shows the section, explains it needs the app, and keeps QR as the working path. Reverses ADR-009's "R6 dropped" for the native build only | **Accepted** (team, 2026-09-30). Code written; untested until an Apple Developer account exists | FR-005, ADR-009, R6 |
| D-032 | The name stays **PASAbi**. The source plan's AgapAI-only parts (voice API routes, region packs, jurisdiction) are not ported | **Accepted** (2026-09-29) | Scope |

## Package R (applied 2026-09-25)

Rule-level fixes resolving contradictions and gaps found in spec review. All are encoded in `packages/core/rules.ts` and covered by test vectors.

| # | Problem | Resolution |
|---|---|---|
| R-1 | PRD BR-003 and ARCHITECTURE §3 disagreed on area-text grouping. PRD: area text applies when either observation lacks GPS. ARCHITECTURE: whenever area texts match. Two GPS-tagged observations 800 m apart sharing a purok grouped under one reading, not the other | Area text links **only when at least one observation lacks a GPS fix** (the PRD reading). Distance wins whenever both have a fix. Accepted cost: under-merging when a purok is wider than R — tune R via D-003 after the field test |
| R-2 | Open incidents could score negative (SHELTER 15 base − 20 staleness = −5), sorting *below* resolved incidents and making BR-005's "resolved sorts last" false | Open scores **clamp at a minimum of 0**, and resolved sorts last by an explicit status key rather than by score value. The clamp makes the status key mandatory, since resolved and floored-open both read 0 |
| R-3 | The people term used 5 x log2(1 + people) with no stated rounding — a cross-runtime determinism hazard against NFR-002, and silently fragile if the weight ever changes | Replaced by a **16-entry integer lookup table**. The term caps at +20 when people reaches 15, so 0–15 is the entire domain. No floating point anywhere in scoring |
| R-4 | Transitive chaining unbounded in space and time | Accepted — see D-010 |
| R-5 | BR-008 could deadlock: BR-010's 6/hr against BR-009's 72 h TTL permits 432 own observations, but resident capacity was 300, and "never evict own un-uploaded" left no legal eviction | Resident capacity **300 → 500**, above the 432 ceiling, so the store can never fill with un-evictable own data. **Plus** a documented last-resort eviction rung — evict own un-uploaded, oldest first — so the invariant survives any future change to the TTL or rate limit. Refusing to record a new observation was rejected outright |
| R-6 | Clock skew could make a station's RESOLVE look older than the REPORT it answers, so the incident never showed resolved. ARCHITECTURE called skew "tolerated"; this is exactly where it is not | A STATUS observation's `created_at` is clamped at creation to `max(device clock, latest referenced REPORT + 1 s)`. Deterministic, because the clamped value travels with the observation. A fix based on local `received_at` would have broken NFR-002 |
| R-7 | BR-006 counts `SAFE_CHECKIN` "per area", but a check-in with GPS and no area text has no area to count under | `area_text` is **required** on SAFE_CHECKIN. One extra tap on the least urgent flow, comfortably inside NFR-006 |
| R-8 | Incident key is "the smallest observation ID", but UUID ordering was undefined and mixed-case hex compares differently | Observation IDs are **lowercase UUIDv4**, normalized on ingest |
| R-9 | ARCHITECTURE §4 sized a 3,000-ID summary at "~48 KB", which only holds for 16 raw bytes per ID. As 36-character strings it is ~111 KB, so chunk sizing rested on a wrong number | Summaries carry **binary UUIDs**. Stated explicitly in ARCHITECTURE §4 |
| R-10 | ~~`rules.json` and `Rules.kt` were two hand-maintained sources of truth with nothing enforcing agreement~~ | **Dropped — the problem no longer exists.** One language means one source of truth: `packages/core/rules.ts`. `shared/rules.json` is deleted rather than tested |
