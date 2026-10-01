# PASAbi: Product Requirements

*Pasabi* (Filipino: a message you ask someone to pass along) · **P**eer-carried **A**lerts, **S**ynthesized **A**nd **B**arangay-**I**ndexed

| | |
|---|---|
| Version | 0.5.2 |
| Status | Core built; Relay-alignment phases RS, R0–R7 in progress (`docs/IMPLEMENTATION_UPDATE.md`). Validated GO, conditional on the QR spike (`docs/VALIDATION.md`) |
| Owner | Ian Patrick Flores (team lead) and team — roster in `README.md` |
| Updated | 2026-09-27 |
| Event | Global Innovation Build Challenge V2 (D-042). Deadline: _see the challenge rules_ |

> **The network may disappear. The community's picture of reality should not.**

PASAbi is the name of the product described in the Relay specification. This version merges what is already built (v0.4) with the Relay direction adopted on 2026-09-27 (D-018).

---

## 0. What changed from v0.4

| Area | v0.4 | v0.5 |
|---|---|---|
| Framing | Store-and-forward incident network | Disruption-tolerant **situation-intelligence** system: preserve observations, reconstruct the local situation picture, show evidence and uncertainty |
| Platform | iOS-first, Android second | **iPhone-only for this round** (team has 6 iPhones, no Android; D-019). Android remains the next platform |
| Phone-to-phone transfer | Multipeer (iOS) and Nearby (Android) | **QR bundle transfer** is the guaranteed path (D-020, ADR-008). Multipeer is a timeboxed stretch (D-021). Nearby is deferred |
| Incident view | Score, corroboration, why-ranked-here | Adds **reports vs sources**, **freshness** (Last Known Truth), an **evidence timeline**, **known / not-yet-reported** lists |
| Station and dashboard | Ranked board, what changed | Adds **coverage per area** ("no reports ≠ safe") |
| Reporter feedback | "Recorded" | **Honest propagation status**: saved on this phone → passed to another phone → reached a station → uploaded |
| Dashboard map | Required (FR-010) | Deferred |
| Onboarding | Three screens + radio prompt (FR-012) | Deferred; permissions are asked in context |
| Rules | BR-001 to BR-010 | Unchanged, plus BR-011 to BR-017 |
| Runtime | Dev builds via EAS | **Expo Go** this round (D-024): loaded online, then used offline without reloading |
| Problem framing | "First 24–48 hours" | **Days to weeks** (Odette: about three months to restore commercial telecoms in the hardest-hit areas) |

---

## 1. Summary

PASAbi preserves and reconstructs a barangay's picture of what is happening when cellular and internet service are gone.

Residents and volunteers record short, structured **observations** ("flood water entering the road", "6 people need water"). Phones pass observations to each other when people meet. On every phone, the same deterministic **incident engine** groups related observations into **incidents**, counts how many independent devices support each one, and ranks them with a transparent urgency score.

Each incident then shows its **evidence**: how many reports and how many independent sources, when it was first and last observed, how fresh that is, what related problems have been reported nearby and what has **not** been reported yet. Stations also show **coverage**: which areas have recent reports from several phones and which have gone quiet.

Pre-positioned **station** phones (barangay hall, evacuation centre, school) collect everything and show the situation board. When any phone reaches the internet, observations upload and a responder dashboard rebuilds the same picture with the same code, including what changed since the last sync.

**PERSON → OBSERVATION → EVIDENCE → INCIDENT → CORROBORATION → LOCAL SITUATION PICTURE → GATEWAY → RESPONDER**

The phone-to-phone transfer is how the information survives. It is not the product.

## 2. Problem

After major typhoons, cell towers lose grid power. For days, and in the hardest-hit areas weeks to months, a barangay's disaster-response team knows only what people walk in and tell them. The problem is not only lost communication; it is lost **situational awareness**:

- Where are people trapped? Which roads are blocked? Where is it flooding?
- Which reports are duplicates, and which are independently confirmed?
- How recent is each piece of information, and which is already stale?
- What does nobody know yet?

Reports that do arrive come as a pile of duplicates and fragments, not as a picture.

## 3. Positioning

