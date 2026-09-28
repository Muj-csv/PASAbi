# DESIGN_BRIEF — PASAbi (Relay alignment screens)

> **Superseded 2026-09-28.** `src/theme/tokens.ts` now implements a different,
> later design package ("logbook + stamp": coral + ballpen, Doto numerals,
> ledger rows, stamps) applied as a re-skin of the existing routes — no new
> screens or navigation. This file's colour/type values in `src/theme/tokens.ts`
> no longer match; kept here for history and for the parts of the brief
> (layout intent, copy, state matrix) that are still accurate. See
> `src/theme/tokens.ts`'s header comment for the current source of truth.

Status: Locked — 2026-09-27 (plan only; nothing new rendered yet)
Updated: 2026-09-27 · Owner: Ian Patrick Flores · Values: `docs/design/tokens.json` → mirrored by hand in `src/theme/tokens.ts`
Upstream: `docs/PRD.md` v0.5.1 · `docs/ARCHITECTURE.md` · `docs/IMPLEMENTATION_UPDATE.md` (phases R1–R5) · `docs/VALIDATION.md`

> **For teammates and Claude:** read this file, then build against `src/theme/tokens.ts`. Three rules: (1) only theme tokens — no raw hex, no one-off font sizes or gaps; (2) every state in §11 exists for every screen you touch; (3) before calling a screen done, ask Claude (with AEGIS) to run the checks, or run the slop lint and render check listed in §14.

> **Traces.** Values live only in `tokens.json`. **team** = the existing screens already used it on purpose · **delegated** = picked by AEGIS on 2026-09-27 because the lead asked for the skills to be run and gave no design direction; change any.

**Classification.** App type: hybrid — **dashboard-data** for the station board, incident detail and responder dashboard (the primary user); **consumer-mobile** for the report form, QR screens and reporter status. Mode: Build (new screens) plus an audit of the existing ones. Tier: Standard (3½ days, multi-screen). Stack: React Native StyleSheet via Expo, iPhone in Expo Go, plus the React Native Web build.

---

## 1. Anchor

- **Reference:** none supplied. Grounding is the existing screens (blue accent, grey page, 10 px radius, system type) and the Relay principles in PRD §6.
- **The one job (product):** a station operator decides **what to act on next, and how much to trust it**. For a reporter: record an observation in about 15 seconds and know honestly where it went.
- **Direction (delegated):** **a field logbook, not a feed.** Plain, exact, calm. Every line says what is known, from how many phones, and how old it is.

## 2. Personality

- **Should feel:** plain, exact, calm. An operator at 3 am after landfall should read it at arm's length without being alarmed by decoration.
- **Should NOT feel:** a social feed; a glossy app-store app; a dark "war room" monitoring wall with glowing reds; anything that sounds more certain than the evidence.

## 3. Layout intent, per screen

Route names follow AERIAL (`src/app/…`). New routes: `share` and `scan`.

| Screen (route) | One job | Skeleton | Why not the default |
|---|---|---|---|
| **Report** (`index`) | Record in ~15 s | Category buttons in an **even 2-column grid** (Medical, Trapped first; "We are safe" full-width, separated below). Location line. Optional fields. **Submit always enabled**: tapping with something missing names what's missing inline and scrolls to it. After saving, the reporter-status panel (§3a) replaces the success line | The current grid wraps to ragged widths, and the submit button greys out with no reason given — the user can't tell they must pick a category first |
| **Station board** (`station`) | Pick the next incident to act on | Single column. A **summary strip** at the top ("7 incidents · 2 stale · 1 area with limited coverage", each part tappable). Incident cards in urgency order (anatomy below). Resolved at the bottom, faded. **Coverage by area** as a section after the incidents | Coverage matters but isn't the operator's first question; putting it first would push the top incident below the fold |
| **Incident detail** (`incident/[key]`) | Decide: acknowledge, resolve, or ask for more information | 1 header (category, area, status, stale notice if stale) → 2 **evidence line** (reports · sources, first/last seen) → 3 **actions** (Acknowledge / Resolve) → 4 **Known / Not yet reported** → 5 Why ranked here → 6 Timeline | Evidence and actions come before the score breakdown because "how do we know" decides the action; the breakdown explains the order, not the action |
| **Share by QR** (`share`) | Let the other phone read the frames | QR as large as fits (screen width − 32 px, max 360), white card with a 4-module quiet zone, centred. Under it: "Frame i of n · Page p of P", Pause / Next frame, **Next page**. Below: **Scan their receipt**. One line at the top: "Let the other phone scan this. Keep it steady; turn brightness up." Optional "Scan their phone first" link above the QR | The QR is the whole screen's purpose; controls stay below it so a thumb never covers it |
| **Receive by QR** (`scan`) | Collect every frame | Small ID QR at the top: "Show this to the sharer first (optional)". Camera view. **Progress bar with "12 of 29 frames"**. On completion the camera is replaced by "Received N (M new)" and a **large receipt QR** with "Show this to the sharer" | Progress must be visible at a glance while both people hold their phones up |
| **My data** (`my-data`) | See what this phone holds and where own reports went | Existing list; each own observation gets the **status steps** (§3a) | — |
| **Dashboard** (`dashboard`) | Same as the station, for a responder with internet | Phone: identical to the board. ≥ 768 px: **two columns** — ranked list left, the selected incident's detail right. Category filter and "since last visit" above the list | Reuses the board and detail components, so the two can't drift |

