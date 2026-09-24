# Pasabi: Implementation Plan

**Deadline:** Sept 30, 5:00 pm EDT = **Oct 1, 05:00 PHT**. **Target:** submitted by Sept 30, 22:00 PHT. **Team:** assumed 4.

| Phase | Dates (PHT) | Goal | Exit gate |
|---|---|---|---|
| 0: Foundation + radio proof | Sep 24 | Repo, CI, two phones exchange bytes over Nearby in airplane mode | "Hello" works between two phone brands |
| 1: Observations + incident engine | Sep 24–26 | Observation form, Room store, `Rules`, `IncidentEngine`, `StorePolicy`, shared test vectors | Engine vectors + shuffle test green |
| 2: Encounter sync + carry service | Sep 25–27 | `SyncProtocol`, `CarryService`, My data screen | 3 phones converge to identical incident lists |
| 3: Station mode | Sep 27–28 | Situation board, why-ranked breakdown, what changed, acknowledge/resolve | Board updates as carriers arrive; resolve spreads to other phones |
| 4: Uplink + dashboard | Sep 27–29 | Supabase, upload, TS engine port, dashboard with "since last sync" | Dashboard incidents match a station's board for the same observations |
| 5: Field test + submission | Sep 29–30 | Supporting items if time allows, field test, video, README, Devpost | Submitted |

**Owners (4 people):**
- **A:** Nearby + SyncProtocol + CarryService (Phases 0, 2).
- **B:** IncidentEngine, StorePolicy, test vectors (Phase 1), then the TS port (Phase 4).
- **C:** Compose UI: form, My data, station board (Phases 1, 3).
- **D:** Supabase + dashboard (Phase 4), then field test, video and devlog (Phase 5).

B and C can work against in-memory data until A's transport lands.

**Supporting scope, in order, only if Phases 0–4 are green:** observation signatures → eviction keeps incident summaries (if not done in Phase 1) → duty cycling → offline app-sharing guide in the README.

## Traceability

| Goal | Requirements | Components | Phase | Verified by |
|---|---|---|---|---|
| G-1 incidents offline | FR-003, BR-003–007 | IncidentEngine | 1 | Vectors, field test |
| G-2 same picture everywhere | NFR-002, FR-005 | IncidentEngine, SyncProtocol | 1–2, 4 | Shuffle test, 3-phone convergence, Kotlin = TS |
| G-3 urgent survives | BR-005, BR-008, FR-005 | StorePolicy, SyncProtocol | 1–2 | Eviction tests, field test |
| G-4 what changed | FR-007, FR-010 | Station board, dashboard | 3–4 | Snapshot diff tests, field test |

## Demo video (3–5 min)

1. The problem in 20 s.
2. Why mesh chat isn't enough: name Bridgefy, BitChat, MeshAid.
3. Live: 3 phones in airplane mode create overlapping FLOOD reports → they meet → the station board shows **one** strongly corroborated incident, not three messages.
4. Acknowledge on the station → the status spreads.
5. One phone gets Wi-Fi → dashboard: "since last sync: +1 flood incident (3 reports), +1 road blocked, 5 households need water".
6. What we learned + honest limits.
