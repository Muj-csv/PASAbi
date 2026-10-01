# PASAbi: Implementation Spec plan (Passport, Gaps, Sweep)

**Date:** 2026-10-01 (PHT)
**Source:** `docs/PASABI_SPEC.md`, the "Implementation Specification & Feature Roadmap".
**Read this after** `CLAUDE.md`. It is the current plan and follows `docs/IMPLEMENTATION_PWA.md` (W0–W4 done). Where the two disagree, this file wins for the phases below.

> **When the network goes down, the local situation picture stays alive.**
> Every phase answers the spec's §20 test: does it strengthen trustworthy local situation awareness during connectivity loss? If not, it waits.

---

## 1. Where PASAbi already stands (spec Phase A, done by audit)

| Spec requirement | Already in the code | Gap |
|---|---|---|
| Observation → evidence → incident, deterministic clustering (§6) | `packages/core/IncidentEngine.ts`, `Evidence.ts`, test vectors | Transitive-chain merges (A↔B↔C↔D) are known and accepted (D-010, R-4). Changes wait for P8. |
| Reports vs independent sources; device ≠ human (§7) | `Evidence.ts`, caveat "Counts phones, not people." | none |
| Freshness, stale warnings (§8) | `Evidence.ts` (fresh / aging / old), "May have changed." | none |
| Known / not yet reported near an incident (§5) | `Gaps.ts` | Per incident only; no per-area gap with reasons |
| Coverage per area, "no report ≠ safe" (§4.2, §5) | `Coverage.ts` (none / stale / limited / high), expected areas, fixed caveats | No stated reasons; no "single source" or "unresolved uncertainty" signal |
| Transport abstraction (§10) | `Transport` (ADR-007): QR (live), Multipeer (written, untested) | Real-device validation (P1) |
| Local persistence, retention, deletion (§12) | IndexedDB store, `StorePolicy` (72 h TTL), own-report delete | No encryption at rest; no retention policy doc |
| Recovery without claiming delivery (§14) | Supabase upsert, honest stamps (BR-015) | The four states (prepared / attempted / failed / confirmed) are not all shown |
| AI only as confirmed input help (§9) | ADR-010 (not built) | none |
| Situation picture UI (§15) | S1 Ledger + coverage strip, S2 Incident | No gap list, no sweeps, no uncertainty section |

**Net new work:** the Incident Passport, area information gaps with reasons, Purok Sweep, a gateway and export layer, security hardening, and deployment readiness. The engine, the UI kit and the transports are reused.

---

## 2. Decisions to confirm before building

**Accepted by the team on 2026-10-01** ("proceed with the phases"). They are recorded in `docs/DECISIONS.md`.

| # | Decision | Why |
|---|---|---|
| **D-035** | **The Passport is a derived document, never incident state.** It is built on demand from an incident plus **the observations behind it**. Transferring or importing a Passport between PASAbi phones = receiving those observations through `receiveObservations()`, and the engine re-derives the incident. Outside systems get the Passport as a read-only export. | ADR-002: incidents are never transmitted. Keeps every phone's picture reproducible and conflict-free. |
| **D-036** | **Sweeps are station-local records** (like expected areas), stored in the station's IndexedDB and never synced. **What a sweep finds is synced**, as observations. | Observations are immutable, but a sweep has changing state (started, completed). Keeping the record local avoids an update path. |
| **D-037** | **New observation type `CHECK`:** "this area was checked for this category at time T, and it was not seen". It is immutable and synced. It feeds coverage and gaps, and it **never forms an incident, never scores, and is never shown as "safe"**. Wording: "Not seen when checked · 14:05". Couldn't-check is not recorded (it stays a gap). | A sweep must be able to record a deliberate negative finding without turning it into "safe". This is an engine and wire change, so it needs new test vectors. |
| **D-038** | **Area gap reasons are deterministic**, with every threshold in `rules.ts`. Reasons: no observations, stale, single source, unresolved uncertainty. Each shown gap lists its reasons in words. | Spec §5.1: "Do not hide the reason an area was marked as an information gap." |
| **D-039** | **Propagation history in the Passport** = what this phone can prove: its own passed-on / at-station / uploaded flags, when it received each observation, and which receipts it holds. The full relay chain (hop-by-hop) is deferred. | A true chain needs a wire-format change (hops per relay), which is out of scope now. |
| **D-040** | **PDF = the browser's print view** of the Passport (print to PDF), which works offline. No PDF library. | Smallest thing that meets §3.4. Add a library only if print output proves unusable. |