PASAbi is an edge layer that works **before** information reaches central systems. It complements Barangay and LGU DRRM offices, DILG preparedness frameworks, DSWD, Handa, Unified 911 and NGO responders. It replaces none of them, and it claims no integration with any of them.

**Positioning sentence:** PASAbi preserves community observations and reconstructs the local situation picture until normal connectivity returns.

It fits existing workflows rather than replacing radios, whiteboards or command structures: *your whiteboard, but every entry has a time, a source, a location and a history, and it survives when the internet doesn't.*

## 4. Users

| Tier | User | Role in PASAbi | UI principle |
|---|---|---|---|
| 1 | **Residents** | Record observations; carry others' observations when they meet a station or volunteer | One thumb, under ~15 s, no technical terms, no evidence graphs |
| 2 | **Volunteers / tanods, BHWs, SK** | Record observations; deliberately pass them on | Same as residents, plus prominent "pass on" and "receive" actions |
| 2 | **Barangay disaster-response operator** (BDRRMC, barangay secretary) at a station | **Primary user.** Reads the board, evidence, gaps and coverage; acknowledges and resolves | Full detail: evidence, freshness, timeline, coverage, why-ranked |
| 3 | **Municipal responders** (MDRRMO, LGU) | Read the web dashboard once any phone uploads | Same detail as the station, same code |

**Complexity belongs to the station and responder views, never the reporting flow.**

**Scope:** one barangay, from connectivity loss until service returns: days to weeks. After Super Typhoon Odette (December 2021), the UN Emergency Telecommunications Cluster ran emergency connectivity at 24 sites, and commercial telecoms only substantially recovered by late March 2022 (`docs/VALIDATION.md`).

## 5. Goals and non-goals

**Goals**
- **G-1** Turn many overlapping reports into a small set of incidents, with corroboration, on the phones and without internet.
- **G-2** Every phone holding the same observations shows the same incidents and ranking. No server or coordinator.
- **G-3** The most urgent information survives storage limits and moves first.
- **G-4** Responders see what changed since their last sync, not a raw feed.
- **G-5** *(new)* Every incident shows **how we know** (reports vs independent sources, timeline) and **how recent** it is, and never presents old information as current.
- **G-6** *(new)* The situation picture shows **what is unknown**: unreported related problems and areas with thin or stale coverage.
- **G-7** *(new)* Reporters see only what their phone actually knows about where their report went.

**Non-goals:** chat or messaging; any AI or ML in grouping, ranking, triage or emergency wording; predicting disasters; dispatch; replacing official channels; verifying identity; guaranteeing any report is true (PASAbi makes evidence and uncertainty visible instead); a mesh that spans iOS and Android (D-012).

## 6. Principles

1. **Observation ≠ truth.** A report is an observation. The UI distinguishes single report, corroborated, acknowledged and resolved, and never presents one report as fact.
2. **Report count ≠ independent confirmation.** Reports and sources are always shown as two numbers.
3. **Immutable observations, derived incidents** (ADR-002). Changes are new observations; incidents are recomputed.
4. **Deterministic and explainable.** Fixed rules, integer scoring, a visible breakdown. No AI in the core.
5. **Last Known Truth.** Every incident shows first seen, last seen and evidence age; stale information is labelled as such.
6. **No report ≠ safe.** Silence is shown as missing information, never as "all clear".
7. **Show the unknowns**, not only the knowns.
8. **Honest status.** Never tell a reporter that responders or emergency services received anything.
9. **Graceful degradation.** Each failure reduces capability without losing information: no internet → store; no station → pass to peers; no peer → keep locally.
10. **Transport is infrastructure.** Build the incident engine first, the simplest trustworthy transport second. Never let the transport become the project.

## 7. Deployment model

PASAbi is deployed **before typhoon season**, not installed after the disaster. It does not rely on mass adoption.

1. **Permanent nodes:** station phones at the barangay hall, evacuation centres and schools, plugged in with the app open.
2. **Prepared users:** barangay officials, DRRM personnel, health workers and volunteers, who install PASAbi and pass observations on deliberately.
3. **Residents:** opportunistic contributors, onboarded through barangay orientation.

**This round is iPhone-only (D-019).** The team's devices are iPhones, so the field test and demo run on iPhones.

