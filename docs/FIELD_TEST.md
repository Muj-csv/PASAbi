# Pasabi: Field Test

The run sheet for ARCHITECTURE §10. Written to be executed by someone who did
not build the app, in one sitting, with the numbers written down as they
happen rather than remembered afterwards.

**Fill this in during the test, not after.** The measurements are the point:
NFR-003, NFR-004 and NFR-005 are claims, and this is the only thing that
turns them into evidence.

| | |
|---|---|
| Date | _____ |
| Operators | _____ |
| Location | _____ |
| Platform under test | iOS / Android (one only — see D-012) |
| App version / commit | _____ |

---

## 0. Before you start

Pasabi's mesh does not span platforms (D-012): Multipeer is Apple-only and
Nearby Connections is Android-only. **Pick one platform and use it for every
device in the test.** A mixed set produces two silent islands and a confusing
afternoon.

- [ ] 3–4 physical devices, same platform, charged to 100%
- [ ] The build installed on all of them (`eas build`, TestFlight, or a dev build)
- [ ] Each device has granted location and nearby-devices permissions
- [ ] Battery percentage noted for each device (table in §5)
- [ ] One device nominated as the **station**, plugged in, PIN set
- [ ] **Airplane mode ON, then Bluetooth and Wi-Fi back ON** on every device
- [ ] Confirm there is no internet: the dashboard must be unreachable
- [ ] A stopwatch, and someone whose only job is writing numbers down

On iOS, carrying only happens while Pasabi is **open on screen** (D-013).
Keep the app foregrounded on every device for the whole test, and note that
this is the platform's constraint rather than a bug.

### Device roster

| Label | Model / OS | Role | Start battery % |
|---|---|---|---|
| A | | resident | |
| B | | volunteer / carrier | |
| C | | station | |
| D | | resident (optional) | |

---

## 1. Scripted observations

Create these **before** any devices meet, so the grouping result is known in
advance and a wrong answer is obvious.

| # | Device | Category | Where | People | Note |
|---|---|---|---|---|---|
| 1 | A | FLOOD | outside the hall | — | "water on the road" |
| 2 | B | FLOOD | within ~50 m of #1 | — | "knee deep" |
| 3 | D (or A again) | FLOOD | within ~100 m of #1 | — | "rising" |
| 4 | A | ROAD_BLOCKED | ~1 km away | — | "tree across road" |
| 5–9 | B | WATER_FOOD | same purok, 5 separate reports | 3 each | |

**Expected once everything has met:** the three FLOOD reports form **one**
incident, marked **strongly corroborated** if they came from three distinct
devices; ROAD_BLOCKED stays separate; the WATER_FOOD reports group by
proximity.

If the three FLOOD reports form three incidents, the likely causes in order
are: they came from the same device (corroboration counts devices, not
people), they were more than R = 150 m apart, or more than T = 6 h separated
them. Record which.

- [ ] Time to create one observation, one-handed: _____ s (NFR-006 target ≤ 20 s)
- [ ] All observations created while fully offline: yes / no

---

## 2. Encounters

Bring devices together one pair at a time, keeping each pair apart until its
turn, so the delivery path is unambiguous.

| Encounter | Started | Converged | Duration (s) | Observations moved | Notes |
|---|---|---|---|---|---|
| A ↔ B | | | | | |
| B ↔ C (station) | | | | | |
| A ↔ C | | | | | |
| D ↔ C | | | | | |

**NFR-004 target: an encounter carrying ~100 observations completes in ≤ 10 s.**
The simulated run measured 151 ms over 7 payloads, which tells you nothing
about a radio. This table is the real number.

- [ ] Every device shows the **same incident list** after meeting (G-2)
- [ ] An observation created on A reached C **via B**, without A and C ever
      meeting — the multi-hop claim, and the one that distinguishes Pasabi
      from a chat app

Multi-hop confirmed: yes / no. If no, what happened: _____

---

## 3. Station board

On the station device:

- [ ] The board lists incidents ranked by urgency
- [ ] The FLOOD incident shows **strongly corroborated**, 3 reporters
- [ ] "Why ranked here" shows score terms that add up to the displayed total
- [ ] Spatial extent is shown and is plausible for the ground covered (D-010)
- [ ] Tap **Mark as seen**
- [ ] Create one more observation on A and carry it to the station
- [ ] The board highlights it — badge shown: NEW / ESCALATED / MORE REPORTS
- [ ] Acknowledge an incident. Its score drops by 10 (the unacknowledged term)
- [ ] **Resolve** an incident on the station
- [ ] Carry to a resident device: does it show resolved there after one
      encounter? yes / no ← *unproven before this test*

Time for a RESOLVE to reach a resident device: _____ s

---

## 4. Uplink and dashboard

Turn airplane mode **off** on one device only.

- [ ] Press **Upload now** on My data. Uploaded count: _____
- [ ] Open the dashboard. Does the incident list match the station board? yes / no
- [ ] Same order? Same scores? _____
- [ ] Upload from a **second** device carrying the same observations
- [ ] Nothing duplicated on the dashboard: yes / no
- [ ] "Since last sync" shows the newly arrived incidents: yes / no

If the dashboard and the board disagree, that breaks G-2 and ADR-002 and is
the single most important bug this test can find. Record the difference
exactly, with screenshots of both.

---

## 5. Battery (NFR-005)

Target ≤ 5% per hour. Report iOS screen-on and Android background separately;
they are not comparable numbers.

| Device | Role | Start % | End % | Elapsed | %/hour | Screen on? |
|---|---|---|---|---|---|---|
| A | | | | | | |
| B | | | | | | |
| C | station, plugged in | | | | | |
| D | | | | | | |

---

## 6. Threshold tuning (D-003, D-010)

The constants were chosen at a desk. This is their first contact with a real
place.

- Did R = 150 m group things a local would call the same incident? _____
- Did it wrongly merge things a local would call separate? _____
- Did any incident chain into an oversized merge (check spatial extent)? _____
- Suggested R: _____  Suggested T: _____

**Before changing either constant, read this:** the 11 vectors in
`packages/core/test-vectors/` carry **hand-computed** expected values that
assume R = 150 m and T = 6 h. Changing a constant means recomputing those
expectations by hand. Do not do it the night before submission.

---

## 7. Results summary

| Requirement | Target | Measured | Pass? |
|---|---|---|---|
| NFR-003 engine | 3,000 obs ≤ 300 ms | | |
| NFR-004 encounter | 100 obs ≤ 10 s | | |
| NFR-005 battery | ≤ 5 %/h | | |
| NFR-006 create observation | ≤ 20 s | | |
| G-2 same picture everywhere | identical lists | | |
| Multi-hop A→B→C | delivered | | |
| Dashboard = station board | identical | | |

**What broke:**

**What surprised us:**

**What we would change:**

---

## If the test cannot happen

If devices never materialise (D-011), say so plainly in the README, the video
and the Devpost entry, and show the `/sim` page instead. It runs the real
`SyncProtocol` over the mock transport and demonstrates three devices
converging to identical incident lists: honest evidence about the protocol
and no evidence at all about radios. Describe it in exactly those terms.
Judges weight Learning & Growth heavily, and a clearly stated limitation
reads better than a staged demo.

---

## 8. QR transfer (RS spike and R2)

This round moves observations by QR code (ADR-008), in Expo Go, following
the D-024 protocol: load PASAbi online, switch to airplane mode, never reload.
Sections 0 to 7 above describe the radio test and apply only if R6 lands.

### RS spike (before relying on R2)

Pass bar, decided in advance: at 500 characters per frame, all 30 frames in
**30 s or less, in 4 of 5 attempts**, indoors, phone to phone. Record the
share of displayed frames the camera caught (p); `docs/analysis/ARGUS_constants.md`
figure 2 turns p into seconds per page.