---

## 3. Phases

Rules for every phase (from `CLAUDE.md` and spec §19):
- Do one phase at a time.
- Every engine change updates `packages/core/test-vectors/` or the evidence vectors.
- Test **connected and disconnected** modes, plus duplicates, stale data, partial transfers and restarts.
- At the end: tests, typecheck, lint, both builds, the design guard, 3–5 lines in `LEARNING.md` and the README Features table. Then **stop and report**.
- New UI follows `docs/design/`: any new component goes into DESIGN_BRIEF §12 first.

**Status (2026-10-01):**
- P0 done: decisions accepted.
- P1 software done: the field-test log on every phone (`web/src/storage/transferLog.ts`), exported from Settings and S4; protocol in `docs/FIELD_TEST.md` §9.
- P1 field runs are still to do, by people with iPhones.
- P2 done: `packages/core/Passport.ts` (passportOf plus JSON, CSV and API exporters, with round-trip tests) and `web/src/screens/Passport.tsx` (read, print or PDF, QR, download, copy), linked from S2 and the responder view.
- P3 done: `packages/core/AreaGaps.ts` (per-area reasons: no observations, stale, single source, uncertain, and "not seen when checked" from CHECK observations, D-037), shown as "Information gaps" on S1.
- P4 done: Purok Sweep (`web/src/storage/sweeps.ts`, `web/src/screens/Sweep.tsx`): station-local sweep records; Seen opens the form prefilled, Not seen (two taps) records a CHECK observation, Couldn't check stays unknown.
- P5 done: upload states (prepared, attempted, failed, accepted) on S4, plus a one-implementation `Gateway` seam. No third-party integrations.
- P6 done: `docs/THREAT_MODEL.md`, coarse location in Passport exports by default (`coarsePassport`, "Exact location" opt-in), and "Clear this phone" in Settings.
- P7 done: the readiness check at S4 → `/station/ready` (offline, storage, name, areas, location, Bluetooth, QR self-test, last upload). The field exercise script is in `docs/FIELD_TEST.md` §10.
- P8 left by design: only if field data asks for it.
- **DB migration for existing Supabase projects (P3):** `alter table observations drop constraint observations_type_check, add constraint observations_type_check check (type in ('REPORT','STATUS','CHECK'));`

### P0: Decisions and scaffolding
- Confirm or change D-035 to D-040, and record them.
- Import `docs/PASABI_SPEC.md` (done) and point `CLAUDE.md` here.
- No code.

**Acceptance:** decisions marked Accepted or changed; `CLAUDE.md` updated.

### P1: Real-device transport validation (spec §10, Phase E; priority #1)
Mostly human work. The software part is making it measurable.
1. **Transfer log:** a local, station-only record of each exchange: transport (QR / Bluetooth), start and end times, frames or payloads, observations sent and received, and whether it completed. It is exportable as JSON from S4 and never synced.
2. **Run the protocol** in `docs/FIELD_TEST.md` on real iPhones, over QR now and Multipeer once the native build exists. Cover:
   - interrupted and partial transfers
   - duplicates
   - three or more phones relaying
   - convergence (identical ledgers)
   - human time per transfer
   - battery use per hour
3. Record the results against the spec's §10.3 metrics table.

**Acceptance:** spec §18 "Offline Transport" criteria measured, and the numbers written in `FIELD_TEST.md`. **Nothing else should be tuned before this data exists.**