**Carrying is an explicit, foreground action (D-013).** iOS suspends apps shortly after they leave the screen, so a phone passes observations on only while PASAbi is open. With QR transfer this is inherent: two people hold their phones up, one shows, the other scans. Station phones stay plugged in and open.

**Single-platform mesh (D-012).** When radio transports exist, iOS and Android form separate networks that reconcile through the uplink. QR transfer is the exception: a camera reads a QR code from any phone, so QR works between iPhone and Android.

The network is useful with only stations and a few prepared volunteers.

## 8. Scope

| Built (v0.4) | Adding this round (phases R0–R7) | Deferred ("what's next") |
|---|---|---|
| Observation form · local store with eviction, expiry and rate limit · incident engine with urgency and explanation · sync protocol (tested on a simulated transport) · `/sim` three-device simulation · station mode with PIN · situation board · "what changed" · acknowledge / resolve · manual upload · responder dashboard (ranked list, category filter, since last sync) · My data with delete · English and Filipino | Fix local-only fields leaking into sync (R0) · evidence: reports vs sources, freshness, timeline (R1) · **QR bundle transfer** with receipt (R2) · honest propagation status (R3) · known / not-yet-reported (R4) · coverage per area (R5) · iOS Multipeer transport, **stretch** (R6) · field test and submission refresh (R7) | New Relay observation types · separate observer and incident locations · category-dependent thresholds · contradiction handling · VERIFIED / ASSIGNED / IN_PROGRESS states · battery-aware forwarding · offline knowledge pack · hop count and propagation history · signatures · dashboard map · automatic upload on network change · onboarding screens · Android Nearby transport and background carry service · SMS / satellite uplink · photos · MapaKalamidad export |

**Out of scope entirely:** chat; any LLM or AI feature (triage, clustering, confidence, chatbot, generated instructions, dispatch, prediction); voice-first, hotword, shake or fake-call features; social feed; custom BLE mesh or GATT routing; CRDTs; mutable shared incident state; always-on civilian relaying; government system integrations; satellite; computer vision; IoT sensors; wearables; large offline map datasets; accounts; blockchain.

## 9. Business rules

BR-001 to BR-010 are **unchanged** and encoded in `packages/core/rules.ts` with hand-computed test vectors. Changing them is a decision (`DECISIONS.md`) and means recomputing those vectors by hand.

