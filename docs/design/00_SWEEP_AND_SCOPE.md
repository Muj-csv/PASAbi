# PASAbi UI — Trend Sweep, ChatGPT Review, Phase A Scope

Veronica · Locked Pipeline, Phase A · 2026-09-27 · against PRD v0.5.2
Status: **Input (historical).** Superseded where it disagrees with the locked docs. Feeds `UX_MAP.md` (Phase B) and `DESIGN_BRIEF.md` (Phase C).

---

## 1. Classification

| Axis | Call |
|---|---|
| App type | **Hybrid, stated split.** Resident side = consumer-mobile rules (thumb, feel, designed empty/error states). Station + web = dashboard rules (scan speed beats flourish). Where they conflict, legibility and trust win. |
| Mode | **Build** (new UI). ChatGPT's response gets an audit pass below. |
| Context | **Team** (4 people). The AEGIS/ARGUS brief in `docs/design/` is prior team direction and has to be reconciled or retired on purpose, not silently overwritten. |
| Speed | **Locked Pipeline, multi-day scale.** About 3 days to the Sept 30 target. Phases A–E run once. One anchor screen, one version. One Design Council pass before the demo. |

---

## 2. ChatGPT's response: keep, change, drop

### Keep. It already matches the PRD.

- **Complexity lives with the operator, not the reporter.** This is PRD §4 restated.
- **"3 phones" instead of "strongly corroborated."** Show the evidence and let the reader conclude. It is also honest: PRD §14 says corroboration counts devices.
- **Never "Severity: 87."** Show a rank, and put the breakdown behind "Why first?"
- **Honest propagation as the signature moment** (BR-015).
- **Stale items fade but stay visible**, with "may have changed."
- **"Haven't heard about"** instead of ❌ marks (BR-013).
- **A persistent offline strip instead of modal alerts.**
- **PASAbi never issues evacuation instructions** (BR-017).
- **Visible privacy:** no name, no number, no account.
- **Cut the map.** The PRD already defers it.
- **A forbidden list at the top of the brief.**
- **The operator's five questions** (what, where, how recent, how many phones, what's unknown) as the order of information on the station.

### Change