### P2: Incident Passport (spec §3, Phase B; priority #2)
1. **`packages/core/Passport.ts`** (pure TypeScript):
   - `passportOf(incident, evidence, gaps, held, now)` returns an `IncidentPassport`, with every field in spec §3.2 mapped to existing names:
     - `incidentId` = the incident key
     - `affectedPeople` = `peopleAffected`, with the "up to" semantics stated
     - `freshness`, `reportCount`, `independentSourceCount`
     - `evidenceTimeline` = the Evidence timeline
     - `currentStatus` = open / acknowledged / resolved
     - `unknowns` = Gaps unknown + peopleUnknown
     - `uncertainty` = single source, stale, spatial-extent warning
     - `spatialExtent`
     - `propagationHistory` (D-039)
     - `supportingEvidence` = **the observations themselves**, through `toWire` (D-035, BR-016)
   - It also carries a version and `generatedAt`, and a caveat block: counts phones not people, not verified, no report ≠ none.
   - It keeps report, evidence, corroboration, derived state and unknowns as separate fields (§3.5).
2. **Exporter abstraction** (`packages/core/exporters/`): `Exporter<T> = (p: IncidentPassport) => T`.
   - JSON (canonical), CSV (one row per evidence entry plus a header row), API payload (versioned JSON body).
   - PDF = a print view in `web/` (D-040).
   - No third-party integrations (§13.1).
3. **QR export/import:** a Passport QR is a normal PSB bundle of `supportingEvidence` plus a one-line header frame.
   - Import goes through `receiveObservations()`.
   - The receiving phone shows the incident its own engine rebuilds (D-035).
4. **UI:** on S2 Incident and the responder view, add **Passport**: a readable page (works offline), Show QR, Export JSON / CSV, and Print.
5. **Tests:**
   - Round trip: passport → JSON → passport.
   - passport → QR → import → same incident key, counts and timeline.
   - Evidence, corroboration and unknowns stay distinct.
   - Local-only fields never leak.

**Acceptance:** all seven Incident Passport criteria in spec §18.

### P3: Area information gaps with reasons (spec §4.2, §5, Phase C; priority #3a)
1. **`packages/core/AreaGaps.ts`:** `areaGaps(held, now, expectedAreas)` returns, per area, `{ area, isGap, reasons[], lastObservedAt, sourceCount, reportCount }`. Reasons (D-038):
   - `no_observations`: an expected area with nothing
   - `stale`: the latest observation is older than `COVERAGE_STALE_SECONDS`
   - `single_source`: distinct phones below `CORROBORATED_AT`
   - `uncertain`: an open incident there has only one source, or no people count, or unknown categories
   - The spec's "poor coverage" signal is the combination, not a separate threshold.
2. **Rules:** no new magic numbers. Reuse `rules.ts` constants, and add any new ones there with a comment.
3. **UI:** an **Information gaps** section on the Ledger, above Coverage. Each row gives the area plus its reasons in words ("No observations received · Only one phone reported"). It never uses a safe/unsafe colour or word, and each row gets a **Start sweep** action (P4).
4. **Vectors:** hand-written fixtures for each reason, including "0 reports = gap, never safe".

**Acceptance:** all Phase C checklist items in the spec, and "no reports" never renders as safe (with a test).

### P4: Purok Sweep (spec §4, Phase D; priority #3b)
1. **CHECK observations (D-037):**
   - add the type to `types.ts` and `ingest.ts` validation
   - the wire format (bump `PROTO_VERSION` if needed)
   - `StorePolicy` TTL
   - `Coverage`/`AreaGaps` count them as the area being observed
   - `Gaps` shows "Not seen when checked · 14:05"
   - the engine ignores them for incidents and scores
   - test vectors for all of it
2. **Sweep record (D-036),** station-local: `sweepId, targetArea, createdAt, startedAt, completedAt, assignedOperator?, requestedCategories, observationsCollected (ids), coverageStatus, remainingUnknowns` (spec §4.6). Several sweeps can run at once.
3. **Flow:**
   1. Gap row → **Start sweep**: area plus categories, pre-filled from the gap's unknowns.
   2. **Checklist**, one row per category, each with three answers:
      - **Seen**: opens the report flow pre-filled
      - **Not seen**: a CHECK observation, after a confirm step (§4.3 "Confirm observations")
      - **Couldn't check**: stays unknown
   3. **Complete**: the engine rebuilds incidents, gaps are recalculated, and the sweep shows what's still unknown.
   4. Works fully offline, and the findings pass on by QR or Bluetooth like any observation.
