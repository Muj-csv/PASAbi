# Pasabi: Product Requirements

*Pasabi* (Filipino: a message you ask someone to pass along) · **P**eer-carried **A**lerts, **S**ynthesized **A**nd **B**arangay-**I**ndexed

| | |
|---|---|
| Version | 0.4 |
| Status | Ready to build (open decisions in `DECISIONS.md`) |
| Owner | Jum Flores and team |
| Updated | 2026-09-25 |
| Event | Beginner's Paradise: FirstCommit. Submit by **Sept 30, 5:00 pm EDT (Oct 1, 05:00 PHT)** |

> **When the network disappears, Pasabi lets the community become the network and turns scattered observations into a shared picture of what is happening.**

## 1. Summary

Pasabi is a store-and-forward **incident network** for barangays. Residents and volunteers record short, structured **observations** ("flood water entering the road", "3 people need water") on their phones. Phones exchange observations peer-to-peer over Bluetooth and Wi-Fi whenever they meet. Every device runs the same deterministic **incident engine**, which groups related observations into **incidents** (same kind, nearby, close in time), counts how many independent devices corroborate each one, and ranks them with a transparent urgency score.

Pre-positioned **station devices** (barangay hall, evacuation centre, school) collect everything and show a **situation board**. When any device reaches the internet, all observations upload and a responder dashboard rebuilds the same incident picture, including **what changed since the last sync**.

The basic unit is not a message. It is **observation → incident → corroboration → situation picture**.

## 2. Problem

After major typhoons, cell towers lose grid power. For the first 24–48 hours, a barangay's disaster-response operators don't know what's happening beyond what people walk in and tell them. Even when reports do arrive, they arrive as a pile of duplicates and fragments, not as a picture of where the problems are and how many people are affected.

## 3. Users

| User | Role in Pasabi |
|---|---|
| **Barangay disaster-response operator** (BDRRMC staff, barangay secretary) at a station | **Primary.** Reads the situation board, acknowledges and resolves incidents |
| **Volunteers / tanods** | Roaming carriers; submit observations while moving around |
| **Residents** | Submit observations; carry others' observations |
| **Municipal responders** (MDRRMO, LGU) | Read the web dashboard once any station or phone gets connectivity |

**Scope:** one barangay, the first 24–48 hours after connectivity loss.

## 4. Goals and non-goals

**Goals**
- G-1: Turn many overlapping reports into a small set of incidents, with corroboration counts, on the devices and without internet.
- G-2: Every device that holds the same observations shows the same incidents and ranking. No server or coordinator is needed.
- G-3: The most urgent incidents survive storage limits and reach stations first.
- G-4: Responders see what changed since their last sync, not a raw feed.

**Non-goals:** chat or messaging; AI or ML ranking (all ranking is rule-based and explained); predicting disasters; replacing official channels; verifying anyone's identity; a mesh that spans iOS and Android (D-012).

## 5. Deployment model

Pasabi is deployed **before typhoon season**, not installed after the disaster:
1. **Station devices** at the barangay hall, evacuation centres and schools, on phones that stay plugged in with the screen on.
2. **Volunteers** (tanods, BHWs, SK) install Pasabi and act as carriers.
3. **Residents** install it through barangay orientation.

**Carrier model, revised for iOS (D-013).** iOS has no equivalent of Android's foreground service, so an iOS device only exchanges observations while Pasabi is **open on screen**. Carrying is therefore an explicit action, not a passive background one: volunteers open Pasabi when they arrive somewhere, and the UI makes "hold the phones near each other" a prominent, obvious step. Station devices are unaffected — they are plugged in with the app foregrounded. On Android the foreground service restores passive carrying as an enhancement.

**Single-platform mesh (D-012).** iOS devices sync with iOS devices and Android with Android; the two do not interoperate. A mixed barangay runs two islands that reconcile the moment either reaches the internet. Deployments should standardise on one platform per barangay.

The network is still useful with only stations and a few volunteers.

## 6. Scope

| MVP | Supporting (if time allows) | Later |
|---|---|---|
| Observation form · local store · incident engine · urgency score with explanation · encounter sync · carry mode · station mode + situation board · "what changed" · acknowledge/resolve · uplink · responder dashboard · radio-enable onboarding | Observation signatures · eviction that keeps incident summaries · Android background carry service · offline app-sharing guide | SMS/satellite uplink codec · photos · MapaKalamidad export · cross-platform mesh |

**Out of scope:** chat, AI chatbot, AI prediction, social feed, offline map tiles, blockchain, custom BLE stack, cross-platform (iOS↔Android) mesh, accounts.

## 7. Business rules