| ChatGPT said | Problem | Change to |
|---|---|---|
| "Visually quiet": no personality, restraint everywhere | Conflicts with your goal. Quiet is not the same as bland. Two human-made emergency references keep the facts strict and put the warmth somewhere else (§3.3). | **Quiet data, lively moments.** Station rows stay strict. The pasabi moments (save, hand off, received) carry the personality. |
| ALL CAPS on nearly every label | All-caps section labels are on 2026 AI-slop lists. Caps also read slower because words lose their shape. | **Sentence case everywhere.** Caps are allowed in one stamp style only (§4). |
| Emoji category icons (🚑 🌊 🧍) | Emoji as icons is a listed slop tell. Emoji also render differently on each OS and read as casual. | **A drawn pictogram set of 9 icons**, one style, matched to BR-001. This is also a place for personality. |
| 🔴 critical, 🟠 aging, 🟢 fresh | **Collides with PAGASA.** Filipinos already read yellow, orange and red as rainfall warning levels (orange = flooding threatening, red = evacuate). An orange "aging" badge would look like an official warning. ([Spot.ph explainer](https://www.spot.ph/newsfeatures/culture/94414/rainfall-warning-color-meaning-pagasa-a4373-20210721)) | **Freshness as fading ink:** full ink, then lighter, then faint, plus a glyph and a time. **No warning hues on data.** |
| "Deep blue primary" | Unexamined. Blue on dark is the #1 statistical AI default in 2026. | A colour sourced from the concept (Phase C options, §5). |
| SF Pro only, SF Mono for data | The system face for body text is right (Dynamic Type, iOS convention). Using only it is the "didn't pick" tell. | System face for body. **One chosen display face** for the moments. Mono only where the data is real (times, device labels). |
| Resident home: big Report button in the middle | One-handed use under stress needs the primary action in the thumb zone. | **Status at the top, actions in the bottom half.** Report is largest. |
| Station: separate Urgent / What changed / Gaps sections | "What changed" repeats incidents already on the list. That is wordiness in the layout. | **One ranked ledger.** Changes appear as margin marks on the rows (FR-007). Gaps live in incident detail. Coverage is one strip. |
| Repeat "No reports ≠ safe" everywhere | Repetition teaches people to skip it. | **Once per screen, same position, same words**, drawn from central strings. |
| QR: "86% · 7 of 8 pages" | Mixes up frames with PRD **pages** (a page is up to 60 observations, FR-013). | Frames stay invisible: "Hold steady · 7 of 8". "Next batch" means the next PRD page. |
| 8 categories | Misses `SAFE_CHECKIN` and renames STRUCTURAL. | All 9 from BR-001. "I'm safe" is a separate, lighter action because it needs area text (BR-006). |
| 11 design docs | Too many to keep in sync in 3 days. | **Three:** UX_MAP, DESIGN_BRIEF, SCREENS. Copy rules go in DESIGN_BRIEF §Voice. Strings stay in the existing i18n file. |

### Drop

- **"Three different products"** (reporter, carrier, operator) as a build plan. Carrier is two buttons on the resident home. We build **two modes** (resident, station) plus the web dashboard, which reuses station components.

### ChatGPT missed these states

- **Rate limit reached** (BR-010: 6 reports per hour).
- **Wrong PIN** when entering station mode.
- **Receipt not scanned.** The status stays at "saved" and must not upgrade (BR-015).
- **Delete is local only** (FR-011).
- **Station receipt is trusted, not verified** (BR-015).

---

## 3. Trend sweep, September 2026

### 3.1 Wordiness

- **Under stress, people judge fast and intuitively; they don't reason.** Ask for one thing at a time, in 10–30 s segments, highest priority first. ([Smart Interface Design Patterns](https://smart-interface-design-patterns.com/articles/stress/))
- **Crisis copy should be short, clear sentences with no jargon.** When something is still unknown, say so and say when the next update is. ([UXmatters, LA wildfires](https://www.uxmatters.com/mt/archives/2025/03/ux-design-for-crisis-situations-lessons-from-the-los-angeles-wildfires.php))
- **All-caps labels** are on the 2026 slop lists. ([Developers Digest, 16 patterns](https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it))
- **Taglish** works in informal digital contexts. Formal UI strings stay in standard Filipino or English. ([GPI](https://www.globalizationpartners.com/2024/11/27/taglish-linguistic-blend-filipino-identity/)) So: the resident side uses everyday spoken Filipino, and the station side uses plain standard wording. Test both with barangay staff.
- *Observed, not sourced:* AI-written UIs over-explain. They put a subtitle under every heading, restate the button in the body text, and add "successfully" and hedges. ChatGPT's own sample copy does this (see rewrites).

**Proposed word budgets.** These go into DESIGN_BRIEF §Voice.

| Element | Budget | Example |
|---|---|---|
| Button | ≤ 3 words, verb first | Pass it on · Ipasa |
| Screen title | ≤ 4 words | What's happening? |
| Status line | ≤ 6 words | Saved on this phone only |
| Helper text | ≤ 12 words, max 1 per screen | |
| Caveat | Once per screen, fixed wording | No report doesn't mean none. |
| Evidence | Numbers, not sentences | 3 phones · 4 reports · 14:19 |

Also:
- **Times.** Operators see clock time first ("14:19"). Residents see relative time ("8 min ago").
- **Banned words:** successfully, please, just, oops, exclamation marks, "verified", "safe".

**Rewrites of ChatGPT's copy**

| ChatGPT (words) | Rewrite |
|---|---|
| "Your report has NOT reached responders yet. Pass it to another PASAbi phone or a station to move it onward." (20) | **Saved on this phone only.** [Pass it on] · *Naka-save lang sa phone na ito.* [Ipasa] |
| "TRANSFER COMPLETE · 18 reports checked · 7 new reports received · ✓ Your reports included · ✓ 18 reports passed on" (17) | **Got 18 · 7 new** (receiver) / **Passed on 18** (sender), plus a stamp |
| "The camera couldn't read the next page. Try: move apart · reduce glare · keep QR in frame" (19) | **Can't read it. Tilt away from light.** One tip at a time, rotating. |
| "PASAbi priority is calculated using fixed local rules. It does not predict severity or verify the report." (17) | **Sorted by fixed rules. Not a danger rating.** |
| "This does NOT mean these problems are absent." (8, repeated per section) | Section header **Haven't heard about**, plus one caveat line per screen |
| "This was reported earlier. Conditions may have changed." (8) | **Last heard 5h ago · may have changed** |

### 3.2 Layout and organisation

- **A common operating picture has to make priorities obvious without clutter.** A stale display can be more dangerous than no display at all. Flag missing feeds instead of guessing. Give each role its own view. ([Resgrid COP guide 2026](https://blog.resgrid.com/common-operational-picture/))
- **Dashboard tells to avoid:** stat-banner rows, cards with a coloured top or left border, identical icon cards, numbered 1-2-3 sections, emoji in navigation. ([Developers Digest](https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it); [925 Studios, Jun 2026](https://www.925studios.co/blog/ai-slop-design-tells))
- **"Polished slop":** execution keeps improving while distinctiveness drops. Generic hurts more than ugly because it gets forgotten. ([925 Studios](https://www.925studios.co/blog/ai-slop-design-tells))
- **Human move:** use a **ledger, not a card grid**. Your own PRD §3 already has the concept: *"your whiteboard, but every entry has a time, a source, a location and a history."*

### 3.3 How humans actually designed emergency products

**Tokyo Bousai** (Nosigner, Tokyo Metropolitan Government)
- Yellow and black construction-site stripes as the main cue.
- A different illustration layer for each audience: a mascot for kids, realistic manga for adults, UD fonts for the elderly.
- The explicit idea is "hard + soft": reliability and accuracy *alongside* familiarity and warmth. ([Nosigner](https://nosigner.com/projects/bousai/), [BP&O](https://bpando.org/2016/08/17/graphic-design-tokyo-bousai/))
- **Lesson:** the facts stay strict and the warmth goes into a separate layer. This is exactly the formal/lively split you asked for.

**Watch Duty**
- Built by a small team after a founder lived through a wildfire. No sign-up, no ads.
- Its trust comes from **human authorship**: volunteer reporters, including ex-responders, write human-verified updates.
- In June 2026 it added flood tracking and changed its logo to a yellow box with a black flame. ([Wikipedia](https://en.wikipedia.org/wiki/Watch_Duty), [App Radar](https://appradar.com/blog/how-watch-duty-became-the-1-wildfire-tracking-app-on-the-app-store))
- **Lesson:** personality can come from *people*, not decoration.

**Warning.** Both references reach for hazard yellow and black. It is becoming the genre look, and in the Philippines yellow is also PAGASA's rainfall-warning level. **Don't copy it.**

### 3.4 Platform

- **iOS 26 Liquid Glass** is the current system chrome. `expo-glass-effect` works in Expo Go on SDK 57 with iOS 26+, falls back to a plain View, and should be guarded with `isGlassEffectAPIAvailable()`. ([Expo docs](https://docs.expo.dev/versions/latest/sdk/glass-effect/))
- **Rule:** native chrome may be glass. Content never is. This refines ChatGPT's "no glassmorphism."

### 3.5 Where the trend is going

- The counter-trend to AI sameness is **imperfection, tactility, noise, and protest-poster or scrapbook material**. ([AI Goodies, 2026 aesthetics](https://aigoodies.beehiiv.com/p/aesthetics-2026))
- "Technical Mono" is also listed as a 2026 trend. A dense, dark, mono, Linear-style station would be the new tasteful default. **Avoid it.**

### 3.6 Veronica tells check

- `tells.md` is dated Sep 2026 (refreshed 09-05), so it isn't stale.
- New instances of existing categories: all-caps labels, badge above the H1, permanent dark mode with grey body text, and the "polished slop" feedback loop.
- Not written into the skill because the installed skill files are read-only here. They are logged in this document instead.

---

## 4. The idea that ties it together (proposal)

**PASAbi = a note passed hand to hand, and a logbook that receives it.**

**Formal half: the station as a barangay logbook.**
- Ruled rows, clock times in the margin, handwriting-style margin marks for "new" or "+1 phone" (FR-007).
- Fading ink shows freshness.
- Strict, scannable, official.

**Lively half: the resident's report as a pasabi slip.**
- **Save** creates the slip.
- **Each propagation step adds a rubber stamp:** SAVED → PASSED ON → AT STATION → UPLOADED. These are exactly the BR-015 stages. A stamp appears only when the evidence exists (a scanned receipt).
- The "RECEIVED" stamp with date and initials is a real Philippine office ritual. It gives formality and personality in one gesture.
- Stamps are the one place caps are allowed.

**Why this is load-bearing, not decoration.** It traces to the product name (*pasabi* = a message you ask someone to pass along), to PRD §3's whiteboard line, and to BR-015's evidence-only status. That makes it pass Veronica's "strip the details, is it still this product?" test.

**Possible extra (flagged, not in the PRD):** show source labels as word pairs derived from the device ID (e.g. "Mangga-Ilog") instead of "7A3". They are still pseudonymous and easier for an operator to remember. Risk: people may read them as identities. This needs a team decision.

---

## 5. Phase A — Scope

**The product in one line.** An offline iPhone app where residents save and pass on short observations by QR, and a station phone rebuilds them into a ranked, evidence-first picture that is honest about age and gaps.

**Screens and states**

| # | Screen | Build this round? |
|---|---|---|
| R1 | Resident home: status strip, "carrying N", Report, Pass on, Receive, My reports | Yes |
| R2 | Report flow: category → people → what did you see → location → save (FR-001) | Yes |
| R3 | Saved slip with propagation stamps (FR-015) | Yes |
| R4 | Pass on (QR share, pause/page, scan receipt) (FR-013) | Yes |
| R5 | Receive (scan, progress, "Got N · M new", show receipt) | Yes |
| R6 | My reports / My data (status per slip, local-only delete) | Yes |
| R7 | Settings: language, what PASAbi saves, station PIN | Yes (light) |
| S1 | Station situation ledger + coverage strip + offline/connected bar | Yes |
| S2 | Incident detail: evidence, timeline, known / haven't heard, why first, ack/resolve | Yes |
| S3 | Coverage detail + expected areas | If R5 lands |
| S4 | Station status: storage, upload now, last upload, exit | Yes (light) |
| W1 | Web dashboard (reuses S1/S2 components) + since last sync | Yes |
| W2 | /sim, labelled as protocol proof | Keep as is |
| — | Onboarding, map | Deferred (PRD) |

**States:**
- empty ledger ("No reports yet")
- no GPS → landmark required
- offline
- QR can't read
- storage limited
- stale
- upload failed
- rate limit
- wrong PIN
- receipt not scanned

**Proposed anchor screen: S1 station ledger, with one S2 incident.**
- The demo's payoff (one FLOOD incident with 3 phones) lands here.
- It exercises the most components: rows, freshness ink, counts, margin marks, status bar and coverage.
- **Risk:** the lively half (slip and stamps) isn't proven by it. The fallback is to build R3 right after as a second check.
