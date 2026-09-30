# Pasabi

**Mobile-only, edge-first PWA** (React + TypeScript + Vite, installed to the iPhone Home Screen, works offline) that lets a barangay keep a shared disaster picture when cell service is down. Devices record immutable **observations** and pass them phone to phone by **QR code**. Every device runs the same deterministic **incident engine**, which groups observations into ranked, corroborated **incidents**. Station devices show a situation board, and a responder view reads what was uploaded.

**Mid-rewrite (ADR-009):** the Vite app is in `web/`. The old Expo app in `src/` stays until phase W5 deletes it; don't build new features there.

Read first: `docs/IMPLEMENTATION_SPEC.md` (current phases P0–P8: Incident Passport, information gaps, Purok Sweep; from `docs/PASABI_SPEC.md`; **wins over every older doc**) → `docs/IMPLEMENTATION_PWA.md` (the PWA rewrite, W0–W4 done) → `docs/design/README.md`, `DESIGN_BRIEF.md`, `SCREENS.md` (locked UI) → `docs/PRD.md` (what and why) → `docs/ARCHITECTURE.md` (how) → `docs/DECISIONS.md`. Background: `docs/EDGE_FIRST_PWA_PLAN.md` (the source plan, written for AgapAI; read "AgapAI" as PASAbi) and `docs/IMPLEMENTATION_UPDATE.md` (the earlier Expo-era phases R0–R7).

## Rules
- **Incidents are derived, never transmitted.** Only observations are stored and sent. Never add an incident table that syncs (ADR-002).
- Observations are **immutable**: no update paths, only insert and evict.
- All rule constants live in `packages/core/rules.ts`. Don't hard-code thresholds or weights anywhere else.
- `packages/core/` is **pure TypeScript**: no `react`, no `react-native`, no DOM, no platform imports. Fully unit-tested.
- The incident engine takes `now` as a parameter; never read the clock inside it.
- Any change to engine behaviour must update `packages/core/test-vectors/` and stay green.
- Ranking is rule-based and every score exposes its breakdown. Grouping, corroboration, freshness and ranking never use ML or an LLM.
- **AI boundary (ADR-010).** AI may only *draft* the report form (category, people, note, area text) from voice or text. The draft runs in a server function (`api/`), never in `packages/core` or the browser bundle. A person confirms the draft before anything is saved. AI never invents a location, creates or merges incidents, changes a score, sets ACK/RESOLVE, or claims anyone was notified. The form must work fully without AI (offline, or when the model fails).
- **UI follows `docs/design/`** (locked). Use only the design tokens, `copy.ts` strings and §12 components. Never hard-code a colour, size or UI string. Coral = something done, ballpen blue = information and station mode, data stays ink. Never put red, orange, yellow, green or purple on data. No emoji, and no ALL-CAPS except stamps. Run `node docs/design/code/scripts/check-design.mjs web/src` after UI changes. Every screen is laid out for a phone (360–430 px), single column.
- **Session transports are always behind the `Transport` interface.** The QR bundle path (ADR-008) is the only exception, and it is the only phone-to-phone path in the PWA (ADR-009). It still never puts platform code in `packages/core`. UI and engine never import a platform transport directly (ADR-007).
- **Local-only fields never leave the device** (BR-016). Every batch goes through `toWire` (inside `encodeBatch`). Everything received goes through `receiveObservations()`, in `web/src/storage/` (and `src/storage/observations.ts` until W5). Nothing else writes received data.
- **Offline first.** Every route must open from the service-worker cache with no network request. User data lives in IndexedDB, never in the static cache.
- Observation IDs are **lowercase UUIDv4**, normalized on ingest.
- Never switch Bluetooth/Wi-Fi on programmatically; prompt the user.
- Uploads are idempotent upserts by `id`. No admin/service keys in the app or the web bundle.

## Layout
```
packages/core/         rules.ts, IncidentEngine, StorePolicy, SyncProtocol, qr, Evidence,
                       Gaps, Coverage, Propagation, Snapshot, test-vectors/
packages/transport/    Transport interface + mock (tests, /sim)
web/                   the Vite PWA: src/design (tokens, copy, pictograms), src/components,
                       src/screens (one per screen ID in SCREENS.md), src/storage (IndexedDB)
api/                   Vercel server functions (AI draft only, W6)
native/                Capacitor wrapper pieces (D-033): the iOS Multipeer plugin + setup.
                       Transport adapter: packages/transport/multipeer.ts
src/                   legacy Expo app, deleted in W5; don't extend it
assets/images/         app icon, splash, favicon
db/                    schema.sql, rls.sql
docs/                  spec, design/ (locked UI package), IMPLEMENTATION_PWA.md, FIELD_TEST.md
LEARNING.md            devlog
```

While the Expo app exists, `src/app/` is its Expo Router routes directory: **every file in it becomes a route**.

Cross-package imports use the `@pasabi/core` and `@pasabi/transport` aliases (tsconfig `paths`); `@/*` maps to `src/*`.

## Commands
- `npm test` — core engine + shared vectors (vitest)
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — includes the rule that keeps `packages/core` pure
- `node docs/design/code/scripts/check-design.mjs web/src` — design guard (banned words, raw hex, emoji, ALL-CAPS)
- PWA dev/build scripts are added in W1 (see `docs/IMPLEMENTATION_PWA.md`). Until W5, `npm run build:web` still builds the Expo web app.

## Out of scope
Chat · AI anywhere outside the ADR-010 report draft · photos · custom BLE stack · Bluetooth/Wi-Fi radio in the browser build (impossible there; only the Capacitor native app has it, via Multipeer, D-033) · accounts · offline map tiles · SMS codec (later).

## Keeping docs current
`README.md` is a living draft. When a feature lands or changes, update its row in the README Features table (Planned → Done) in the same change.

## How to work
Phases 0–5, R0–R5 and W0–W4 are done. Now do one phase of `docs/IMPLEMENTATION_SPEC.md` §3 (P0–P8) at a time, starting with P0 (confirm D-035 to D-040). At the end:
- run tests, typecheck, lint, the web build and the design guard
- add 3–5 lines to `LEARNING.md`
- **stop and report**
