# Pasabi: Implementation Plan

**Deadline:** Sept 30, 5:00 pm EDT = **Oct 1, 05:00 PHT**. **Target:** submitted by Sept 30, 22:00 PHT.
**Revised 2026-09-25** for the React Native / Expo, iOS-first stack (D-014).

> **Schedule reality.** The original plan assumed a Sept 24 start with 4 people. It is Sept 25 with no code yet. The order below is dependency-correct; the dates are aggressive. The cut order is at the bottom — decide it deliberately, not at 2 am on the 29th.

| Phase | Dates (PHT) | Goal | Exit gate |
|---|---|---|---|
| 0: Foundation | Sep 25 | Expo monorepo, RN Web, Vercel preview, CI | Web preview live on Vercel; `npm test` green in CI |
| 1: Observations + incident engine | Sep 25–26 | `rules.ts`, `IncidentEngine`, `StorePolicy`, vectors, observation form, My data | All vectors + shuffle test green; an observation survives a restart |
| 2: Sync | Sep 26–28 | `SyncProtocol`, `Transport` interface, mock + native transports | **2a** simulated 3-device convergence in CI · **2b** two real devices converge |
| 3: Station mode | Sep 28–29 | Situation board, why-ranked breakdown, what changed, ack/resolve | Board updates as carriers arrive; resolve spreads after one encounter |
| 4: Uplink + dashboard | Sep 28–29 | Postgres, upload, dashboard route on the web build | Dashboard incidents match a station board for the same observations |
| 5: Field test + submission | Sep 29–30 | Supporting items if green, field test, video, README, Devpost | Submitted |

**Phase 2 is the critical path and carries all the schedule risk.** It splits deliberately:
- **2a — no hardware.** `Transport` interface, `mock` transport, `SyncProtocol`, simulated multi-device encounters running in CI and in the browser. Certain to land.
- **2b — hardware.** Android Nearby transport (no Apple dependency, start here) and the iOS Multipeer native module (spike, in parallel). Either one alone satisfies the exit gate, because iOS-first is not iOS-only.

**Owners (assumed 4; revisit under D-009):**
- **A:** `Transport` + `SyncProtocol` + native transports (Phase 2). Android first, then the Multipeer spike.
- **B:** `rules.ts`, `IncidentEngine`, `StorePolicy`, test vectors (Phase 1), then the dashboard route (Phase 4).
- **C:** Expo UI: form, My data, station board (Phases 1, 3).
- **D:** Foundation + Vercel + CI (Phase 0), Postgres + uplink (Phase 4), then field test, video and devlog (Phase 5).

B and C work against in-memory data and the mock transport until A's native work lands. Nothing except Phase 2b and the field test depends on D-011.

## Start today, in parallel with Phase 0

- **Apple Developer enrolment** (D-011). It can take 24–48 h and blocks nothing else, so the only cost of starting now is the fee.
- **Confirm D-016** — that Vercel is the preview/dashboard surface and native ships through EAS.
- **Answer D-009** (staffing). The plan is sized for 4.

## Traceability

| Goal | Requirements | Components | Phase | Verified by |
|---|---|---|---|---|
| G-1 incidents offline | FR-003, BR-003–007 | IncidentEngine | 1 | Vectors, field test |
| G-2 same picture everywhere | NFR-002, FR-005 | IncidentEngine, SyncProtocol | 1–2 | Shuffle test, simulated convergence (2a), real convergence (2b) |
| G-3 urgent survives | BR-005, BR-008, FR-005 | StorePolicy, SyncProtocol | 1–2 | Eviction tests, field test |
| G-4 what changed | FR-007, FR-010 | Station board, dashboard route | 3–4 | Snapshot diff tests, field test |

## Cut order, if something has to give

1. Supporting items (signatures, Android background service, app-sharing guide) — already deferred.
2. Phase 4's dashboard **map**; keep the ranked list and "since last sync".
3. Phase 3's "what changed" highlighting; keep the board itself.
4. Phase 2b's **iOS** transport — demo the Android mesh and state the iOS status honestly.

The station board is the demo centrepiece. Protect Phases 1, 2a and 3 above everything else.

## Demo video (3–5 min)

1. The problem in 20 s.
2. Why mesh chat isn't enough: name Bridgefy, BitChat, MeshAid.
3. Live: 3 devices in airplane mode create overlapping FLOOD reports → they meet → the station board shows **one** strongly corroborated incident, not three messages.
4. Acknowledge on the station → the status spreads.
5. One device gets Wi-Fi → dashboard: "since last sync: +1 flood incident (3 reports), +1 road blocked, 5 households need water".
6. What we learned + honest limits — including iOS foreground-only carrying (D-013) and the single-platform mesh (D-012).