### Incident card anatomy (board and dashboard)

```
FLOOD · Purok 4                                   60
4 reports · 3 sources · strongly corroborated
Last reported 3 min ago
Not yet acknowledged                     [NEW] [ESCALATED]
```

- Row 1: category and area at `size.h3`, score right-aligned at `size.h3` with tabular figures.
- Row 2: the evidence line at `size.body`, `text-primary`. The two numbers are always both shown (BR-012).
- Row 3: freshness at `size.caption`. Fresh = `text-secondary`. Aging = `text-secondary`. **Stale = `warning`, with a "STALE" badge and the words "Last known 3 h ago — may have changed"**.
- Row 4: status text, then change flags.
- Whole card is one touch target to the detail. No coloured left stripe (a recognised AI tell and colour-only meaning).

### 3a. Reporter status steps (report screen after saving, and My data)

A vertical list of four steps. Done steps: `text-primary` with ✓. Current step: bold. Future steps: `text-secondary`. Then, if true, "Grouped with reports from N other phones". Footer, always shown, in `text-secondary`: *"This shows only what this phone knows. It does not mean responders have seen it."* No green anywhere in it: none of these steps means help is coming.

## 4. Typography

- **One family:** the platform system face (`font.display` = `font.body`). Reasons in `tokens.json`: no downloaded font in an offline app, full Filipino coverage, tabular figures, iPhone users read it fastest. Hierarchy comes from size and weight only.
- **Scale:** `caption` 13 · `body` 16 · `h3` 20 · `h2` 26 (ratios 1.25 and 1.3). This replaces **ten** different sizes in the current screens (11–22).
- **Numbers** (counts, times, scores) use `tabularNums` so they line up down a list.
- Leave `allowFontScaling` on (the default). Layouts must survive iOS larger text sizes: rows wrap, nothing truncates a count.

## 5. Color — what each color means

| Meaning | Token | Always with this text |
|---|---|---|
| Primary action, link, "NEW" flag, "Acknowledged" | `accent` | the label |
| Escalated, errors | `danger` | "ESCALATED" / the error |
| **Uncertainty**: stale, limited or stale coverage, "not yet reported", "newly corroborated" | `warning` | "STALE", "Limited coverage", "Not yet reported", … |
| **Resolved**, explicit safe check-ins — **nothing else** | `success` | "Resolved", "N checked in safe" |
| High coverage | `accent` (not green) | "High coverage" |
| No reports from an expected area | `warning`, bold | "No reports — this does not mean it is safe" |

Rules: colour is never the only signal; green never means "fine" except for an explicit resolve or safe check-in; red never means "uncertain".

Contrast evidence (`tokens_export.py --check`, 2026-09-27): 0 errors, 0 warnings. Lowest text pair: `text-secondary` on `bg` 5.24:1; `warning` on `bg` 5.86:1; `border` on `bg` 3.35:1 (UI minimum 3:1).

## 6. Spacing, geometry, density

- Spacing: `space.1–7` on a 4 px grid (4, 8, 12, 16, 24, 32, 48). Page padding `space.4`; gap between cards `space.3`; inside a card `space.1`–`space.2`.
- Radius: 10 for controls and cards, 4 for badges — what the app already uses.
- Density: dashboard-data rules for board, detail and dashboard — dense, scannable, no decorative space. Report and QR screens get more room around the primary control.
- Touch targets: 44 pt minimum (`TOUCH_TARGET`).

## 7. Interaction character

