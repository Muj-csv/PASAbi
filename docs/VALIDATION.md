# PASAbi: Pre-build Validation (GUNDAM PRISM)

**Date:** 2026-09-27 PHT · **Mode:** DEEP (hackathon) · **Subject:** PRD v0.5 + `IMPLEMENTATION_UPDATE.md`
**Modules run:** event-rules check, claim check, D Solution Map, I Convergence, G Feasibility, H Scope, Existence Audit, Stress Tests, J Pitch Anchors.
**Skipped:** A Graveyard and F Gap Hunt (the concept and gap were already chosen and argued in the repo), B Incentives (no status-quo actor resists this; the obstacle is missing information, not a villain), C field interviews (none available before the deadline — see Evidence gate).

This is a validation of a project that is already largely built, so the question is not "should this exist" but "is the remaining plan the right thing to build in the time left, and what must be proven first".

---

## Event constraints (checked on Devpost, 2026-09-27)

> **Correction (2026-10-01, D-042):** these are the rules of Beginner's Paradise: FirstCommit, checked by mistake. PASAbi is entered in the **Global Innovation Build Challenge V2**. Re-check deadline, judging, required items and eligibility against its rules; nothing below applies as written.

- **Deadline:** Sept 30, 2026, 5:00 pm EDT = **Oct 1, 05:00 PHT**. Team target: Sept 30, 22:00 PHT.
- **Judging:** Learning & Growth **30 %** · Creativity & Impact 25 % · Technical Execution 25 % · Presentation & Communication 20 %.
- **Required:** functional project started during the hackathon · public GitHub repo · project description · 3–5 min demo video · README with setup instructions for judges. Live hosting recommended, not required.
- **Eligibility:** ages **13–21**, students only; teams of **up to 6**. *Checked 2026-09-27: the six members whose birthdates were given are 19–21 however the dates are read. Mark Jemiel Guevarra's details are still missing. The rules don't say whether 21 is inclusive or on what date age is measured; three members are 20–21, so ask the organisers if unsure. The roster has **7** names against a limit of 6 — see `SUBMISSION.md`.*
- **Competing commitment:** the lead also has GIBC V2 (Sinopia) the same week (D-009, still open).

## Claim check

