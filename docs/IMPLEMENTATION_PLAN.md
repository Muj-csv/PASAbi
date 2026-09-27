# PASAbi: Implementation Plan

**Deadline:** Sept 30, 5:00 pm EDT = **Oct 1, 05:00 PHT**. **Target:** submitted by **Sept 30, 22:00 PHT** (7 h buffer).
**Revised 2026-09-27** for the Relay direction and the iPhone-only inventory (D-018 to D-026). Phase detail and guardrails: `docs/IMPLEMENTATION_UPDATE.md`.

## Where things stand

Phases 0, 1, 2a, 3 and 4 are merged and green in CI (lint, typecheck, 56 tests, web build, `service_role` check). Phase 2b (radio transports) was never built. Phase 5's paperwork is drafted but needs people. Supabase has never been created; nothing has run on a phone.

## Revised phases (plan backwards from Sept 30, 22:00 PHT)

| Phase | When (PHT) | Goal | Exit gate | Parallel with |
|---|---|---|---|---|
| **Human unblock** | Sun Sep 27 | Licence, Supabase, Vercel, Expo Go on the iPhones, D-019's open part, one BDRRMO conversation booked | `.env` filled; dashboard URL live; app opens in Expo Go on 3+ iPhones | Everything |
| **RS: QR spike** (D-026) | Sun, 45 min | Prove Expo Go can scan cycling multi-frame QR on your iPhones | 30 frames × 500 chars in ≤ 30 s, 4 of 5 attempts, and record the catch rate p at 500 and 700 (D-027) — or take the fallback | R0 |
| **R0: Wire hygiene** | Sun | `toWire` / `asReceived`, one `receiveObservations()` ingest path, docs pointers | Leak tests fail before, pass after | RS |
| **R1: Evidence + freshness** | Sun–Mon | Reports vs sources, freshness, timeline on board, detail, dashboard | Evidence fixtures green; visible in the browser | R2 UI work |
| **R2: QR bundle transfer** | Mon | Share (paged) / scan / receipt | Two iPhones in airplane mode: A's 3 FLOOD reports become one incident on B | R1 |
| **R3: Propagation status** | Mon | Honest status for the reporter | "Passed to another phone" / "Reached a station" after a receipt | R4 |
| **R4: Known / not yet reported** | Mon–Tue | Gaps on detail and dashboard | Gap fixtures green | R3, R5 |
| **R5: Coverage** | Tue | Coverage per area | Coverage fixtures green | R4 |
| **R7: Field test + submission** | Tue–Wed | Field test, video, Devpost, README | **Submitted by Wed 22:00** | — |
| **R6: Multipeer** (stretch) | Only if R1–R5 are green by Tue midday **and** D-019's open part is yes | Radio sync on iPhones, 1-day timebox | Two iPhones converge over Multipeer | — |

**The riskiest proof comes first.** RS decides whether the demo shows real phones or leans on `/sim`, so it runs before any feature work. R1 is low-risk engine work that will land either way.

## Owners

The roster is seven people (`README.md`); roles A–D below aren't assigned yet (D-009). FirstCommit lists at most **6** members per team. The plan works with 2–4 active builders; with one, run the phases in order and cut per below.

| Role | Work |
|---|---|
| **A — Transfer** | RS, R2, R3 (and R6 if it happens) |
| **B — Core** | R0, then the pure modules for R1, R4, R5 and their fixtures |
| **C — UI** | Board, detail, dashboard and My data screens for R1, R3, R4, R5; English and Filipino strings |
| **D — Ship** | Human unblock tasks, Supabase and Vercel, field test run sheet, video, Devpost, README |

B and C work in the browser against local data; only A and the field test need phones.

## Traceability

| Goal | Requirements | Components | Phase | Verified by |
|---|---|---|---|---|
| G-1 incidents offline | FR-003, BR-003–007 | IncidentEngine | done | 11 vectors, shuffle test |
| G-2 same picture everywhere | NFR-002, FR-005, FR-013 | IncidentEngine, SyncProtocol, qr.ts | done, R2 | Shuffle test, `/sim`, two-iPhone QR test |
| G-3 urgent moves first | BR-005, BR-008, FR-013 | StorePolicy, qr.ts paging | done, R2 | Eviction tests, QR paging test |
| G-4 what changed | FR-007, FR-010 | Snapshot, board, dashboard | done | Snapshot tests, field test |
| G-5 how we know, how recent | BR-011, BR-012, FR-014 | Evidence.ts | R1 | Evidence fixtures |
| G-6 what is unknown | BR-013, BR-014, FR-016, FR-017 | Gaps.ts, Coverage.ts | R4, R5 | Gap and coverage fixtures |
| G-7 honest status | BR-015, BR-016, BR-017, FR-015 | ingest.ts, qr.ts receipt | R0, R3 | Wire-hygiene tests, receipt test |

## Cut order, if something has to give

1. R6 (Multipeer) — already a stretch.
2. R5's optional expected-areas list, then R5.
3. R4.
4. R3's `SyncSession` hook (keep the QR-receipt part).

**Protect RS, R0, R1 and R2.** Never cut the human unblock tasks or R7: an unsubmitted project scores zero.

## Demo video (3–5 min)

Scenario and script: `docs/IMPLEMENTATION_UPDATE.md` §9, with the D-024 Expo Go protocol. Judging weights to keep in mind: Learning & Growth 30 %, Creativity & Impact 25 %, Technical Execution 25 %, Presentation 20 %.