- **Motion: none added.** The only moving thing is the QR frame cycle (a functional necessity) and the scan progress bar. Navigator transitions are the platform's own.
- **Light only this round.** Set `"userInterfaceStyle": "light"` in `app.json` (it's `automatic` today while every screen is light-only, so an iPhone in dark mode gets mismatched system UI). Set the navigation theme's background to `color.bg` explicitly. Dark mode is a later decision; a station in a dark evacuation hall is a real reason to add it.
- **Signature move:** the evidence line. "4 reports · 3 sources · last reported 3 min ago" on every incident is what a message feed can't show; it gets the typographic weight that other apps spend on hero graphics.

## 8. Forbidden list

- Green for coverage, sources or freshness. Red for uncertainty.
- Any status shown by colour alone, including coloured left stripes on cards.
- A disabled primary button with no visible reason.
- Words that overclaim: "received by responders", "help is on the way", "confirmed", "verified" (no verified state exists), "safe" for an area with no reports, "live".
- Emoji as icons. ✓ and ? as text glyphs are fine.
- A spinner alone for anything over a second: say what is loading.
- Raw developer text as a user-facing state (e.g. environment-variable names on the dashboard).
- Themed QR codes: modules are always `qr-dark` on `qr-light` with a quiet zone.

## 9. Deliberate choices

- allow: #f2f2f2 — page background kept from the existing screens, now set explicitly (delegated, 2026-09-27)
- allow: lone-font — one system family on purpose: offline, Filipino coverage, tabular figures (delegated, 2026-09-27)
- allow: #000000 @ QR components — QR modules are never themed (delegated, 2026-09-27)

## 10. Components

Named for reuse across board, detail and dashboard. Put them in `src/components/` (not `src/app/`, which is routes only).

| Component | Variants | States | Tokens | Notes |
|---|---|---|---|---|
| `Button` | primary, secondary, text-link, danger-secondary (Resolve) | default, pressed, focus (web), disabled (only when truly impossible, with the reason shown next to it), busy (keeps width, label "Saving…") | accent, accent-hover, surface-raised, text-on-accent, radius.control | ≥ 44 pt tall; `accessibilityRole="button"` |
| `Badge` | status, flag (new / escalated / newly corroborated / resolved), stale, coverage | — | per §5, radius.badge, size.caption bold | Text always present; `accessibilityLabel` spells it out |
| `IncidentCard` | open, acknowledged, resolved (faded 0.55), stale | pressed | surface, border-subtle, radius.card | One touch target; label reads the whole card |
| `EvidenceLine` | card, detail | — | text-primary, tabularNums | "N reports · M sources" is never split across components |
| `FreshnessText` | fresh, aging, stale | — | text-secondary / warning | Stale adds the badge and "may have changed" |
| `KnownUnknownList` | — | empty known ("Nothing related reported nearby yet") | text-primary, warning | ✓ for known, ? for unknown, with text |
| `TimelineRow` | report, acknowledge, resolve | — | caption, text-secondary | 6-char source label |
| `CoverageRow` | high, limited, stale, no reports | — | per §5 | Area · level · last report · phones |
| `StatusSteps` | 4 steps + optional grouped line | — | text-primary / text-secondary | Footer disclaimer always shown |
| `QrFrame` | bundle, receipt, id | cycling, paused | qr-dark, qr-light, surface | Size = min(width − 32, 360); quiet zone ≥ 4 modules |
| `ScanProgress` | — | idle, scanning, complete, wrong-bundle, error | accent, warning | Announces "12 of 29 frames" to VoiceOver at most every 2 s |
| `Notice` | info, warning, error | — | surface, warning, danger | Replaces raw error strings |

## 11. State matrix

| Screen | Empty | Loading | Error | Partial | Offline | No permission | First run |
|---|---|---|---|---|---|---|---|
| Report | n/a | locating (existing) | save failed → Notice + retry | no GPS → area text required (existing) | normal (it's the point) | location denied → area text required | n/a |
| Station board | "No incidents yet. Reports appear as phones pass them on." | n/a (local) | store read failed → Notice | some incidents stale → summary strip counts them | normal | n/a | PIN setup (existing); first "Mark as seen" explained (existing) |
| Incident detail | n/a | n/a | key no longer exists (evicted/regrouped) → "This incident changed. Back to the board." | no GPS members → area text instead of extent | normal | n/a | n/a |
| Coverage section | "No areas named yet" | n/a | n/a | "No area named" bucket | normal | n/a | expected-areas list empty → hint to add puroks (if built) |
| Share by QR | "Nothing to pass on yet" | preparing frames (< 1 s) | encode failed → Notice | last page shorter | normal | n/a | first time: one-line how-to |
| Receive by QR | n/a | scanning with progress | frame from another bundle → "That's a different code. Keep scanning this one." · unreadable → keep scanning silently | frames missing → progress shows which count | normal | **camera denied → Notice with how to allow it in Settings; nothing else works on this screen** | first time: how-to |
| My data | existing empty | n/a | n/a | n/a | normal | n/a | n/a |
| Dashboard | "Nothing uploaded yet." | "Loading uploaded reports…" | **not configured** → "The responder database isn't connected on this deployment yet." (developer detail in small secondary text) · unreachable → "Can't reach the database." + Retry | n/a | "You're offline. Connect to see uploaded reports." | n/a | first visit: no "since last visit" highlights (existing) |

## 12. Copy (English, Filipino draft)

Filipino strings are drafts matching the register already in `src/i18n` — **have a native speaker on the team review them before recording.**

| Key | English | Filipino (draft) |
|---|---|---|
| evidenceLine | {n} reports · {m} sources | {n} ulat · {m} pinagmulan |
| lastReported | Last reported {t} ago | Huling ulat: {t} na ang nakalipas |
| staleLine | Last known {t} ago — may have changed | Huling alam: {t} na ang nakalipas — maaaring nagbago na |
| staleBadge | STALE | LUMA NA |
| knownHeading | Reported nearby | Naiulat sa malapit |
| unknownHeading | Not yet reported nearby | Wala pang ulat sa malapit |
| unknownItem | {category}: no report yet | {category}: wala pang ulat |
| peopleUnknown | People affected: not reported | Bilang ng apektado: hindi naiulat |
| coverageHigh | High coverage | Mataas na saklaw |
| coverageLimited | Limited coverage | Limitadong saklaw |
| coverageStale | No recent reports | Walang bagong ulat |
| coverageNone | No reports — this does not mean it is safe | Walang ulat — hindi ibig sabihing ligtas |
| stepSaved | Saved on this phone | Nakatala sa teleponong ito |
| stepPassed | Passed to another phone | Naipasa sa ibang telepono |
| stepStation | Reached a station | Nakarating sa istasyon |
| stepUploaded | Uploaded from this phone | Na-upload mula sa teleponong ito |
| stepGrouped | Grouped with reports from {n} other phones | Kasama ng mga ulat mula sa {n} pang telepono |
| stepFooter | This shows only what this phone knows. It does not mean responders have seen it. | Ito lang ang alam ng teleponong ito. Hindi ibig sabihing nakita na ito ng mga responder. |
| chooseCategoryFirst | Choose what is happening first. | Piliin muna kung ano ang nangyayari. |
| shareTitle | Pass on by QR | Ipasa gamit ang QR |
| shareHint | Let the other phone scan this. Keep it steady and turn brightness up. | Ipa-scan sa kabilang telepono. Huwag galawin at lakasan ang liwanag ng screen. |
| frameCounter | Frame {i} of {n} · Page {p} of {P} | Frame {i} ng {n} · Pahina {p} ng {P} |
| nextPage | Next page | Susunod na pahina |
| scanReceipt | Scan their receipt | I-scan ang resibo nila |
| swapHint | To get their reports too, swap: they show, you scan. | Para makuha rin ang ulat nila, magpalit: sila ang magpapakita, ikaw ang mag-i-scan. |
| scanTitle | Receive by QR | Tumanggap gamit ang QR |
| showIdFirst | Show this to the sharer first (optional) | Ipakita muna ito sa magpapasa (opsyonal) |
| scanProgress | {k} of {n} frames | {k} sa {n} frame |
| scanDone | Received {N} ({M} new) | Natanggap ang {N} ({M} bago) |
| showReceipt | Show this receipt to the sharer | Ipakita ang resibong ito sa nagpasa |
| wrongBundle | That's a different code. Keep scanning this one. | Ibang code iyan. Ituloy ang pag-scan sa naunang code. |
| cameraDenied | PASAbi needs the camera to receive by QR. Allow it in Settings › Expo Go › Camera. | Kailangan ng PASAbi ang camera para makatanggap gamit ang QR. Payagan ito sa Settings › Expo Go › Camera. |
| dashNotConnected | The responder database isn't connected on this deployment yet. | Hindi pa nakakonekta ang database ng responder sa deployment na ito. |

## 13. Accessibility floor

- Contrast per §5 (checked). Input borders use `border` (3.35:1), never `border-subtle`.
- Every badge and status has an `accessibilityLabel` in full words ("Stale. Last known 3 hours ago; may have changed").
- `IncidentCard` reads as one element: "Flood, Purok 4. 4 reports from 3 sources, strongly corroborated. Last reported 3 minutes ago. Not yet acknowledged. Score 60."
- Touch targets ≥ 44 pt. Larger iOS text sizes must not clip counts or labels.
- Scan progress announced to VoiceOver, throttled.
- Nothing essential depends on animation; the QR cycle can be paused and stepped manually.

## 14. Checks

- `python <aegis>/scripts/slop_lint.py src --allow docs/design/DESIGN_BRIEF.md --tokens docs/design/tokens.json`
- `python <aegis>/scripts/tokens_export.py docs/design/tokens.json --check`
- Web build, served with clean URLs, then `render_check.py http://…/station --out .aegis/render-station` (and `/`, `/dashboard`, `/share`) and look at the 390 px screenshots.
- `.aegis/` is script output; keep it out of git.