| Claim (where) | Verdict | Evidence |
|---|---|---|
| Barangays lose connectivity for "the first 24–48 hours" (PRD §2, README) | ⚠️ **understated** | After Super Typhoon Odette (Dec 2021), telecom infrastructure in Surigao City, Siargao, Dinagat, Maasin and Cebu was severed; the UN Emergency Telecommunications Cluster ran emergency connectivity at 24 sites and commercial service was only substantially restored by late March 2022. Say "days to weeks", not "24–48 hours" |
| Existing offline tools pass messages, not situation pictures (PRD §1, SUBMISSION) | ✅ holds, as far as searched | Bridgefy/Briar/BitChat are messaging; Ushahidi aggregates reports but needs connectivity (SMS/internet); PH apps found (AidVocate, ProjectLIGTAS, UP NOAH) are online-first |
| QR scanning works in Expo Go on iPhone (IMPLEMENTATION_UPDATE R2) | ⚠️ **plausible, unverified on device** | `expo-camera@57.0.5` exists for SDK 57 and includes QR scanning. A reported SDK 55 bug disabled barcode scanning in an **EAS development build** with static frameworks (expo/expo#44491). Expo Go ships its own native binary, so it should not be affected — but **R6 (Multipeer) moves to a dev build, and QR must be re-verified there** |
| `react-native-qrcode-svg` works with the stack | ✅ | v6.3.26, pure JS, peer deps `react-native-svg >= 14` and any React Native ≥ 0.63.4 |
| CI passes | ✅ | Lint, typecheck, 56 tests, web build and the `service_role` check all pass on `main` (run 2026-09-27) |

## Existence audit

> Searched: offline/mesh disaster reporting in the Philippines; delay-tolerant-network disaster situational awareness; crisis-report aggregation (Ushahidi); app stores and GitHub by the same terms, as of 2026-09-27.
> Closest existing solutions: **Ushahidi** — crowdsourced crisis mapping with report aggregation, for NGOs worldwide, but it depends on SMS or internet reaching a server. **DTN research systems** (e.g. DistressNet) — store-and-forward networking for disaster zones, focused on the network rather than on deduplicating reports into incidents. **Bridgefy / BitChat** — offline mesh messaging.
> Remaining gap: I did not find a documented deployed example, in the sources searched, of **grouping and corroborating reports into ranked incidents on the phones themselves, offline, with every phone deriving the same picture**. That is PASAbi's defensible core, and it does not depend on the transport.

## Convergence check (Module I)

PASAbi could collapse into "offline chat app" or "disaster dashboard" — both crowded. It doesn't, because of one mechanism: **incidents are derived deterministically on every phone from immutable observations**, so the transfer carries evidence, not messages, and any two phones with the same observations agree without a server. That fits in one sentence, so Differentiation passes.

The Relay additions (freshness, reports vs sources, known/unknown, coverage) **strengthen** this: they are what a message feed structurally cannot show.

## Stress tests

- **A — Expert discomfort.** A DRRM officer would recognise "no report ≠ safe" and "12 reports from 4 sources" as real failure modes of walk-in reporting and group chats. Pass.
- **B — Simplicity paradox.** The prototype is simple (a form, a QR code, a list); the insight (derive, don't transmit; show uncertainty) is not obvious. Pass.
- **C — Failure test.** Most likely failure: **the demo reads as "they scan QR codes"**, and judges discount the mesh claim. Second: **QR transfer is slower or flakier than expected on real iPhones**, and R2 eats a day. Third: Supabase is still untested when recording starts. All three are testable before the phase work — see the spike below.

## Pitch anchors (Module J)

- **The human this fixes:** the barangay secretary at the hall on the second morning after landfall, with a notebook of walk-in reports, trying to tell whether three people describing "baha sa may kapilya" are one flooded street or three.
- **The number:** after Odette, emergency connectivity had to be set up at 24 sites, and commercial telecoms took until late March 2022 — about three months — to substantially recover (UN Emergency Telecommunications Cluster). Cite it as that, not as a general statistic.
- **The prior-art answer:** "Bridgefy and BitChat move messages without signal. PASAbi moves observations and turns them into a ranked, evidence-backed picture that every phone computes identically — the station sees one flood incident with three sources, not three messages."
- **The credibility detail:** **missing.** The team has not spoken to a BDRRMO. One 15-minute conversation with a local barangay disaster officer before recording, asking how walk-in reports are logged today, would give a real quote and likely a correction to the categories or wording. Worth more to Creativity & Impact than any feature in R4–R5.

---

```text
╔══════════════════════════════╗
║        GUNDAM PRISM          ║
║  PRE-BUILD VALIDATION REPORT ║
╚══════════════════════════════╝

MODE:                 DEEP (event rules, claim check, D, I, G, H, existence audit, stress tests, J)
PROBLEM:              When towers fail, a barangay's reports arrive as duplicates and fragments;
                      responders can't tell what's corroborated, how fresh it is, or what's unknown.
PRIMARY USER:         Barangay disaster-response operator at a station (BDRRMC / secretary).
CURRENT ALTERNATIVES: Walk-in reports, notebooks, whiteboards, radio; group chats when signal exists;
                      offline messengers (Bridgefy, BitChat); online platforms (Ushahidi, PH relief apps).
CORE GAP:             Nothing found that corroborates reports into incidents on the phones, offline.
CORE MECHANISM:       Immutable observations → deterministic on-device incident engine → evidence layer
                      (sources, freshness, gaps, coverage), identical on every phone and the dashboard.
EVIDENCE:             Strong on the outage problem (ETC, Odette). Weak on user workflow (no BDRRMO
                      contact). Engine claims backed by tests. Transport and upload unproven on hardware.
FEASIBILITY:          prototype: yes — core built; R0–R2 fit in ~1.5 days | production: needs field
                      tuning, signatures, radio transport, DPA review — out of scope for the event.
BIGGEST RISK:         QR transfer on real iPhones (speed, reliability, Expo Go support) is unproven,
                      and it is the only real phone-to-phone path. Test it in a 45-minute spike first.

CORE MECHANISM TO PROVE: 3 FLOOD reports on 3 iPhones become ONE strongly corroborated incident on a
                         4th phone, with no signal, and the dashboard shows the same after upload.
FIRST PROOF:          Two iPhones in airplane mode in Expo Go: phone A shows a multi-frame QR bundle,
                      phone B scans it, and B's station board shows A's incident with identical score.
MUST BUILD:           R0 (wire-leak fix) · R1 (sources vs reports, freshness) · R2 (QR bundle + receipt).
DO NOT BUILD YET:     Multipeer before R2 is proven · anything in PRD §8 "Deferred" · new categories or
                      threshold changes (break 11 hand-computed vectors).

VALIDATION GATES:
  Problem           PASS — outage severity is documented (Odette, ETC); duplicate-report pain is real.
  User              PASS — one primary user with a concrete moment; residents are secondary.
  Differentiation   PASS — derive-don't-transmit + evidence layer; no equivalent found offline.
  Feasibility       NEEDS EVIDENCE — QR in Expo Go on iPhone unverified; resolved by the spike below.
  Evidence          NEEDS EVIDENCE — no field contact, Supabase untested; fixable before recording.

VERDICT:              GO — conditional on the QR spike passing (or its fallback).
NEXT STEP:            Run the QR spike, then R0 → R1 → R2 as planned. Book one BDRRMO conversation.
```

**PRISM Suggestion (reorders the plan, your call):** do a 45-minute QR **spike before R1**, not after. R1 is low-risk engine work that will land either way; R2 is the only thing that could force a change of demo. If the spike fails, you want to know on Sunday, not Monday night.

**Spike**
- **Question:** can Expo Go on your iPhones scan a cycling multi-frame QR bundle reliably?
- **Setup:** a throwaway screen that cycles 30 frames of random base64 every 400 ms, at 500 and 700 characters (updated after ARGUS: pages will be deflate-compressed into 500-char frames, D-027); a scan screen that counts distinct frames.
- **Pass bar (decided now):** all 30 frames collected in **≤ 30 s, in 4 of 5 attempts**, indoors, phone-to-phone.
- **Fallback if it fails:** drop to **400 characters per frame and 20 observations per bundle**, re-run once; if that also fails, use a **single static QR per observation** with manual paging (slow but certain), and lean on `/sim` for the "automatic convergence" part of the video.

**Also fix in the docs:** replace "24–48 hours" with "days to weeks" and cite the Odette figure (README, PRD §2, SUBMISSION).

---

## Handoff (for AERIAL)

```yaml
validation:
  skill: "GUNDAM PRISM"
  mode: "DEEP"
  modules_run: [event_rules, claim_check, D_solution_map, I_convergence, G_feasibility, H_scope, existence_audit, stress_tests, J_pitch]
  verdict: "GO"   # conditional on the QR spike
  date: "2026-09-27"
problem:
  statement: "When towers fail, barangay reports arrive as duplicates and fragments; responders cannot tell what is corroborated, how fresh it is, or what is unknown."
  affected_user: "Barangay disaster-response operator at a station"
  evidence_confidence: "medium"
user:
  primary_user: "BDRRMC operator / barangay secretary at the barangay hall or evacuation centre"
  initial_context: "One barangay, days to weeks without signal after a typhoon"
existing_solutions:
  direct: []
  adjacent: ["Ushahidi (aggregation, needs connectivity)", "DistressNet and DTN research (networking focus)"]
  substitutes: ["Bridgefy", "Briar", "BitChat", "AidVocate", "ProjectLIGTAS"]
  manual_workarounds: ["walk-in reports", "notebooks and whiteboards", "handheld radio", "group chats when signal exists"]
differentiation:
  core_gap: "No offline, on-device corroboration of reports into incidents found"
  core_mechanism: "Deterministic incident engine over immutable observations, plus an evidence layer, identical on every phone and the dashboard"
feasibility:
  prototype: "Yes. Core built and tested; R0-R2 about 1.5 days"
  production: "Not in scope: needs field tuning, signatures, radio transport, privacy review"
  constraints: { team: "7 named members (limit 6 on Devpost); lead shares the week with GIBC V2", budget: "free tiers", timeline: "submit by 2026-09-30 22:00 PHT" }
  major_dependencies: ["Expo Go on iPhone for SDK 57", "expo-camera QR scanning", "react-native-qrcode-svg", "Supabase free tier"]
  major_risks: ["QR transfer unproven on iPhones", "demo reads as 'just QR codes'", "Supabase untested", "QR must be re-verified if R6 moves to a dev build (expo/expo#44491)"]
scope:
  core_mechanism: "Observations become one corroborated incident on another phone with no signal"
  must_have: ["R0 wire-leak fix", "R1 reports vs sources and freshness", "R2 QR bundle transfer with receipt"]
  supporting: ["R3 propagation status", "R4 known/unknown", "R5 coverage"]
  deferred: ["see PRD v0.5 section 8"]
  do_not_build_yet: ["Multipeer before R2 is proven", "new categories", "threshold changes"]
  first_proof: "Phone A shows a QR bundle; phone B in airplane mode scans it and its board shows A's incident with an identical score"
evidence:
  strongest_sources: ["UN ETC Typhoon Rai/Odette response page", "Inquirer, 2021-12-18, telco outages", "expo/expo#44491"]
  unresolved_claims: ["QR throughput on iPhone", "user workflow at a real BDRRMO", "live Supabase upload"]
failure_modes:
  highest_risk: "QR transfer too slow or unreliable on iPhones"
  mitigation: "45-minute spike with a numeric pass bar before R1; defined fallbacks"
spike:
  question: "Can Expo Go on iPhone reliably scan a cycling multi-frame QR bundle?"
  pass_bar: "30 frames of 500 chars collected in <= 30 s, in 4 of 5 attempts, indoors; record catch rate p at 500 and 700"
  fallback: "400 chars and 20 observations per bundle; then one static QR per observation plus /sim for convergence"
event:
  name: "Beginner's Paradise: FirstCommit"
  deadline_local: "2026-10-01 05:00 PHT (team target 2026-09-30 22:00 PHT)"
  required_deliverables: ["functional project started during the event", "public GitHub repo", "project description", "3-5 min demo video", "README with setup instructions"]
  judging_criteria: ["Learning & Growth 30%", "Creativity & Impact 25%", "Technical Execution 25%", "Presentation & Communication 20%"]
pitch:
  human_this_fixes: "Barangay secretary on the second morning, notebook of walk-in reports, unsure whether three flood reports are one street or three"
  number: "After Odette, emergency connectivity at 24 sites; commercial telecoms substantially recovered only by late March 2022 (UN ETC)"
  prior_art_answer: "Messengers move messages without signal; PASAbi turns observations into one evidence-backed picture every phone computes identically"
  credibility_detail: "Missing: one conversation with a local BDRRMO before recording"
decisions: ["PASAbi is Relay's name", "iPhone-only this round", "QR bundle transfer is the guaranteed path", "Relay scope cut per D-022"]
open_decisions: ["D-009 staffing", "D-019 Mac and Apple account for R6", "licence", "whether to run the QR spike before R1"]
handoff:
  architecture_ready: true
  recommended_next_step: "AERIAL: architecture and phase plan update reflecting the spike-first order"
  assumptions_next_skill_must_respect: ["Do not change grouping, scoring, categories or existing vectors", "Evidence layer is separate pure modules", "No AI in the core", "Honest-language rules BR-013/015/017"]
```

## Sources

- [FirstCommit on Devpost](https://firstcommit.devpost.com/)
- [UN Emergency Telecommunications Cluster: Super Typhoon Rai/Odette](https://www.etcluster.org/emergency/philippines-super-typhoon-raiodette)
- [Inquirer: Power, telco services down in 22 provinces (2021-12-18)](https://newsinfo.inquirer.net/1529068/power-telco-services-down-in-22-provinces)
- [SunStar: PH disaster apps (AidVocate)](https://www.sunstar.com.ph/cebu/new-essentials-apps-to-keep-you-safe-informed-connected)
- [Ushahidi](https://en.wikipedia.org/wiki/Ushahidi)
- [DistressNet](https://www.sciencedirect.com/science/article/abs/pii/S1570870513001315)
- [expo/expo#44491: barcode scanning disabled in an SDK 55 dev build](https://github.com/expo/expo/issues/44491)