| ID | Rule | Status |
|---|---|---|
| BR-001 | Observation categories: `MEDICAL`, `TRAPPED`, `STRUCTURAL`, `FLOOD`, `ROAD_BLOCKED`, `MISSING_PERSON`, `WATER_FOOD`, `SHELTER`, `SAFE_CHECKIN`. | Built |
| BR-002 | Observations are **immutable** and identified by a **lowercase UUIDv4**, normalized on ingest. Only ever added or evicted, never edited. | Built |
| BR-003 | **Incidents are derived, never transmitted.** Two observations belong to the same incident if they share a category, were created within **T = 6 h** of each other, and either **(a)** both have a GPS fix and are within **R = 150 m**, or **(b)** at least one has **no** GPS fix and their normalized area texts are equal and non-empty. Normalization: lowercase, trim, collapse internal whitespace. Incidents are connected components; chains count (D-010). | Built |
| BR-004 | **Independent reporters** = distinct device IDs among an incident's observations. 1 = *single report*, 2 = *corroborated*, ≥ 3 = *strongly corroborated*. | Built |
| BR-005 | **Urgency score**, an integer shown with its breakdown: category base (MEDICAL 50, TRAPPED 50, STRUCTURAL 35, FLOOD 30, MISSING_PERSON 30, ROAD_BLOCKED 20, WATER_FOOD 20, SHELTER 15) + corroboration (+10 per extra independent reporter, max +30) + people affected (`PEOPLE_BONUS[min(people, 15)]`, `PEOPLE_BONUS = [0,5,8,10,12,13,14,15,16,17,17,18,19,19,20,20]`; missing count scores 0) + 10 if unacknowledged − 1 per whole hour since the latest observation (max −20). **Open incidents clamp at 0.** Resolved incidents score 0 and always sort last. | Built |
| BR-006 | `SAFE_CHECKIN` never forms incidents; it shows as a per-area safe count. `area_text` is **required** on it. | Built |
| BR-007 | Acknowledge and resolve are observations of type `STATUS` referencing observation IDs; they apply to the incident containing those IDs. A newer REPORT reopens a resolved incident. A STATUS `created_at` is set to `max(device clock, latest referenced REPORT created_at + 1 s)`. | Built |
| BR-008 | Capacity: resident **500**, station **3,000**. Eviction order: `SAFE_CHECKIN`; then the lowest-urgency incident's observations, keeping its earliest and latest; then the oldest. Own un-uploaded observations are evicted only as a last resort, oldest first. | Built |
| BR-009 | Observations expire 72 h after creation (`SAFE_CHECKIN`: 24 h). | Built |
| BR-010 | At most 6 **REPORT** observations per device per hour. STATUS observations are not limited (D-017). **Only the device's own reports count** (BR-016). | Built; clarified |
| BR-011 | **Freshness** is a separate field from status and never changes the score or sort: **fresh** if the latest observation is under 1 h old, **stale** at 3 h or more, **aging** in between (D-023). A stale incident is labelled as last known information. | New (R1) |
| BR-012 | Every incident view shows **report count** (REPORT observations in the incident) and **source count** (independent reporters) as two separate numbers. | New (R1) |
| BR-013 | **Information gaps.** Each category has a fixed list of related categories (`GAP_QUESTIONS` in `rules.ts`). A related category is **known** if a non-resolved incident of it exists nearby (any GPS member of it within 300 m of any GPS member of this incident, or equal normalized area text when either has no GPS members) with `lastSeen` within T of the incident's `lastSeen`; otherwise it is **not yet reported**. A people count of 0 is shown as "not reported". Unknowns are always worded as missing reports, never as absence. | New (R4) |
| BR-014 | **Coverage** per normalized area text, over all observation types: **stale** if nothing newer than 3 h; otherwise **high** if 3 or more distinct devices reported in the last 3 h; otherwise **limited**. Observations with GPS but no area text share one bucket, "No area named". An expected area with no observations shows **no reports**, captioned that this does not mean it is safe. | New (R5) |
| BR-015 | **Propagation status** of an own observation, in increasing strength: *saved on this phone* → *passed to another phone* → *reached a station* → *uploaded from this phone*; plus *grouped with reports from N other phones* when its incident has more than one source. A status is set only on evidence the phone actually holds: a receipt scan or a completed sync send. Status flags only ever go from false to true. A receipt claiming station role is trusted, not verified, and the app does not present it as more than that. | New (R3) |
| BR-016 | **Local-only fields never leave the device.** `received_at`, `hops`, `own`, `uploaded`, `passed_on` and `reached_station` are stripped before any sync, QR bundle or upload. On receipt, `own` and `uploaded` are false and `received_at` is set by the receiver. | New (R0), fixes a defect |
| BR-017 | **Honest language.** No screen may state or imply that responders or emergency services received a report, that an area is safe because nothing was reported, or that a report is true. | New (R1–R5) |

BR-009 and BR-010 bound a device's own observations at **432**, below the 500 resident capacity, so the store cannot deadlock. BR-008's last-resort rung preserves that if either constant changes.

All thresholds and weights, including the new ones, live only in `packages/core/rules.ts`.

## 10. Functional requirements