| ID | Rule |
|---|---|
| BR-001 | Observation categories: `MEDICAL`, `TRAPPED`, `STRUCTURAL`, `FLOOD`, `ROAD_BLOCKED`, `MISSING_PERSON`, `WATER_FOOD`, `SHELTER`, `SAFE_CHECKIN`. |
| BR-002 | Observations are **immutable** and identified by a **lowercase UUIDv4**, normalized on ingest. They are only ever added or evicted, never edited. |
| BR-003 | **Incidents are derived, never transmitted.** Two observations belong to the same incident if they share a category, were created within **T = 6 h** of each other, and either **(a)** both have a GPS fix and are within **R = 150 m**, or **(b)** at least one has **no** GPS fix and their normalized area texts are equal and non-empty. Normalization: lowercase, trim, collapse internal whitespace. Incidents are the connected components under this rule; linked chains count (see D-010). |
| BR-004 | An incident's **independent reporters** = the number of distinct device IDs among its observations. Corroboration: 1 = *single report*, 2 = *corroborated*, ≥ 3 = *strongly corroborated*. |
| BR-005 | **Urgency score** — an integer, shown to users with its breakdown: category base (MEDICAL 50, TRAPPED 50, STRUCTURAL 35, FLOOD 30, MISSING_PERSON 30, ROAD_BLOCKED 20, WATER_FOOD 20, SHELTER 15) + corroboration (+10 per extra independent reporter, max +30) + people affected (`PEOPLE_BONUS[min(people, 15)]`, where `PEOPLE_BONUS = [0,5,8,10,12,13,14,15,16,17,17,18,19,19,20,20]`; a missing people count scores 0) + 10 if unacknowledged − 1 per whole hour since the latest observation (max −20). **Open incidents clamp at a minimum of 0.** Resolved incidents score 0 and always sort last. |
| BR-006 | `SAFE_CHECKIN` observations never form incidents; they show as a per-area "safe" count. `area_text` is **required** on a SAFE_CHECKIN. |
| BR-007 | Status actions (acknowledge, resolve) are themselves observations of type `STATUS` that reference observation IDs. They apply to the incident containing those IDs. A newer non-status observation added to a resolved incident reopens it. A STATUS observation's `created_at` is set at creation to `max(device clock, latest referenced REPORT created_at + 1 s)`, so clock skew cannot make a status appear to precede what it answers. |
| BR-008 | Storage capacity: resident **500** observations, station 3,000. When full, evict in this order: `SAFE_CHECKIN` first; then observations of the lowest-urgency incident, but always keep that incident's earliest and latest observations; then the oldest. A device never evicts its own un-uploaded observations **while any other candidate exists**; as a last resort it evicts its own oldest un-uploaded observation rather than refuse to record a new one. |
| BR-009 | Observations expire 72 h after creation (`SAFE_CHECKIN`: 24 h). |
| BR-010 | A device may create at most 6 **REPORT** observations per hour. STATUS observations are operator actions and are not rate limited (D-017). |

BR-009 and BR-010 together bound a device's own observations at **432**, below the 500 resident capacity, so the store cannot deadlock on un-evictable own data. The last-resort rung in BR-008 preserves that invariant if either constant changes.

The values of R, T, the weights and the capacities are constants in one file (`packages/core/rules.ts`) and are covered by tests. Changing them is a decision (see `DECISIONS.md`).

## 8. Functional requirements

| ID | Requirement |
|---|---|
| FR-001 | Create an observation: category (large buttons), people affected (optional), note ≤ 140 chars, auto location (GPS; if there's no fix within 30 s, purok/landmark text is required) and timestamp. Works offline. |
| FR-002 | Observations persist locally across restarts and are subject to BR-008/BR-009. |
| FR-003 | The incident engine computes incidents, corroboration and urgency (BR-003 to BR-007) from the local observation set after every change. |
| FR-004 | **Carry mode:** the device advertises and discovers nearby Pasabi devices and shows how many observations and urgent incidents it is carrying. On iOS this requires the app to be foregrounded, so the UI presents syncing as an explicit, prominent action (D-013). On Android a foreground service with a persistent notification ("Carrying N observations · M urgent incidents") restores passive carrying. |
| FR-005 | **Encounter sync:** on meeting, devices exchange observation-ID summaries, then send each other the missing observations, **most urgent incident first**, within a 10 s budget. |
| FR-006 | **Station mode** (PIN-protected): larger capacity, continuous discovery, **situation board** listing incidents by urgency with category, area, corroboration, people affected, first and last seen, **spatial extent**, and a "why ranked here" breakdown. |
| FR-007 | **What changed:** the situation board and dashboard highlight incidents that are new, escalated (score up), newly corroborated or resolved since the viewer's last visit or sync. |
| FR-008 | Station operators can **acknowledge** or **resolve** an incident (creates a `STATUS` observation that spreads like any other). |
| FR-009 | **Uplink:** when internet is available, upload all observations (idempotent by ID). |
| FR-010 | **Responder dashboard (web):** the same app's web build, rebuilding incidents with the same engine and showing a ranked list, map, category filter and "since last sync" summary. |
| FR-011 | **My data:** a user sees everything their device carries and can delete observations they created. |
| FR-012 | **Onboarding:** explains Pasabi in 3 screens, requests permissions, and asks the user to turn Bluetooth/Wi-Fi on if they're off (apps can't switch radios on themselves). |

