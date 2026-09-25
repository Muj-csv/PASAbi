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