| ID | Requirement | Status |
|---|---|---|
| FR-001 | Create an observation: category (large buttons), people affected (optional), note ≤ 140 chars, automatic GPS (if no fix within 30 s, purok/landmark text is required) and timestamp. Works offline. | Built |
| FR-002 | Observations persist across restarts, subject to BR-008/BR-009. | Built; verify on device in airplane mode |
| FR-003 | The incident engine computes incidents, corroboration and urgency (BR-003 to BR-007) after every change. | Built |
| FR-004 | **Carrying and passing on.** The phone shows how many observations and urgent incidents it holds and offers prominent **Pass on** and **Receive** actions. This round these use QR transfer (FR-013); if Multipeer lands (R6), a foreground carry mode discovers nearby phones and syncs automatically while open. | Revised |
| FR-005 | **Encounter sync:** exchange observation-ID summaries, then send missing observations, most urgent incident first, within a 10 s budget. | Built and tested on the simulated transport; runs on real radios only if R6 lands |
| FR-006 | **Station mode** (PIN-protected): larger capacity; **situation board** ordered by urgency with category, area, reports vs sources, corroboration, people affected, first and last seen, freshness, spatial extent and "why ranked here". Continuous discovery applies only with Multipeer (R6). | Built; evidence fields in R1 |
| FR-007 | **What changed:** board and dashboard highlight incidents that are new, escalated, newly corroborated or resolved since the viewer's last "mark as seen" or visit. | Built; not yet seen on a device |
| FR-008 | Operators can **acknowledge** or **resolve** an incident, creating a `STATUS` observation that spreads like any other. | Built; spreading not yet shown on devices |
| FR-009 | **Uplink:** upload all observations when internet is available, idempotent by ID. | Built as a manual "Upload now" button; not yet tested against a live Supabase project |
| FR-010 | **Responder dashboard (web):** the app's web build rebuilds incidents with the same engine and shows a ranked list, category filter, since-last-sync summary, and (from R1, R4, R5) the same evidence, gaps and coverage as the station. The **map is deferred**. | Built (list, filter, since-last-sync) |
| FR-011 | **My data:** everything the phone carries, with delete for own observations (deletion does not reach copies already passed on, and the app says so). Shows each own observation's propagation status (FR-015). | Built; status in R3 |
| FR-012 | **Onboarding:** a short introduction and permission requests. | Deferred; this round asks for location on the form and camera on the scan screen |
| FR-013 | **QR bundle transfer** (ADR-008, D-025). **Share:** the phone shows a cycling series of QR frames holding a **page** of up to 60 of its observations, most urgent first, with pause, manual frame paging and **Next page**. If the sharer first scans the receiver's optional ID frame, observations that phone already acknowledged are skipped. **Scan:** the other phone reads frames in any order, shows progress, applies the observations through the normal store rules, reports "Received N (M new)", and displays a one-frame **receipt** naming its role and device ID. The sharing phone scans the receipt to record propagation status. Two-way exchange is two passes, stated on screen. Works in Expo Go, in airplane mode, between any two phones with cameras. | New (R2) |
| FR-014 | **Evidence and Last Known Truth:** each incident shows report count, source count, first and last observed, age of latest evidence, a freshness badge, and a **timeline** of its observations and status actions with a short pseudonymous source label. | New (R1) |
| FR-015 | **Honest propagation status** for the reporter per BR-015, on the post-submit message and in My data. | New (R3) |
| FR-016 | **Known / not yet reported** on the incident detail and dashboard per BR-013. | New (R4) |
| FR-017 | **Coverage** section on the station board and dashboard per BR-014, with an optional station-entered list of expected areas. | New (R5) |
| FR-018 | **Simulation (`/sim`):** runs the real sync protocol across three simulated phones in the browser and shows them converge. Labelled as proof of the protocol, not of any radio. | Built |

## 11. Non-functional requirements

| ID | Requirement | Status |
|---|---|---|
| NFR-001 | Everything except upload and the dashboard works in airplane mode. QR transfer needs no radio at all; Multipeer needs Bluetooth and Wi-Fi on. | Revised |
| NFR-002 | **Determinism:** identical engine output for the same observations regardless of arrival order and runtime. Integer scoring. Applies equally to evidence, gaps and coverage, which take `now` as a parameter and never read the clock. | Built; extended |
| NFR-003 | 3,000 observations recompute in ≤ 300 ms on a mid-range phone. Measured at 6.9 ms in tests. | Met in tests |
| NFR-004 | A 100-observation encounter completes in ≤ 10 s (radio transport). Met on the simulated transport (151 ms). | Radio: only if R6 lands |
| NFR-005 | Battery use while carrying is measured in the field test (target ≤ 5 % per hour). iPhone figures are screen-on. | To measure (R7) |
| NFR-006 | An observation takes ≤ 20 s one-handed (target ~15 s); UI in English and Filipino; high contrast. | Built; time it in the field test |
| NFR-007 | Privacy: no accounts or names; random per-install device ID; source labels in the UI are shortened device IDs; no contact info; users can delete their own observations. | Built |
| NFR-008 | **This round: iPhone** on a version Expo Go supports for SDK 57. Android 10+ and current evergreen browsers remain supported targets for the codebase. | Revised |
| NFR-009 | *(new)* A full QR bundle (60 observations) transfers in **≤ 60 s** in indoor light, measured in the field test. | New (R2) |