| Attempt | Chars per frame | Frames caught / shown (p) | Seconds for all 30 | Pass? |
|---|---|---|---|---|
| 1 | 500 | | | |
| 2 | 500 | | | |
| 3 | 500 | | | |
| 4 | 500 | | | |
| 5 | 500 | | | |
| 1 | 700 | | | (p only) |

If it fails: set `QR_FRAME_CHARS = 400` and `QR_MAX_OBSERVATIONS = 20` in
`packages/core/rules.ts`, rerun once, and note the result here.

### R2 exchange (NFR-009: a full page in 60 s or less)

Use Share on one phone and Scan on the other. Time from the first frame on
screen to "Received N (M new)". Then scan the receipt back.

| Sharer → scanner | Observations on page | Frames | Seconds to complete | Receipt scanned? | Notes (light, glare, hand shake) |
|---|---|---|---|---|---|
| | | | | | |
| | | | | | |
| | | | | | |

## 9. P1: transport validation with the field-test log (spec §10, 2026-10-01)

Every phone now keeps a **field-test log** of its own transfers. It covers each QR send and receive. Each entry records start and end times, whether it finished, frames (caught / total) and reports moved.
- It stays on the phone and is never uploaded.
- Find it at **Settings → Field test log**, and on the station's **Station** tab.
- **Copy log** or **Download** exports it as JSON, with the phone labelled by its 6-character source label.

### Protocol (run with 3–4 iPhones, airplane mode)
1. **Clear the log** on every phone (Clear log, then tap again).
2. **Straight transfer:** A passes 10 reports to B by QR. Repeat 5 times.
3. **Interrupted:** start a QR receive on B, walk B away after a few frames, then come back and restart. Nothing may be applied until the bundle is complete, and the unfinished attempt must be logged.
4. **Duplicates:** pass the same reports A→B twice. On the second pass, B's "new" count is 0 and the ledger doesn't change.
5. **Relay:** A→B, then B→C, then C→station. The station ledger must match A's picture for those reports.
6. **Battery:** note the battery % at the start and end of an hour of normal use.
7. **Export every phone's log** and paste the JSON under the date below.

### Results against spec §10.3

| Metric | How to read it | Result |
|---|---|---|
| Propagation | Median time from the log, per transport | |
| Reliability | finished ÷ total, per transport | |
| Human friction | Log time plus the taps counted by the observer | |
| Battery | % per hour (step 6) | |
| Correctness | Do the ledgers match after step 5? | |
| Clustering | Wrong merges seen on the ledgers | |
| Coverage | Were silent puroks shown as gaps? | |
| Comprehension | Could an operator say what, where and how fresh within 30 s? | |
| Recovery | Did the upload after reconnecting show the right states? | |

## 10. P7: field exercise script (spec Phase G, 2026-10-01)

Run this before a real disaster, with one station phone and 2–3 resident phones, in airplane mode.
1. **Readiness:** on the station, open Station → Readiness check. Sort out every dashed row, or write down why it's left.
2. **Expected areas:** add the puroks. The ledger's "Information gaps" should list each one as "No observations received".
3. **Reports:** residents file 5–10 scripted reports in two puroks and pass them to the station by QR.
4. **Sweep:** on the station, start a sweep for a purok with no reports. Mark one category Not seen, one Seen (file the report), and the rest Couldn't check. Complete. The gaps must now show "Not seen when checked: …" and no gap may read as "safe".
5. **Passport:** open one incident's Passport. Export JSON with Exact location off, then check that lat/lon have 3 decimals. Pass it by QR to another phone and check that it rebuilds the same incident.
6. **Recovery:** turn airplane mode off on the station and upload. Record the state line seen (prepared → attempted → accepted, or failed).
7. **Clear:** on a test resident phone, Settings → Clear this phone (two taps). It must reopen empty.

| Step | Pass? | Notes |
|---|---|---|
| 1 Readiness | | |
| 2 Expected areas | | |
| 3 Reports | | |
| 4 Sweep | | |
| 5 Passport | | |
| 6 Recovery | | |
| 7 Clear | | |
