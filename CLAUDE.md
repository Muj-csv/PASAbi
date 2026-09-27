# Pasabi

React Native (Expo) app — **iOS first, Android second**, plus a web build — that lets a barangay keep a shared disaster picture when cell service is down. Devices record immutable **observations**, exchange them peer-to-peer over Multipeer Connectivity (iOS) or Nearby Connections (Android), and every device runs the same deterministic **incident engine** that groups observations into ranked, corroborated **incidents**. Station devices show a situation board. The web build on Vercel is the team's preview surface and the responder dashboard.

Read first: `docs/PRD.md` (what and why) → `docs/ARCHITECTURE.md` (how) → `docs/IMPLEMENTATION_PLAN.md` (order) → `docs/DECISIONS.md` (open questions) → `docs/IMPLEMENTATION_UPDATE.md` (current phases RS, R0–R7; wins where older docs disagree).

## Rules
- **Incidents are derived, never transmitted.** Only observations are stored and sent. Never add an incident table that syncs (ADR-002).
- Observations are **immutable**: no update paths, only insert and evict.
- All rule constants live in `packages/core/rules.ts`. Don't hard-code thresholds or weights anywhere else.
- `packages/core/` is **pure TypeScript**: no `react`, no `react-native`, no DOM, no platform imports. Fully unit-tested.
- The incident engine takes `now` as a parameter; never read the clock inside it.
- Any change to engine behaviour must update `packages/core/test-vectors/` and stay green.
- Ranking is rule-based and every score exposes its breakdown. No ML, no LLM calls.
- **Session transports are always behind the `Transport` interface.** The QR bundle path (ADR-008) is the only exception, and it still never puts platform code in `packages/core`. UI and engine never import a platform transport directly (ADR-007).
- **Local-only fields never leave the device** (BR-016). Every batch goes through `toWire` (inside `encodeBatch`); everything received goes through `receiveObservations()` in `src/storage/observations.ts`, and nothing else writes received data.
- Observation IDs are **lowercase UUIDv4**, normalized on ingest.
- Never switch Bluetooth/Wi-Fi on programmatically; prompt the user.
- Uploads are idempotent upserts by `id`. No admin/service keys in the app or the web bundle.

## Layout
```
packages/core/         rules.ts, IncidentEngine, StorePolicy, SyncProtocol, test-vectors/
packages/transport/    Transport interface + multipeer (iOS), nearby (Android), mock (web/tests)
src/app/               Expo Router routes: form, my data, station board, incident detail,
                       onboarding, dashboard
src/storage/           observation store + Uplink
assets/images/         app icon, splash, favicon
db/                    schema.sql, rls.sql
docs/                  spec, build/PHASE-N.md, FIELD_TEST.md
LEARNING.md            devlog
```

`src/app/` is the Expo Router routes directory — **every file in it becomes a route**. Non-route code goes elsewhere under `src/`, never inside `src/app/`.

Cross-package imports use the `@pasabi/core` and `@pasabi/transport` aliases (tsconfig `paths`); `@/*` maps to `src/*`.

## Commands
- `npm test` — core engine + shared vectors (vitest)
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — includes the rule that keeps `packages/core` pure
- `npx expo start` — dev (native)
- `npx expo start --web` / `npm run build:web` — web build (Vercel preview)
- `eas build -p ios --profile development` / `eas build -p android --profile development` — needs EAS set up (Phase 2b)

## Out of scope
Chat · AI/LLM features · photos · custom BLE stack · **cross-platform (iOS↔Android) mesh** · accounts · offline map tiles · SMS codec (later).

## Keeping docs current
`README.md` is a living draft. When a feature lands or changes, update its row in the README Features table (Planned → Done) in the same change.

## How to work
Phases 0–5 (`docs/build/PHASE-N.md`) are done. Now do one phase of `docs/IMPLEMENTATION_UPDATE.md` §6 at a time. At the end: run tests, typecheck, lint and the web build, add 3–5 lines to `LEARNING.md`, **stop and report**.
