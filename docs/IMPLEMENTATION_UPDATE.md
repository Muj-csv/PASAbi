# PASAbi: Implementation Update (Relay alignment)

> **Superseded 2026-09-29 by `docs/IMPLEMENTATION_PWA.md`** (React + Vite PWA rewrite, ADR-009). R0–R5 below are done. R6 (Multipeer) is dropped. R7 becomes W7. The §9 demo scenario is still the acceptance script.

**Date:** 2026-09-27 (PHT) · **Deadline:** submit by Sept 30, 22:00 PHT (hard: Oct 1, 05:00 PHT)
**Read this after** `CLAUDE.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md` and `docs/DECISIONS.md`.

This file tells Claude what to build next and in what order. It aligns the existing app with the **Relay** product specification. **PASAbi is Relay's name.** Where this file and older docs disagree, this file wins for the phases below. Everything in `CLAUDE.md` still applies unless a phase here explicitly amends it.

**Revision 2 (2026-09-27):** updated after the PRISM validation (`docs/VALIDATION.md`) and AERIAL review. Changes: a QR spike (RS) runs first; decisions D-018 to D-026 and ADR-008 are **already recorded** in `DECISIONS.md` and `ARCHITECTURE.md`; R0 adds one shared ingest path; R2 pages bundles and remembers what each receiver acknowledged; source labels are 6 characters; the demo follows the Expo Go protocol (D-024).

---

## 1. How to use this file

