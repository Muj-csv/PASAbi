# Phase 3: Station mode

**Goal:** the situation board a barangay operator actually uses.
**Implements:** FR-006–008.

## Tasks
1. Station mode toggle with PIN; station capacity (3,000) and continuous discovery.
2. Situation board: incidents by urgency with category, area, corroboration badge, people affected, first/last seen, **spatial extent** (the D-010 mitigation) and status. Tapping opens incident detail with the "why ranked here" breakdown and the list of observations.
3. What changed: "Mark as seen" stores a snapshot; the board highlights new / escalated / newly corroborated / resolved incidents since the last snapshot (match incidents by overlapping observation IDs, never by key).
4. Acknowledge / Resolve buttons create STATUS observations, with BR-007's creation-time clamp applied (R-6). They sync like any other observation.
5. Per-area SAFE_CHECKIN counts panel, keyed on the required `area_text` (R-7).

## Acceptance
- As carriers arrive, the board updates and highlights changes.
- A RESOLVE made on the station shows as resolved on a resident device after one encounter.
- A RESOLVE created on a device whose clock is behind still resolves the incident.
- Snapshot-diff unit tests cover all four change types.
- Resolved incidents sort last even when open incidents have floored to 0 (R-2).

## Don't touch
Upload, dashboard route.

Stop and report; update `LEARNING.md`.
