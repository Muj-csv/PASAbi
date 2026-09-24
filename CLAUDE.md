# Pasabi

Android app (Kotlin) that lets a barangay keep a shared disaster picture when cell service is down. Phones record immutable **observations**, exchange them over Google Nearby Connections, and each phone runs the same deterministic **incident engine** that groups observations into ranked, corroborated **incidents**. Station phones show a situation board; a web dashboard rebuilds the same picture once anything reaches the internet.

Read first: `docs/PRD.md` (what and why) → `docs/ARCHITECTURE.md` (how) → `docs/IMPLEMENTATION_PLAN.md` (order) → `docs/DECISIONS.md` (open questions).

## Rules
- **Incidents are derived, never transmitted.** Only observations are stored and sent. Never add an incident table that syncs (ADR-002).
- Observations are **immutable**: no update paths, only insert and evict.
- All rule constants live in `core/Rules.kt` and are mirrored in `shared/rules.json`. Don't hard-code thresholds or weights anywhere else.
- `core/` is pure Kotlin (no Android imports) and fully unit-tested. UI and transport never implement rules.
- The incident engine takes `now` as a parameter; never read the clock inside it.
- Any change to engine behavior must update `shared/test-vectors/` and pass in **both** Kotlin and TypeScript.
- Ranking is rule-based and every score exposes its breakdown. No ML, no LLM calls.
- Never switch Bluetooth/Wi-Fi on programmatically; prompt the user.
- Uploads are idempotent upserts by `id`. No admin/service keys in the app or dashboard.

## Layout
```
app/src/main/java/ph/pasabi/core/     Rules, IncidentEngine, StorePolicy, SyncProtocol
app/src/main/java/ph/pasabi/data/     Room entities/DAO, Uplink
app/src/main/java/ph/pasabi/nearby/   CarryService, Nearby adapter
app/src/main/java/ph/pasabi/ui/       Compose: form, my data, station board, incident detail, onboarding
dashboard/                           TS engine port + web dashboard
shared/                              rules.json, test-vectors/*.json
supabase/                            schema.sql, rls.sql
docs/                                spec, build/PHASE-N.md, FIELD_TEST.md
LEARNING.md                          devlog
```

## Commands
- `./gradlew testDebugUnitTest`
- `./gradlew installDebug` (physical devices only; Nearby doesn't run on emulators)
- `cd dashboard && npm i && npm test && npm run dev`

## Out of scope
Chat · AI/LLM features · photos · iOS · custom BLE stack · accounts · offline map tiles · SMS codec (later).

## Keeping docs current
`README.md` is a living draft. When a feature lands or changes, update its row in the README Features table (Planned → Done) in the same change.

## How to work
Do one `docs/build/PHASE-N.md` at a time. At the end: run tests, add 3–5 lines to `LEARNING.md`, **stop and report**.
