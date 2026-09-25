# Phase 2: Sync

**Goal:** devices swap missing observations, most urgent incident first.
**Implements:** FR-004, FR-005, NFR-004.

This is the critical path. It splits into **2a (no hardware)** and **2b (hardware)** so the certain work lands first.

## 2a — Transport interface, mock, protocol

1. `packages/transport/`: the `Transport` interface — advertise, discover, connect, send bytes, receive bytes, disconnect — plus the `mock` implementation (ADR-007).
2. `packages/core/SyncProtocol.ts`: HELLO/SUMMARY/BATCH/BYE with a `proto` version; summaries carry **binary UUIDs, 16 raw bytes each**, chunked ≤ 30 KB (R-9); missing = theirs − mine; batches ordered by the urgency of each observation's incident; 10 s budget; atomic batch apply through `StorePolicy`.
3. Simulated encounters: wire N mock devices together in a test and in a browser page on the Vercel preview.

**2a acceptance**
- 3 simulated devices, each starting with different observations, converge to **identical incident lists**.
- A MEDICAL observation from A reaches C via B in one encounter each.
- A 100-observation encounter completes inside the 10 s budget in the simulation.

## 2b — Native transports

4. **Android first** (no Apple dependency): `nearby` transport, `Strategy.P2P_CLUSTER`, service ID `ph.pasabi.v1`; runtime permissions per ARCHITECTURE §7; radio-off prompt.
5. **iOS in parallel:** `multipeer` native module + Expo dev build. Treat as a spike — if it stalls, Android satisfies the gate (iOS-first is not iOS-only).
6. Carry mode UI designed **foreground-first** (D-013): prominent "hold the phones near each other", carrying counts on screen. The Android foreground service is supporting scope, not this phase.

**2b acceptance**
- Two real devices **on the same platform** converge to identical incident lists.
- Record encounter durations in `docs/FIELD_TEST.md`.

## Don't touch
Station screens, upload, dashboard.

Stop and report which platform converged and the encounter timings; update `LEARNING.md`.
