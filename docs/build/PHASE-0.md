# Phase 0: Foundation + radio proof

**Goal:** repo and CI in place; two physical phones exchange bytes over Nearby Connections with airplane mode on.

## Tasks
1. Android project (Kotlin, Compose, minSdk 29) with the package layout in `CLAUDE.md`; `dashboard/` Vite + TS skeleton; `shared/` folder.
2. GitHub Actions: `testDebugUnitTest`, `assembleDebug`, and `npm test` in `dashboard/`.
3. Debug screen: Advertise / Discover / Send "hello" (`Strategy.P2P_CLUSTER`, service ID `ph.pasabi.v1`).
4. Runtime permissions (ARCHITECTURE §7) and a "turn on Bluetooth/Wi-Fi" prompt when radios are off.

## Acceptance
- "hello" both ways between two phones (ideally different brands) in airplane mode with Bluetooth/Wi-Fi on; note the result in `docs/FIELD_TEST.md`.
- CI green.

## Don't touch
Room, observation model, real UI.

Stop and report which phone pairs worked.