## 12. Key feature: incident engine and evidence layer

### Incident engine (FR-003) — unchanged
- **Input:** the observations on the device, and `now`.
- **Output:** incidents `{key, category, observationIds, independentReporters, corroboration, peopleAffected, firstSeen, lastSeen, centroid or areaText, spatialExtentM, status, score, breakdown}`.
- **Key:** smallest observation ID (lowercase UUID ordering). Across changes the UI tracks incidents by overlapping observation IDs, not by key.
- **Edge cases:** no-GPS observations group by area text; a single report is an incident with *single report* corroboration; a STATUS referencing evicted IDs is ignored; clock skew is handled by BR-007.
- **Acceptance:** the 11 shared test vectors pass unmodified; shuffling input order doesn't change output; three FLOOD observations from 3 devices within 100 m and 20 min form one strongly corroborated incident.

### Evidence layer (FR-014, FR-016, FR-017) — new
Built **on top of** the engine's output in separate pure modules (`Evidence.ts`, `Gaps.ts`, `Coverage.ts`). It never changes grouping, scoring or status, so the engine's vectors stay valid. Station and dashboard call the same functions, so they cannot disagree.

**Example (station view):**
```
FLOOD — Purok 4                       Strongly corroborated · Open
4 reports · 3 sources        First 14:02 · Last 14:19 · Fresh (3 min ago)
Known:            Road blocked nearby (1 source)
Not yet reported: People trapped · Medical
Coverage — Purok 4: HIGH (4 phones, last report 3 min ago)
```

## 13. Data

**Observation (shared):** `id, type (REPORT|STATUS), category?, people?, note?, lat?, lon?, accuracy_m?, area_text?, created_at, device_id, refs[] (STATUS only), action? (ACK|RESOLVE), sig?`

**Local-only (never leave the device, BR-016):** `received_at, hops, own, uploaded`, and *(new)* `passed_on, reached_station`.

**Derived, never stored or sent:** incidents; evidence `{reportCount, sourceCount, firstSeen, lastSeen, latestAgeSeconds, freshness, timeline[]}`; gaps `{known[], unknown[]}`; coverage per area `{area, lastObservationAt, distinctDevices, level}`.

**QR frames:** bundle `PSB1:<bundleId>:<index>/<count>:<chunk>`, where the chunks are the base64 of the deflate-compressed `encodeBatch` of the page, 500 characters each (D-027); receipt `PSR1:<bundleId>:<role>:<deviceId>`; optional ID frame `PSI1:<role>:<deviceId>`.

**Sender-side memory (local only):** receiver device ID → observation IDs it acknowledged, capped at the 20 most recent receivers, used to skip duplicates on the next exchange.

- **Owner:** the creating device; others hold copies.
- **Retention:** BR-008/BR-009 on devices; 30 days after the event on the server (D-008, proposed).
- **Deletion:** local only; it does not reach copies already passed on.

## 14. Security and privacy

- **Corroboration counts devices, not people.** One person with several phones can inflate it. Stated on the dashboard and in the submission.
- **QR frames are readable by any camera in view.** A shared bundle exposes the same content (categories, notes, locations, shortened device IDs) that any PASAbi phone receiving it would hold. No names or contact details are ever in an observation.
- **Upload security:** the public anon key is safe only because of row-level security (`db/rls.sql`): insert and upsert observations, read one view. A database trigger keeps uploaded rows immutable. CI fails if a `service_role` key reaches the web bundle.
- **Station PIN** hides a UI mode on a shared phone; it does not protect data.
- **Signatures** remain supporting scope (deferred); device IDs are random, not cryptographic.
- **PASAbi does not claim reports are true.** It makes evidence and uncertainty visible.
- **No compliance claims** (e.g. Data Privacy Act); a proper review is required before real deployment.