4. **UI:** Sweeps sit on the station tab "Station" (S4), plus a **Sweeps in progress** line on the Ledger (§15.1). New components go into DESIGN_BRIEF §12 first.

**Acceptance:** all Purok Sweep criteria in spec §18.

### P5: Recovery and interoperability (spec §13, §14; priority #6)
1. **Gateway abstraction:** `Gateway` interface, with Supabase as its first implementation (today's `uplink.ts`). There's room for others later; no third-party integrations.
2. **Transmission states per batch and per Passport:** prepared → attempted → failed / confirmed. Shown in words on S4 and the Passport. "Confirmed" means the gateway's server acknowledged the write, never "responders notified".
3. **Passport API payload** posted through the gateway (idempotent by incident key plus `generatedAt`).

**Acceptance:** a disconnected station reconnects and its Passports and observations go through with visible states; a failed upload loses nothing.

### P6: Security and privacy (spec §12, Phase F; priority #4)
1. **`docs/THREAT_MODEL.md`** covers:
   - lost or stolen phone
   - malicious QR or Bluetooth injection
   - replay
   - a fake station
   - location leaks in exports
   - a compromised gateway
2. **Sensitive-field review:** precise location, medical notes and device IDs.
   - Coarse location in exports by default (area text plus a rounded fix), with precise location as an explicit choice.
3. **Retention and deletion policy** doc (the TTL exists; state it), plus "clear this phone" in Settings.
4. **Responder authentication for the responder view** (Supabase auth). The station PIN stays a UI hide, stated honestly.
5. **Transport encryption design:** the key-distribution problem is written up first. A shared community key only obscures the data, so ship nothing that pretends otherwise.

**Acceptance:** the threat model is reviewed, the high-risk items are fixed or explicitly accepted, and a test covers each fix.

### P7: Deployment readiness and field validation (spec §11, Phase G; priority #5)
1. **Station setup flow:** name → PIN → expected puroks → offline test → readiness check.
2. **Readiness check screen** covers:
   - offline-ready (service worker, or bundled in the native app)
   - storage kept
   - camera
   - location
   - Bluetooth
   - a loop-back QR test (show and read on the same device, where possible)
   - the last upload
3. **Field validation** follows spec Phase G: a simulated disconnected disaster, real devices and minimally trained operators. Measure propagation, reliability, friction, battery, comprehension and gap detection. **Record field problems before adding features.**

**Acceptance:** one full field exercise documented in `FIELD_TEST.md`, with the §10.3 metrics.

### P8: Later (only if P1/P7 field data asks for it)
- **Clustering improvements (§6.2):** category thresholds, a maximum incident radius, cluster confidence, spatial-extent warnings. Each must stay deterministic, explainable and covered by vectors.
- AI-assisted input (W6, ADR-010).
- Retire the Expo app (W5).
- The Android Nearby plugin (D-034).

---

## 4. Order and cuts

Spec priority, adapted to what already exists:

**P0 → P1 (runs alongside, human) → P2 → P3 → P4 → P6 → P7 → P5 → P8**

- P1 is mostly field work, so P2 and P3 can be built while it runs.
- P5 comes after security because the Passport's upload path needs the auth and privacy answers from P6.

If time is short, cut from the end: P8, then P5's API payload (keep JSON export), then P7's setup flow (keep the readiness check).

**Never cut:**
- "No report ≠ safe", with its test
- Evidence staying separate from derived state
- The observations-only transfer rule (D-035)
- Measuring before tuning (P1)

## 5. Excluded (spec §16)

Chatbot, social feed, public messaging, blockchain, generic AI assistant, predictive AI, computer vision, IoT, giant interactive maps, gamification, wearables, analytics dashboards.