## 9. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-001 | Everything except FR-009/FR-010 works in airplane mode with Bluetooth and Wi-Fi on. |
| NFR-002 | **Determinism:** the incident engine gives identical output for the same observation set regardless of arrival order, and identical output on every runtime it ships to (Hermes on native, the browser engine on web). Checked by shared test vectors. No floating point in scoring. |
| NFR-003 | The engine recomputes 3,000 observations in ≤ 300 ms on a mid-range phone. |
| NFR-004 | An encounter with 100 new observations completes in ≤ 10 s. |
| NFR-005 | Carry-mode battery use is measured in the field test and reported (target ≤ 5% per hour). On iOS this is screen-on use, so the figure is reported separately from Android's background figure. |
| NFR-006 | Creating an observation takes ≤ 20 s one-handed; UI in English and Filipino; high contrast. |
| NFR-007 | Privacy: no accounts or names; the device ID is a random per-install value; contact info is not collected; users can delete their own observations. |
| NFR-008 | **iOS 15+** (primary), **Android 10+ / API 29+** (secondary), and current evergreen browsers for the web build. |

## 10. Key feature: incident engine (FR-003)

- **Input:** the set of observations currently stored on the device, and `now`.
- **Output:** incidents `{key, category, observation IDs, independent reporters, corroboration level, people affected (max reported), first seen, last seen, centroid or area text, spatial extent, status, urgency score, score breakdown}`.
- **Incident key:** the smallest observation ID in the group (lowercase UUID ordering). It's stable as long as that observation remains stored; the UI tracks incidents across changes by overlapping IDs, not by key.
- **Edge cases:** observations without GPS group by area text; a single report stays an incident with "single report" corroboration; a STATUS observation referencing evicted IDs is ignored; clock skew is handled by BR-007's clamp.
- **Acceptance:** given the shared test-vector files, the engine produces the expected incidents and scores on every target runtime. Shuffling the input order doesn't change the output. Three FLOOD observations from 3 devices within 100 m and 20 min form one strongly corroborated incident.

## 11. Data

**Observation:** `id, type (REPORT|STATUS), category?, people?, note?, lat?, lon?, accuracy_m?, area_text?, created_at, device_id, refs[] (STATUS only), action? (ACK|RESOLVE), sig?` plus local-only `received_at, hops, own, uploaded`.

- **Owner:** the creating device. Carriers hold copies.
- **Retention:** BR-008/BR-009 on devices. On the server, 30 days after the event (see `DECISIONS.md`).
- **Deletion:** a user can delete their own observations locally; deletion doesn't reach copies already carried by others (stated in the app).

## 12. Security and privacy

- **Supporting:** each observation is signed with the device's key, so carriers can't alter it. Unsigned or invalid observations are dropped.
- **Corroboration limits:** it counts distinct devices, so one person with one device can't fake corroboration. A person with several devices can. This limitation is stated on the dashboard.
- **Upload security:** uploads use an insert-only database role, and the app never contains admin keys.
- **No compliance claims:** no claim of compliance with the Data Privacy Act; a proper review is required before real deployment.

## 13. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Too few devices to form a network | High | High | Station devices + volunteer carriers (§5); demo shows 3–4 devices |
| iOS suspends the app, so carrying stops | **Certain** | High | Designed for, not against: D-013 makes carrying an explicit foreground action; stations stay plugged in and foregrounded |
| iOS and Android can't mesh with each other | **Certain** | Medium | D-012: standardise one platform per barangay; islands reconcile via uplink |
| Multipeer native module doesn't land in time | Medium | Medium | iOS-first, not iOS-only: the Android Nearby transport proves the mesh independently |
| Apple Developer enrolment delays the iOS build | Medium | High | D-011: start enrolment immediately; no other workstream depends on it |
| Grouping thresholds wrong for real barangays | Medium | Medium | Constants in one file; explanation shown in the UI; tune in the field test |
| Transitive chaining merges distinct incidents | Medium | Medium | D-010: spatial extent shown; operator can resolve; tune after field test |
| Fake reports inflate urgency | Medium | Medium | Rate limit, device-distinct counting, operator can resolve; limitation stated |

## 14. Definition of Done (FirstCommit)

- MVP scope passes its acceptance tests in a field test with ≥ 3 devices **on one platform's mesh**.
- Web build deployed on Vercel (team preview + responder dashboard).
- Public GitHub repo with README and setup steps.
- 3–5 minute demo video.
- Devpost description.
- `LEARNING.md` devlog (the judging criteria weight *Learning & Growth* at 30%).