## 15. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Too few phones to form a network | High | High | Stations and prepared volunteers (§7); the demo needs only 3–4 phones |
| Multipeer doesn't land in time | **High** | Medium | QR transfer (R2) is the guaranteed path; Multipeer is a timeboxed stretch |
| QR scanning slow or unreliable (low light, glare, many frames) | Medium | Medium | Frames arrive in any order and duplicates are ignored; 60-observation cap, most urgent first; manual paging; measure NFR-009 |
| Expo Go or a QR library incompatible with SDK 57 | Low–medium | High | Install with `npx expo install`; confirm in Expo Go before building on it |
| iOS suspends the app | Certain | Medium | Carrying is an explicit foreground action (D-013); stations stay open and plugged in |
| Local-only fields leak through sync | **Found** | High | Fixed first in R0 with tests (BR-016) |
| Expo Go can't restart offline (it loads the JS from the dev server) | Certain | Medium | D-024 demo protocol: load online, airplane mode, never reload; stated in honest limits; a standalone build needs D-019's open part |
| A fixed-size QR bundle resends the same top observations every time | Found in review | Medium | Paging plus per-receiver acknowledgement (D-025) |
| Freshness, gap or coverage thresholds wrong | Medium | Low | Constants in `rules.ts` (D-023); tune after the field test |
| "Not yet reported" read as "not happening" | Medium | High | Wording rules (BR-013, BR-017); reviewed on screen in both languages |
| Grouping thresholds wrong for real puroks; chaining merges distinct incidents | Medium | Medium | Spatial extent shown (D-010); operator can resolve; tune R and T only with time to recompute vectors |
| Fake or mistaken reports | Medium | Medium | Rate limit, source counting, visible evidence, operator resolve |
| Live demo fails | Medium | High | `/sim` and a recorded fallback; the honest-limits paragraph in `docs/SUBMISSION.md` |
| Supabase never tested live | High until done | High | Create the project and run both SQL files before recording |

## 16. Definition of Done (GIBC V2)

- QR spike (RS) run and recorded, pass or fallback.
- Phases R0–R2 complete and green (tests, typecheck, lint, web build); R3–R5 as time allows, cut in the order given in `docs/IMPLEMENTATION_UPDATE.md` §8.
- Field test on **3–4 iPhones in airplane mode** passing observations by QR (or Multipeer if R6 lands), with the demo scenario producing one strongly corroborated FLOOD incident on the station, and timings recorded in `docs/FIELD_TEST.md`.
- Upload tested against a live Supabase project; the dashboard matches the station board for the same observations.
- Web build deployed on Vercel, URL in the README.
- Public GitHub repo with README, setup steps, a chosen licence and team names; draft banner removed.
- 3–5 minute video stating the honest limits: iPhone-only this round; runs in Expo Go; transfer by QR scanning (unless R6 landed); iOS carries only while open; corroboration counts phones, not people; thresholds untuned.
- Project description using the Relay framing.
- `LEARNING.md` updated for every phase.

## 17. Related documents

- `docs/VALIDATION.md` — PRISM validation, claim check, pitch anchors, QR spike

- `docs/IMPLEMENTATION_UPDATE.md` — phases R0–R7, guardrails, constants, demo scenario
- `docs/ARCHITECTURE.md` — engine, sync protocol, platform constraints, ADRs
- `docs/DECISIONS.md` — D-001 to D-023, ADR-008, Package R
- `docs/FIELD_TEST.md` — run sheet
- `docs/SUBMISSION.md` — checklist, description draft, video script

## 18. Revision history

| Version | Date | Change |
|---|---|---|
| 0.4 | 2026-09-25 | React Native / Expo, iOS-first (D-014) |
| 0.5 | 2026-09-27 | Relay direction merged (D-018 to D-023); iPhone-only; QR transfer; evidence layer; BR-011 to BR-017; FR-013 to FR-018 |
| 0.5.3 | 2026-09-27 | Team roster added (README); owner name updated |
| 0.5.2 | 2026-09-27 | After AEGIS and ARGUS: design brief and tokens (`docs/design/`); QR pages compressed, 500-char frames (D-027); gaps measured member to member |
| 0.5.1 | 2026-09-27 | After PRISM and AERIAL review: QR paging and receipts (D-025), Expo Go runtime (D-024), spike first (D-026), outage framing corrected to days to weeks |
