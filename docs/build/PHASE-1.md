# Phase 1: Observations + incident engine

**Goal:** create and store observations, and compute incidents deterministically.
**Implements:** FR-001–003, FR-011, BR-001–010, NFR-002–003.

## Tasks
1. `core/Rules.kt` + `shared/rules.json` with every constant from PRD §7.
2. `core/IncidentEngine.kt` per ARCHITECTURE §3: grid + union-find grouping, corroboration, status from STATUS observations, score with breakdown, sort. Signature: `compute(observations, now): List<Incident>`.
3. `core/StorePolicy.kt`: eviction order (BR-008, keep the earliest + latest observation per incident), expiry (BR-009), rate limit (BR-010).
4. `shared/test-vectors/`: at least 8 cases, including 3 same-spot FLOOD reports from 3 devices → one strongly corroborated incident; no-GPS grouping by area text; ACK then RESOLVE; a new report reopening a resolved incident; SAFE_CHECKIN not forming incidents; two FLOOD clusters 1 km apart staying separate.
5. Room `Observation` entity/DAO; every insert runs `StorePolicy` in the same transaction.
6. Compose: observation form (FR-001) and My data screen (FR-011), English + Filipino strings.

## Acceptance
- All vectors pass; a **shuffle test** (random input order ×100) gives identical output.
- Engine handles 3,000 observations in ≤ 300 ms (unit benchmark).
- An observation can be created in airplane mode in ≤ 20 s and survives a restart.

## Don't touch
Nearby, upload, dashboard.

Stop and report; update `LEARNING.md`.
