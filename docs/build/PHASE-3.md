# Phase 3: Station mode

**Goal:** the situation board a barangay operator actually uses.
**Implements:** FR-006–008.

## Tasks
1. Station mode toggle with PIN; station capacity (3,000) and continuous discovery.
2. Situation board: incidents by urgency with category, area, corroboration badge, people affected, first/last seen, status; tapping opens incident detail with the "why ranked here" breakdown and the list of observations.
3. What changed: "Mark as seen" stores a `StationSnapshot`; the board highlights new / escalated / newly corroborated / resolved incidents since the last snapshot (match incidents by overlapping observation IDs).
4. Acknowledge / Resolve buttons create STATUS observations (they sync like any other).
5. Per-area SAFE_CHECKIN counts panel.

## Acceptance
- As carriers arrive, the board updates and highlights changes.
- A RESOLVE made on the station shows as resolved on a resident phone after one encounter.
- Snapshot-diff unit tests cover all four change types.

## Don't touch
Upload, dashboard.

Stop and report; update `LEARNING.md`.
