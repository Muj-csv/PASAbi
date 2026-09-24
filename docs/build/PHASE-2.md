# Phase 2: Encounter sync + carry service

**Goal:** phones swap missing observations, most urgent incident first, in the background.
**Implements:** FR-004, FR-005, NFR-004.

## Tasks
1. `core/SyncProtocol.kt`: HELLO/SUMMARY/BATCH/BYE with `proto` version; summaries chunked ≤ 30 KB; missing = theirs − mine; batches ordered by the urgency of each observation's incident; 10 s budget; atomic batch apply through `StorePolicy`. Unit-test with a fake transport.
2. `nearby/CarryService`: foreground service (`connectedDevice`), notification "Carrying N observations · M urgent incidents", advertise + discover, skip a peer for 2 min after a no-change sync.
3. Battery-optimization exemption prompt; README section on OEM auto-start settings.

## Acceptance
- 3 phones, each starting with different observations, converge to **identical incident lists** after meeting.
- A MEDICAL observation from A reaches C via B within one encounter each.
- The service keeps syncing after 30 min with the screen off (log proof).

## Don't touch
Station screens, upload, dashboard.

Stop and report encounter timings; update `LEARNING.md`.