- Do **one phase at a time**, in order (§6). Do not start the next phase in the same session.
- At the end of each phase: run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build:web`; add 3–5 lines to `LEARNING.md`; update the README Features table; then **stop and report**.
- If a phase needs a human decision or a device you don't have, stop and say so. Do not guess.
- If time runs short, follow the cut order in §8. Do not improvise cuts.

---

## 2. What Relay is (condensed from the spec)

Relay/PASAbi is a **disruption-tolerant situation-intelligence system**, not a messenger, chat app, mesh-networking project, AI assistant or social feed. It does not replace 911, Handa, DSWD or LGU DRRM systems; it keeps local information alive until it can reach them.

**Core thesis:** *The network may disappear. The community's picture of reality should not.*

**Core transformation:**
PERSON → OBSERVATION → EVIDENCE → INCIDENT → CORROBORATION → LOCAL SITUATION PICTURE → GATEWAY → RESPONDER

**Principles every change must respect:**

1. **Observation ≠ truth.** Every report is an observation. The UI must distinguish reported, corroborated, acknowledged and resolved, and must never present a single report as fact.
2. **Report count ≠ independent confirmation.** Always show observations and independent sources as two separate numbers ("7 reports · 4 sources").
3. **Immutable observations, derived incidents.** Already the architecture (ADR-002). Keep it.
4. **Deterministic, explainable rules. No AI** in grouping, ranking, triage or wording of emergency information.
5. **Last Known Truth.** Never present old information as current. Every incident shows first seen, last seen and how old the latest evidence is.
6. **No report ≠ safe.** Absence of reports is shown as missing information, never as "all clear".
7. **Show what is unknown**, not only what is known.
8. **Honest propagation status.** Never tell a reporter "emergency services received your report". Show only what this phone actually knows.
9. **Complexity belongs to the station/responder UI.** The civilian report flow stays one-thumb and under ~15 seconds.
10. **The transport is infrastructure, not the product.** Build the simplest trustworthy transport. Never let it become the project.

**Vocabulary mapping** (use the existing code names; these are the same things):

| Relay spec | PASAbi code |
|---|---|
| Observation | `Observation` |
| Incident (derived projection) | `Incident` from `compute()` |
| Evidence / Last Known Truth | New `Evidence` module (Phase R1) |
| Station | Station mode (`src/app/station.tsx`) |
| Gateway | Uplink (`src/storage/uplink.ts`) |
| Local Situation Picture | Station board + responder dashboard |

---

## 3. Decisions (recorded in `docs/DECISIONS.md`)

| ID | Decision | Status |
|---|---|---|
| D-018 | The Relay specification is the product direction. **PASAbi is Relay's name**; no rename of code, packages or aliases (`@pasabi/*` stays) | Accepted |
| D-019 | Device inventory (answers D-011 in part): the team has **6 iPhones and no Android phones**. Field test and demo run on iPhones only. The Android Nearby transport is **dropped for this round**. Whether a Mac with Xcode and an Apple Developer account are available is **still open** and gates R6 only | Accepted |
| D-020 | **QR bundle transfer** is the guaranteed phone-to-phone path (ADR-008). It runs in Expo Go on iPhone with no native module and no Apple account | Accepted |
| D-021 | The iOS Multipeer transport is a **timeboxed stretch** (Phase R6), started only if R1–R5 are done and D-019's open part is answered yes | Accepted |
| D-022 | Relay scope for FirstCommit: adopt freshness, reports-vs-sources, evidence timeline, honest propagation status, information gaps and coverage. **Defer** everything in §7 | Accepted |
| D-023 | Freshness, gap and coverage thresholds (§5) are initial values, tuned after the field test | Proposed |
| D-024 | Expo Go is this round's runtime. It loads the JavaScript from the dev server, so the demo opens PASAbi online, then goes to airplane mode and never reloads (§9) | Accepted |
| D-025 | QR bundles page through everything and skip IDs the same receiver already acknowledged (R2) | Recommended |
| D-026 | Run the QR spike (RS) before R1 | Recommended |
| D-027 | QR pages are **deflate-compressed** (`fflate`) before base64, and frames are **500 characters**: 18 frames per 60-observation page instead of 33 (`docs/analysis/ARGUS_constants.md`) | Recommended |

**ADR-008: QR bundle transfer sits beside `Transport`, not behind it.** *Accepted.* A QR exchange has no discovery, no connection and no two-way channel: one phone displays frames, the other scans them. Forcing that into `Transport` (`onPeerFound`, `connect`, `send`) would be a fake adapter. Instead, QR reuses the pieces that matter: `encodeBatch` for the payload, `urgencyByObservation` for ordering, and the normal store ingest path (`applyPolicy`) for applying. Session transports (Multipeer, and Nearby later) stay behind `Transport` exactly as ADR-007 says. R0 amends the `CLAUDE.md` transport rule to name this one exception.

---

## 4. Engine guardrails (read before touching `packages/core`)

The 11 test vectors in `packages/core/test-vectors/` have **hand-computed** expectations. Changing grouping or scoring means recomputing them by hand, which there is no time for. So:

- **Do not change** `R_METRES`, `T_SECONDS`, `CATEGORIES`, `CATEGORY_BASE`, any scoring constant, the linking logic in `IncidentEngine.ts`, or how `status` is computed.
- **Do not edit any existing vector file.** All 11 must pass unmodified at the end of every phase.
- **Do not add values to `IncidentStatus`.** Freshness is a **separate field**, not a new status. (Vector 10 asserts `status` on a stale incident; turning "stale" into a status would break it.)
- New derived information lives in **new pure modules** that take `compute()` output, the observations and an explicit `now`: `Evidence.ts`, `Gaps.ts`, `Coverage.ts`, `qr.ts`. No clock reads, no platform imports, integer seconds.
- New constants go in `rules.ts`, each with a comment naming its decision ID.
- New fixtures go in **`packages/core/evidence-vectors/`**, with expectations **written by hand from the rules**, never generated from the output.
- The dashboard must call the **same** functions as the station board, so both show identical evidence, gaps and coverage for the same observations.
- All new UI text exists in **English and Filipino** in `src/i18n/index.ts`. Use the copy table in `docs/design/DESIGN_BRIEF.md` §12 (Filipino strings are drafts for a native speaker to review).
- **UI follows `docs/design/DESIGN_BRIEF.md`** and uses only `src/theme/tokens.ts` — no raw hex, no one-off sizes. Every screen a phase touches is migrated to the theme in that phase (not as a separate refactor). Reusable pieces go in `src/components/` with the names in brief §10.

---

## 5. Proposed constants (add to `rules.ts`, D-023)

```ts
// Freshness (Phase R1). Separate from the score's staleness term, which is unchanged.
export const FRESH_MAX_AGE_SECONDS = 60 * 60;       // < 1 h since last observation: FRESH
export const STALE_MIN_AGE_SECONDS = 3 * 60 * 60;   // >= 3 h: STALE; between: AGING

// Information gaps (Phase R4)
export const GAP_RADIUS_METRES = 300;               // "nearby" for related incidents
export const GAP_QUESTIONS: Record<Category, readonly Category[]> = {
  FLOOD:          ["TRAPPED", "MEDICAL", "ROAD_BLOCKED", "SHELTER"],
  TRAPPED:        ["MEDICAL", "ROAD_BLOCKED"],
  MEDICAL:        ["TRAPPED", "ROAD_BLOCKED"],
  STRUCTURAL:     ["TRAPPED", "MEDICAL"],
  ROAD_BLOCKED:   ["TRAPPED", "MEDICAL"],
  MISSING_PERSON: ["TRAPPED", "MEDICAL"],
  WATER_FOOD:     ["SHELTER", "MEDICAL"],
  SHELTER:        ["WATER_FOOD", "MEDICAL"],
  SAFE_CHECKIN:   [],
};

// Coverage (Phase R5)
export const COVERAGE_WINDOW_SECONDS = 3 * 60 * 60; // devices counted over the last 3 h
export const COVERAGE_HIGH_DEVICES = 3;             // >= 3 distinct devices: HIGH
export const COVERAGE_STALE_SECONDS = 3 * 60 * 60;  // nothing newer than 3 h: STALE

// QR bundle transfer (Phase R2)
export const QR_FRAME_CHARS = 500;                  // payload chars per frame, after deflate + base64 (D-027; was 700)
export const QR_MAX_OBSERVATIONS = 60;              // per page, most urgent first (D-025)
export const QR_FRAME_INTERVAL_MS = 400;            // auto-advance on the showing phone
```

The Relay spec's example marks an incident STALE after 47 minutes. That fits a fast-moving urban scenario; with phones meeting only occasionally during a typhoon, 1 h / 3 h is a safer start. Tune after the field test.

---

## 6. Phases

Rough schedule (PHT): RS + R0–R1 Sunday · R2–R3 Monday · R4–R5 Monday–Tuesday · R7 Tuesday–Wednesday. R6 only if everything before it is green. Full table and owners: `docs/IMPLEMENTATION_PLAN.md`.

### Phase RS — QR spike (45 minutes, before anything else; D-026)

Goal: find out today whether Expo Go on the team's iPhones can scan a cycling multi-frame QR code reliably, because R2 is the only real phone-to-phone path.

1. On a throwaway branch: add `expo-camera`, `react-native-svg`, `react-native-qrcode-svg` with `npx expo install`.
2. A spike screen that cycles 30 QR frames of random base64 every 400 ms, at **500 and at 700 characters** (the library's default error correction, M), and a scan screen that counts distinct frames, times the run, and records **how many displayed frames the camera caught** (p). ARGUS's model (`docs/analysis/ARGUS_constants.md`, figure 2) turns p into seconds per page.
3. Test phone-to-phone, indoors, 5 attempts.

**Pass bar (decided in advance):** at 500 characters, all 30 frames in **≤ 30 s, in 4 of 5 attempts** (p ≳ 0.8). Record p at 700 too.
**If it fails:** retry once at 400 characters per frame and 20 observations per page, and change `QR_FRAME_CHARS` / `QR_MAX_OBSERVATIONS` in §5 accordingly. If that also fails, R2 uses one static QR per observation with manual paging, and the video leans on `/sim` for automatic convergence.

Record the numbers in `docs/FIELD_TEST.md`, delete the spike branch, stop and report.

### Phase R0 — Point the docs and fix the wire leak (small, do first)

1. Decisions and ADR-008 are already in `docs/DECISIONS.md` and `docs/ARCHITECTURE.md`; check they are present, don't duplicate them.
2. Amend `CLAUDE.md`: add this file to the "Read first" line, and change the transport rule to: *"Session transports are always behind the `Transport` interface. The QR bundle path (ADR-008) is the only exception, and it still never puts platform code in `packages/core`."*
3. **Fix a real bug before any transport exists.** `SyncSession.sendMissingThenBye` passes held observations straight to `encodeBatch`, which JSON-serializes the whole object, so the local-only fields (`received_at`, `hops`, `own`, `uploaded`) go over the wire even though `types.ts` says they never do. A receiving phone would then treat a relayed report as **its own**, which breaks eviction protection (BR-008) and the rate limit (BR-010), and could mark it as uploaded when it never was.
   - Add pure `packages/core/ingest.ts` with `toWire(o)` (keeps only the shared fields) and `asReceived(o, now)` (sets `own: false`, `uploaded: false`, `received_at: now`, and clears `passed_on` / `reached_station`). Use `toWire` for every batch. `toServerRow` already defines which fields are shared; keep the two consistent.
   - Add **one** store entry point, `receiveObservations(observations)` in `src/storage/observations.ts`: `asReceived` each item, then `applyPolicy`, serialized with the other writes. QR (R2) and any future `SyncSession` wiring both call it; nothing else writes received data.
   - Tests: an encoded batch contains no local-only field; a received observation is never `own` or `uploaded`; the relaying device's rate-limit count ignores received observations.

**Acceptance:** docs updated; the leak test fails before the fix and passes after; all existing tests green.

### Phase R1 — Evidence and freshness ("Last Known Truth")

Goal: every incident answers *how do we know, and how recent is it?*

1. `packages/core/Evidence.ts`: `evidenceOf(incident, observations, now)` returns:
   - `reportCount` (REPORT observations in the incident) and `sourceCount` (= `independentReporters`)
   - `firstSeen`, `lastSeen`, `latestAgeSeconds` (`now - lastSeen`, floored at 0)
   - `freshness`: `"fresh" | "aging" | "stale"` from §5
   - `timeline`: the incident's observations and the STATUS observations that reference it, sorted by `created_at` then `id`, each with type, category, people, note, a short pseudonymous source label (first **6** characters of `device_id`; 4 collide too often), and `created_at`. Match STATUS observations to the incident with the engine's **existing** matching logic — export that helper from `IncidentEngine.ts` without changing its behaviour — so the timeline can never disagree with the status badge.
2. Station board and incident detail: show "N reports · M sources", "Last observed X min ago", a freshness badge, and the timeline on the detail screen. A **stale** incident is labelled as last known information, e.g. "Last known 3 h ago — may have changed".
3. Dashboard: the same fields via the same function.
4. Boundaries are exact and inclusive one way: `fresh` if age < 3600 s, `stale` if age ≥ 10800 s, else `aging` (existing vector 06 sits exactly at 3600 s → aging). Hand-written fixtures in `evidence-vectors/`: one fixture 1 s either side of each boundary, a timeline including an ACK, and 5 reports from 2 devices giving `reportCount 5, sourceCount 2`.
5. **Design fixes from the AEGIS Council** (`docs/design/COUNCIL_2026-09-27_relay-screens.md`), since R1 touches these screens anyway:
   - Report form: submit button always enabled; on tap with something missing, show `chooseCategoryFirst` (or the area message) inline and scroll to it. Category buttons in an even 2-column grid, "We are safe" full width below.
   - Inputs use `color.border`; hint text uses `color.warning`.
   - Dashboard: replace the environment-variable error with the `dashNotConnected` Notice; developer detail in small secondary text.
   - `app.json`: `"userInterfaceStyle": "light"`; set the navigation theme background to `color.bg` in `_layout.tsx`.
   - Board cards and incident detail follow the card anatomy and detail order in brief §3.
   - Re-render `/`, `/station` and `/dashboard` at 390 px and confirm the four P1s are gone.

**Don't touch:** grouping, scoring, `status`, existing vectors.
**Acceptance:** fixtures green; board shows reports vs sources and freshness in the browser.

### Phase R2 — QR bundle transfer (the real phone-to-phone path)

Goal: two iPhones in airplane mode exchange observations by camera, in Expo Go.

1. Dependencies: add `expo-camera`, `react-native-svg` and `react-native-qrcode-svg` with **`npx expo install`** so versions match SDK 57. Confirm each works in Expo Go before building on it. Add the camera permission string to `app.json`.
2. `packages/core/qr.ts` (pure):
   - `bundlePages(observations, now, alreadyAcked)` → pages of observations (D-025). Take held, non-expired observations, drop IDs in `alreadyAcked` (what this receiver acknowledged before), order with the existing `urgencyByObservation` (do **not** write a second ordering), and split into pages of `QR_MAX_OBSERVATIONS`. Page 1 is the most urgent.
   - `encodeBundle(page, bundleId)` → `string[]` frames: `toWire`, `encodeBatch`, **`deflateSync` from `fflate`** (pure JS, allowed in core), base64 via a small pure function in core (no `Buffer`; React Native lacks it), split into `QR_FRAME_CHARS` chunks. The assembler reverses it (`inflateSync`). Frame format: `PSB1:<bundleId>:<index>/<count>:<chunk>`.
   - `BundleAssembler`: accepts frames in any order and duplicates, reports `received/total`, rejects frames from a different bundle, and returns observations when complete. Malformed input returns an error; it never throws into the UI.
   - `encodeReceipt(bundleId, role, deviceId)` / `decodeReceipt(text)`: a one-frame receipt `PSR1:<bundleId>:<role>:<deviceId>`; and `encodeId(role, deviceId)` / `decodeId(text)` for the optional ID frame `PSI1:<role>:<deviceId>`.
   - Tests: round-trip at 1 observation, a full page and a page boundary; paging skips acknowledged IDs and keeps urgency order; shuffled and duplicated frames; a mixed-bundle frame rejected; garbage rejected.
3. Sender-side memory (local only, never sent): a map `receiver deviceId → acknowledged observation IDs`, stored in AsyncStorage outside the observation blob, updated when a receipt is scanned. Cap it (e.g. the 20 most recent receivers) so it can't grow without bound.
4. Screens (in `src/app/`, routes only; helpers go outside `src/app/`):
   - **Share:** optionally starts with **"Scan their phone first"** — the receiver's Scan screen shows a small ID frame `PSI1:<role>:<deviceId>`; scanning it lets the sender skip what that phone already acknowledged. Skipping the step is fine: the sender starts at page 1. Then it cycles frames every `QR_FRAME_INTERVAL_MS`, with pause and manual next/previous, shows "Frame i of n · Page p of P", and a **Next page** button. After each page it offers **Scan receipt**, which records the acknowledgement.
   - **Scan:** shows the ID frame at the top ("Show this to the sharer first — optional"), then the camera with QR scanning, a progress bar ("12 of 29"), and on completion calls `receiveObservations()` (R0), then shows **"Received N (M new)"** and displays the receipt QR.
   - Entry points on the home screen and the station screen: "Pass on by QR" and "Receive by QR".
5. On the web build, Share works; Scan may show "Camera scanning isn't available here" if unsupported. That's acceptable.
6. A two-way exchange is two passes (A shows, B scans; then B shows, A scans). State that on screen in plain words.

**Acceptance:** on two iPhones in airplane mode, 3 FLOOD reports created on phone A appear on phone B's board as one incident; incident lists match on both phones after a two-way exchange. Record the time per exchange in `docs/FIELD_TEST.md`.

### Phase R3 — Honest propagation status for the reporter

Goal: the person who reported sees what their phone actually knows, and nothing more.

1. Two new **local-only** fields on own observations: `passed_on?: boolean` and `reached_station?: boolean`. They only ever go from false to true, are never sent (R0's `toWire`), and are never in server rows.
2. They are set when:
   - the phone scans a **receipt** for a bundle containing that observation (`reached_station` too if the receipt's role is `station`)
   - a `SyncSession` sends it to a peer (`reached_station` if the peer's HELLO role was station). Add a callback to `SyncSession` reporting sent IDs and peer role; core stays platform-free.
3. My data and the post-submit screen show one status per own observation, in this order of strength:
   - **Saved on this phone** — not yet passed on
   - **Passed to another phone**
   - **Reached a station**
   - **Uploaded from this phone** (existing `uploaded`)
   - plus, when true: **"Grouped with reports from N other phones"** (its incident has more than one source)
4. Replace the current "saved" message. **Never** use wording that implies responders or emergency services received anything.

**Acceptance:** after a QR exchange with receipt, the reporter's phone shows "Passed to another phone" (and "Reached a station" when scanned from station mode); tests cover the false-to-true rule and that the fields never reach the wire.

### Phase R4 — Information gaps (known / unknown)

Goal: the incident screen shows what is still unknown, not just what is known.

1. `packages/core/Gaps.ts`: `gapsFor(incident, allIncidents, observations, now)`. For each category in `GAP_QUESTIONS[incident.category]`, look for a non-resolved incident of that category that is **nearby**: any of its GPS members within `GAP_RADIUS_METRES` of any GPS member of this incident (not centroid to centroid — 3.5 % of benchmark incidents span more than 300 m, per ARGUS), or equal normalized area text when either has no GPS members, and whose `lastSeen` is within `T_SECONDS` of the incident's `lastSeen`.
   - Found → **known**: category, its key, its source count.
   - Not found → **unknown**.
   - Also: `peopleAffected === 0` → "Number of people affected: not reported".
2. Incident detail and dashboard: a **Known** list and a **Not yet reported** list. Unknowns are worded as missing reports, never as absence: "No report yet of people trapped nearby", not "No one trapped".
3. Hand-written fixtures: a FLOOD with a nearby ROAD_BLOCKED (known) and no TRAPPED (unknown); a ROAD_BLOCKED 1 km away does not count; a resolved nearby incident does not count.

**Acceptance:** fixtures green; the demo scenario (§9) shows the known/unknown split.

### Phase R5 — Coverage ("no report ≠ safe")

Goal: the station and dashboard show where information is thin.

1. `packages/core/Coverage.ts`: `coverageByArea(observations, now)` groups **all** observations (reports, statuses, safe check-ins) by normalized `area_text`. Observations with GPS but no area text go in one bucket labelled "No area named". For each area: last observation time, distinct devices within `COVERAGE_WINDOW_SECONDS`, and a level:
   - **STALE** if nothing newer than `COVERAGE_STALE_SECONDS`
   - otherwise **HIGH** if distinct devices ≥ `COVERAGE_HIGH_DEVICES`
   - otherwise **LIMITED**
2. Optional, if cheap: the station can enter a list of expected areas (puroks), stored locally; an expected area with no observations shows **NO REPORTS** with the caption "This does not mean it is safe."
3. A Coverage section on the station board and the dashboard.
4. Hand-written fixtures for each level and for the "No area named" bucket.

**Acceptance:** fixtures green; coverage visible on board and dashboard.

### Phase R6 — iOS Multipeer transport (stretch, timeboxed)

Start **only** if R1–R5 are green **and** a human has confirmed a Mac with Xcode plus an Apple account that can install a development build on the team's iPhones. Otherwise skip to R7 and say so.

1. Custom Expo module wrapping Multipeer Connectivity, implementing `Transport` (ADR-007), per ARCHITECTURE §7 (Info.plist keys, foreground-only per D-013). This moves the app from Expo Go to a development build: **re-verify QR scanning there first** (an SDK 55 dev build with static frameworks lost `expo-camera` barcode scanning, expo/expo#44491), and don't enable static frameworks unless something requires it.
2. Wire it to `SyncSession`; R3's sent-IDs callback marks propagation status.
3. **Timebox: one day.** If two iPhones haven't converged by then, stop, keep QR as the demo transport, and record what was learned in `LEARNING.md`.

**Acceptance:** two iPhones converge to identical incident lists over Multipeer; timings recorded in `docs/FIELD_TEST.md`.

### Phase R7 — Field test and submission refresh

1. Run `docs/FIELD_TEST.md` on 3–4 iPhones using QR (or Multipeer if R6 landed), following the demo scenario in §9. Record exchange times and whether grouping matched expectations.
2. Update `docs/SUBMISSION.md`:
   - Devpost draft: use the Relay framing (§2 thesis, observation → incident → situation picture) and mention evidence, freshness, gaps and coverage.
   - Video script (§4 of that file): replace the radio-based live segment with §9 below.
   - Honest-limits block: this round is **iPhone-only** and runs in **Expo Go** (loaded online, then used offline without reloading); phones exchange by **scanning QR codes** (two passes for both directions), not radio, unless R6 landed; iOS carries only while the app is open; corroboration counts phones, not people; thresholds are untuned.
3. README: update the Features table, remove Android/Nearby wording that no longer applies to this round, and keep the "Draft README" banner until a human fills in licence, team names and the Vercel URL.

---

## 7. Deferred (list under "What's next"; do not build now)

New Relay observation types (REQUEST, HAZARD, PEOPLE, ACCESS, RESOURCE, UPDATE) · separate observer and incident locations · category-dependent grouping thresholds · contradiction handling · VERIFIED / ASSIGNED / IN_PROGRESS states · battery-aware forwarding · offline knowledge pack · hop count and full propagation history · cryptographic signatures · evidence graph · dashboard map · automatic upload on network change · Android Nearby transport · cross-platform mesh.

**Still out of scope entirely** (from the spec): custom BLE mesh or GATT routing, CRDTs, mutable shared incident state, any LLM or AI feature, voice/hotword/shake/fake-call features, chat, government system integrations, dispatch, prediction, always-on civilian relaying, satellite, IoT, large offline maps.

---

## 8. Cut order if time runs out

1. R6 (Multipeer) — already a stretch.
2. R5's optional expected-areas list, then R5 entirely.
3. R4 (gaps).
4. R3's SyncSession hook (keep the QR-receipt part).

**Protect RS, R0, R1 and R2 above everything.** R2 is what lets the demo show real phones instead of only `/sim`.

---

## 9. Demo scenario (for R2 acceptance, R7 field test and the video)

3–4 iPhones in airplane mode; one in station mode.

**Expo Go protocol (D-024).** Expo Go loads PASAbi from the laptop's dev server, so: open PASAbi on every phone while online → confirm it loaded → switch to airplane mode (Wi-Fi and Bluetooth off too — QR needs neither) → keep PASAbi in the foreground and **never reload**. If a phone drops the app, reconnect it, reopen, and continue; its stored observations are still there. Say in the video that this round runs in Expo Go and a real deployment ships an installed build.

| Phone | Observation (all area text "Purok 4", close together) |
|---|---|
| A | FLOOD |
| B | FLOOD, people 6 |
| C | FLOOD |
| D | ROAD_BLOCKED |

1. Each phone passes its observations to the station by QR and scans the station's receipt. Reporters' phones now read "Reached a station".
2. The station board shows **one FLOOD incident, 3 reports · 3 sources, strongly corroborated, fresh**, with "why ranked here".
3. Open it: timeline of the three reports; **Known:** road blocked nearby; **Not yet reported:** people trapped, medical.
4. Coverage: Purok 4 HIGH; an expected purok with no reports shows "NO REPORTS — this does not mean it is safe" (if R5's option landed).
5. Acknowledge on the station; pass to phone A by QR; A shows the incident acknowledged.
6. The station gets Wi-Fi, taps Upload; the dashboard shows the same incident, evidence, gaps and coverage.

Say on camera: *"The phones never had signal. The transfer is the plumbing; what matters is that four scattered reports became one evidence-backed incident, with what we know, what we don't, and how fresh it is."*

---

## 10. Human tasks (not for Claude)

- Pick a licence (MIT is one line). Team names are in the README; decide which six are listed on Devpost (limit 6).
- Create the Supabase project; run `db/schema.sql` then `db/rls.sql`; fill `.env`. Wake it before recording.
- Connect Vercel and put the URL in the README.
- Install **Expo Go** on all 6 iPhones and confirm it opens the current dev server (SDK 57). If the campus Wi-Fi blocks phone-to-laptop traffic, use a phone hotspot or `npx expo start --tunnel`.
- Talk to one barangay disaster officer (BDRRMO) for 15 minutes before recording: how are walk-in reports logged today? It gives the pitch a real detail and may correct the categories or wording (`docs/VALIDATION.md`, pitch anchors).
- The "24–48 hours" wording is already replaced with "days to weeks" in the README, PRD and SUBMISSION; the Odette source is in `docs/VALIDATION.md`.
- Eligibility: six members confirmed within ages 13–21; get Mark Jemiel Guevarra's details, and confirm whether 21 counts.
- Answer D-019's open part: is there a Mac with Xcode, and an Apple account that can install development builds? (Only needed for R6.)
- `git pull` before starting; check the GitHub Actions tab once.
- Record the video; finalize and submit the Devpost.
