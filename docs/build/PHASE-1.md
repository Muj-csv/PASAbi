# Phase 1: Observations + incident engine

**Goal:** create and store observations, and compute incidents deterministically.
**Implements:** FR-001–003, FR-011, BR-001–010, NFR-002–003.

## Tasks
1. `packages/core/rules.ts` with every constant from PRD §7, including the `PEOPLE_BONUS` table (R-3). This is the single source of truth — there is no mirror file.
2. **Write the test vectors before the engine.** `packages/core/test-vectors/`, at least 9 cases, expectations **hand-written from the rules**:
   - 3 same-spot FLOOD reports from 3 devices → one strongly corroborated incident
   - no-GPS grouping by area text
   - **two GPS-tagged observations 800 m apart sharing an area text → two incidents** (R-1)
   - ACK, then RESOLVE
   - a new report reopening a resolved incident
   - a RESOLVE whose device clock is behind the REPORT it answers (R-6)
   - SAFE_CHECKIN not forming incidents
   - two FLOOD clusters 1 km apart staying separate
   - **a 4-hop chain** documenting D-010's transitive merge
   - a stale, acknowledged SHELTER incident scoring 0 rather than negative, and sorting above a resolved one (R-2)
3. `packages/core/IncidentEngine.ts` per ARCHITECTURE §3: grid + union-find grouping, corroboration, status from STATUS observations, spatial extent, integer score with breakdown, 0-clamp, sort. Signature: `compute(observations, now): Incident[]`.
4. `packages/core/StorePolicy.ts`: eviction order (BR-008, keep each incident's earliest and latest, **plus the last-resort own-un-uploaded rung**), expiry (BR-009), rate limit (BR-010), ID normalization to lowercase (R-8).
5. `src/storage/`: observation store as a single AsyncStorage JSON blob (D-015). Every write runs `StorePolicy` before persisting.
6. Expo screens: observation form (FR-001) and My data (FR-011), English + Filipino strings. `area_text` required for SAFE_CHECKIN (R-7).

## Acceptance
- All vectors pass; a **shuffle test** (random input order x100) gives identical output.
- Engine handles 3,000 observations in ≤ 300 ms (unit benchmark).
- No floating point anywhere in scoring.
- An observation can be created in airplane mode in ≤ 20 s and survives a restart.

## Don't touch
Transports, upload, station screens.

Stop and report; update `LEARNING.md`.
