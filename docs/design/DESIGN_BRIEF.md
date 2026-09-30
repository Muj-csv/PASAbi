# PASAbi — Design Brief

Veronica · Locked Pipeline, Phases C–D · 2026-09-27
**Status: Locked — anchor screen: S1 Ledger + S2 Incident (canvas v1, colour pass).** Locked because the team moved to integration. Change it only through `PIPELINE.md` → "Revisiting a locked phase".
Code form of this file: `code/src/design/theme.ts`. If the two disagree, this file wins; fix the code.

> PASAbi is an emergency information instrument, not a dashboard. Reduce load, show uncertainty, keep evidence, make the next action obvious.

## 0. Where each decision comes from

| Source | Decision |
|---|---|
| **Team (user)** | Concept: logbook + stamp. Reference: **Nothing OS**. Accent: **Living Coral**. Anchor: station ledger. |
| **PRD v0.5.2** | Honest language (BR-017). Freshness is separate from priority (BR-011). Reports and phones are two separate numbers (BR-012). |
| **Sweep** (`00_SWEEP_AND_SCOPE.md`) | No warning hues on data (PAGASA collision). Sentence case. Word budgets. |
| **Veronica-proposed** | Anything marked ⚑ is a proposed default. Challenge it freely. |

## 1. Personality

**Should feel like:** a Nothing widget that was issued by the barangay hall. Two phrases describe it:

- **Technical warmth**, Nothing's own phrase: mechanical type and a strict grid, with one warm hand-made gesture (the stamp).
- **Quiet data, lively moments**: rows stay strict; saving, passing on and receiving get the life.

**Should NOT feel like:**
- a government website
- a disaster movie
- a command-centre HUD
- a generic SaaS dashboard
- a Linear clone (dark, mono, dense)
- a Nothing clone (we borrow the discipline, not the brand)

## 2. Reference: what we take from Nothing OS, and what we don't

| Take | Don't take |
|---|---|
| Near-monochrome base: black, white and one warm grey | Nothing's red (#D71920). **Coral replaces it.** |
| Dot-matrix numerals for display. NDot comes from dot-matrix printers, and so does the paperwork in a barangay hall. | NDot or NType fonts themselves. They're Nothing's brand fonts, so we use an OFL analogue. |
| Simple, self-contained widget blocks on resident Home | Widget grids on the station. The station is a ledger. |
| Strict grid, fixed tracking, no decoration | The Glyph light metaphor, transparent hardware, brand phrasing |

## 3. Typography

| Role | Face | Size / line height (pt) | Use |
|---|---|---|---|
| Display | **Doto** (Google Fonts, OFL, dot-matrix, variable dot size and roundness) | 44/48 | Big counts, ledger rank numerals, stamp dates. Numbers and ≤ 3 words only. |
| Title | System (SF Pro), semibold | 28/34 | Screen titles |
| Heading | System, semibold | 20/25 | Row titles, section heads |
| Body | System, regular | 17/22 | All reading text. Supports Dynamic Type. |
| Caption | System, regular, `tabular-nums` | 13/18 | Times, counts, device codes |
| Stamp | System, heavy, uppercase, +8% tracking | 13/16 | Stamps only. **The only caps in the app.** |

Notes:
- The scale is 13 → 17 → 20 → 28 → 44, with steps of 1.18–1.57. The body→heading step is small on purpose so rows stay compact. Display is a big, deliberate jump.
- **No monospace face.** ⚑ Numbers use `fontVariant: ['tabular-nums']` on the system font. The "technical" feel comes from Doto plus the grid, which avoids mono-as-shorthand.
- Loading Doto: use `@expo-google-fonts/doto` if the package exists. Otherwise bundle the OFL TTF with `expo-font` `useFonts(require(...))`, which works in Expo Go. Doto is display-only and never used under 20 pt.

## 4. Colour

| Token | Light | Dark | Contrast | Use |
|---|---|---|---|---|
| `paper` | #FFFFFF | #0A0A0A | — | Page |
| `surface` | #F2F2F2 | #1A1A1A | — | Resident widget blocks, pinned bars |
| `ink` | #000000 | #F2F2F2 | 21 / 17.7 | Text; **fresh** evidence |
| `ink-2` | #4A4A4A | #A3A3A3 | 8.9 / 7.9 | Secondary text; **aging** evidence |
| `ink-3` | #767676 | #8A8A8A | 4.5 / 5.7 | **Old** evidence (AA floor, still legible) |
| `rule` | #DCD7D2 (Nothing N-Grey) | #2A2A2A | non-text | Ledger ruling, dividers |
| `coral` | #FF6F61 | #FF6F61 | fill + black text 7.7 | Primary button fill; stamp ink in dark mode |
| `coral-ink` | #C0453A | #FF6F61 | 5.1 on white | Stamp ink and borders in light mode |
| `ballpen` | #2343D1 | #8FA6FF | 7.5 white-on / on white · 8.6 on dark | Station mode band, links, margin marks, log times, PASSED ON stamp, Pass on block |
| `ballpen-tint` | #E4E9FF | #16204A ⚑ | black text 17.4 | Changed rows ("what changed"), evidence block |
| `nodata` | #DCD7D2 | #2A2A2A | black text 16+ | "No reports" chip (ISO 22324 grey = no information) |

Notes:
- **Coral source:** Pantone 16-1546 Living Coral, widely published as #FF6F61. Pantone's own values are paywalled, so check a physical swatch if print matters.
- `coral-ink` is the same hue darkened to pass AA on white. ⚑
- **Ballpen source:** the blue ballpoint that logbook entries are handwritten in. ISO 22324 also reserves blue for "informational", which is exactly its job here. ⚑

**Colour rules (v1, colour pass 2026-09-27)**
1. **Two inks with two meanings.**
   - **Coral = hands.** Coral means something you do or someone did: Report, primary buttons, stamps, ack/resolve.
   - **Ballpen blue = the logbook.** Blue means information and where you are: station mode, what changed, times in the log, links.
2. **Colour by mode.**
   - **Resident** is a coral world: the Report block is coral and Pass on is blue.
   - **Station** always shows the blue band, so nobody mistakes one mode for the other.
3. **Big fields, not specks.**
   - Coral and blue are used as whole blocks (resident Home actions, the station band, changed rows, the QR screen background), Nothing-widget style.
   - Text on coral is always black; white on coral fails contrast (2.7).
4. **Data severity stays ink.**
   - Freshness is ink weight (`ink` → `ink-2` → `ink-3`) plus a glyph (● ◐ ○) plus a time.
   - Categories are ink pictograms.
   - **Never used on data:** red, orange or yellow (PAGASA rainfall levels, ISO danger/caution), green (ISO = safe), purple or black-as-alarm (ISO = fatal danger).
5. **Stamp inks by stage.** SAVED black · PASSED ON ballpen · AT STATION coral-ink · UPLOADED solid coral. Acknowledge is coral-ink. Resolved fades to `ink-3`.
6. **Errors** are `ink` on `surface` with a pictogram. There is no "success" colour; stamps do that job.
7. **Theme:** follow the system appearance. Dark matters on OLED iPhones during an outage. ⚑ Light is the demo default because stations sit in lit halls.

## 5. Spacing and grid

- **Scale:** 4 · 8 · 12 · 16 · 24 · 32 · 48. No other values.
- **Phone grid:** 16 pt side margin and 4 columns.
- **Ledger row:** 44 pt rank gutter, then content. Minimum row height 64 pt, with a hairline `rule` between rows.
- **Touch targets:** at least 44 pt everywhere. Report category buttons are at least 72 pt tall.

## 6. Geometry

| Tier | Radius |
|---|---|
| Ledger rows, timeline | **0**. It's paper, not cards. |
| Buttons, inputs | 12 |
| Resident widget blocks | 20 (Nothing widget reference) ⚑ |
| Stamps | 4, 2 pt border, rotated −2° to −4° (deterministic from the report ID) |

- **One edge treatment per element:** either a hairline or a fill. Never a shadow.

## 7. Density

- **Station and web:** medium-high. Every row answers what, where, how many phones and last heard without a tap.
- **Resident:** low. One question per screen.

## 8. Motion and haptics

- **Stamp press** is the only expressive motion. The stamp starts at scale 1.25 and opacity 0, lands at 1 in 160 ms (ease-out), and triggers `Haptics.impactAsync(Medium)`. `expo-haptics` works in Expo Go.
- **Change mark:** fades in over 200 ms, once.
- **QR:** frames cycle. There is no other animation on that screen.
- **Reduce Motion on:** the stamp simply appears; the haptic stays.
- Everything else is none. No scroll effects, no hover growth, no pulsing "live" dots.

## 9. Voice (see sweep §3.1)

- **Word budgets:** button ≤ 3 words · title ≤ 4 · status ≤ 6 · one helper per screen ≤ 12 · the caveat once per screen in a fixed position.
- **Evidence is written as numbers:** `3 phones · 4 reports · 14:19`.
- **Time:** the station shows clock time first; residents see relative time.
- **Banned words:** successfully, please, just, oops, "!", verified, confirmed, safe (outside "I'm safe"), severity, danger.
- **Language:** resident strings use everyday spoken Filipino. Station strings use plain standard wording. All caveat strings are central constants.

## 10. Pictograms

- Nine categories (BR-001), drawn as one set: 2 pt stroke, round caps, a 24-unit grid, monochrome `ink`.
- They are drawn by us: no emoji and no stock icon library.
- Each pictogram always sits next to its text label.

## 11. Forbidden

**Structure and colour**
- Stat-banner rows
- Card grids on the station
- Coloured left or top borders
- Cards nested in cards
- Gradients, glow or glass on content. Native iOS chrome may use Liquid Glass.
- Emoji as icons
- ALL-CAPS labels (stamps are the exception)
- Colour-only status
- Green, amber, red or purple on data (PAGASA, ISO 22324)
- Coral on data
- A rainbow category palette
- Purple-to-cyan or neon-on-navy (the 2026 AI palette)
- A map as the hero
- Decorative sparklines or "Live" badges
- Cream or beige backgrounds
- A mono face used for flavour
- Nothing's own fonts or logo

**Language and behaviour**
- Modal alerts for connectivity
- "Success" when a report is only saved locally
- "Verified"
- "Safe" because nothing was reported
- Evacuation or medical instructions
- An urgency score shown as a headline number

## 12. Components (from the locked anchor, Phase D)

This is the whole kit. Build **no other components** without adding them here first. Code: `code/src/design/components/`.

| Component | Used on | Anatomy | Rules |
|---|---|---|---|
| `StatusBand` | Every screen, top | Mode label · connection dot + words | Station: `ballpen` fill, white text. Resident: `surface` fill, `ink` text. Hollow dot = offline, filled dot = connected. Always words, never just the dot. |
| `LedgerRow` | S1, W1 | Rank gutter 44 (Doto 20, `ballpen`; `ink-3` if old; "—" if resolved) · pictogram 22 + category (Heading) + place (Body, `ink-2`) · evidence line · right column (no wrap): `FreshnessMark`, change mark · stamps sit under the evidence line | Row radius 0, hairline below. Changed rows get the `ballpen-tint` background. Whole row ink follows freshness. Min height 64. |
| `EvidenceLine` | LedgerRow | `**3 phones** · 4 reports · 6 people` | Phones semibold, always first. People omitted when unknown. |
| `FreshnessMark` | LedgerRow, S2 | glyph + clock time, with the word (aging / old) on a caption line **under** the time | ● `14:19` · ◐ `13:10` / aging · ○ `10:05` / old. Old rows add one line to the content column: "May have changed." |
| `ChangeMark` | LedgerRow | `ballpen` text 13 bold: New · +1 phone · Reopened · More people | Clears on "Mark seen". Fade-in 200 ms once. |
| `Stamp` | Slip, ledger, S2, My reports | 2 pt border, radius 4, heavy caps 13, tracking +8%, rotation −4°…+3° seeded from the ID | Inks: `black` SAVED · `ballpen` PASSED ON · `coral-ink` AT STATION / ACK · `coral` solid UPLOADED · `ink-3` RESOLVED. Press animation + haptic only when newly earned. Pending stages show as dashed `rule` outline in sentence case ("At station"). |
| `EvidenceCounts` | S2 | Two cells on `ballpen-tint`: Doto 44 number + label (phones, reports) + caption "Counts phones, not people." | Never merged into one number. |
| `FactList` | S2 | 2-column grid: label (`ink-2`) · value | Last heard, First heard, Freshness, People, Spread. |
| `WhyFirst` | S2 | Disclosure button (`ballpen`) → rows label · points → Total → caveat | Collapsed by default. Caveat string is fixed: "Sorted by fixed rules. Not a danger rating." |
| `GapList` | S2, W1 | "Reported nearby" rows (● + category · phones · time) and "Haven't heard about" rows (? + category, `ink-2`) + one caveat | Never ✓ or ✕. Caveat once. |
| `LogEntry` | S2, R3 | Time margin 56 (`ballpen` bold) · what · detail (`ink-2`) | Operator actions are written in `coral-ink`. Oldest first. |
| `CoverageRow` | S1, S3, W1 | Area · dots (Doto 20: ●●● / ●●○ / ○○○ / ?) · label chip (no wrap) | "No reports" chip on `nodata` fill, bold. "Quiet since hh:mm" on `surface`. Worst first. |
| `Button` | Everywhere | `primary`: `coral` fill, black text 17 bold, h 52, r 12 · `secondary`: 2 pt `ballpen` outline + text · `quiet`: text only (`ballpen` in station, underlined `ink` in resident) | One primary per screen. On a coral page (R3, R4) the primary is `ink` fill with white text, because coral on coral vanishes. |
| `ActionBlock` | R1 | Radius 20 block, icon 28–36 + label | `coral` (Report, 176 tall, black text) · `ballpen` (Pass on, white) · `ink` (Receive, white). |
| `CountWidget` | R1, R4 | `surface` block r20: Doto 44 number + label + side note | "12 reports on this phone · 3 urgent". |
| `SlipCard` | R1, R3, R6 | Hairline r20: label + time · category · place · stamp row | Same stamp order everywhere. |
| `TabBar` | Station | 4 items: Ledger · Pass on · Receive · Station; icon 24 + label 11 | Active: `ink` + 16×4 coral bar. Native tab bar allowed (may use Liquid Glass). |
| `UndoBar` | S2 after Resolve, R6 after Delete | `ink` fill, white text, "Resolved. Undo" | 5 s, then commits. No modal confirm for Resolve. Delete keeps its confirm (irreversible on peers). |
| `NearbyRadar` *(added 2026-09-30, D-033)* | R4 Pass on, under the QR | White card r20: 3 `rule` rings, this phone as an `ink` dot at the centre, each phone in range as a `ballpen` dot on the middle ring, evenly spaced | Static: no sweep, no pulse (§8). Position carries no meaning: Multipeer gives no distance or direction, and the caption says so ("Shows who is in range, not how far."). Web build: dashed rings, no dots, and the line "Bluetooth needs the PASAbi app." |
| `NearbySection` *(added, D-033)* | R4 Pass on: above the QR with Ping as the primary where Bluetooth exists (native); under the QR, secondary, in the browser | "Nearby phones" heading · NearbyRadar · count line · **Ping nearby** (`secondary`, since the screen's primary stays "Scan their receipt") · result line | Result is "Passed on to N phones" only for phones that finished the exchange; failure is "Couldn't reach them. Try again." |
| `StartupAsk` *(added, D-033; replaces BluetoothAsk 2026-09-30)* | Every launch until on (web + native) | Bottom sheet: title · one line · Bluetooth row · Location row (label · status) · [Allow] primary · [Not now] quiet | Asks; never switches anything on. Bluetooth row in the browser reads "Needs the PASAbi app. QR works here." Allow asks iOS for Bluetooth (its prompt, or its own Turn On Bluetooth alert) and raises the location prompt. |
| `TransferLogSection` *(added 2026-10-01, P1)* | R7 Settings, S4 Station | Heading "Field test log" · one caption · "N of M transfers finished" · "Typical time: S s" · [Copy log] [Download] secondary small · [Clear log] quiet, two taps | Local only; never synced. A measuring tool, not a status: no colour, no success words. |
| `NearbyReceive` *(added, D-033)* | R5 Receive, above the camera | "Nearby phones" · radar card · "Waiting for nearby phones to ping." or "Got N by Bluetooth · M new · hh:mm" | No tap needed: while PASAbi is open, pings arrive on their own through the one ingest path. Browser: one line, "Bluetooth needs the PASAbi app. Scan their QR below." |

## 13. Explored and rejected

- **v0 monochrome** (coral only as specks) was rejected by the team as "lacking colour, a bit boring". Don't drift back towards it.
- **Word-pair device names** ("Mangga-Ilog") were rejected by Veronica: extra scope, and they could be read as identities.
- **ChatGPT's red/orange/green freshness**: collides with PAGASA and ISO 22324.
- **ChatGPT's all-caps labels** and **emoji category icons**.
- **A separate "What changed" section** duplicates rows; changes are marks on rows instead.

## 14. Change log

- **2026-09-30, Bluetooth pass-on (D-033).** The team asked for a Street View-style map of nearby phones.
  - Replaced by `NearbyRadar`: Street View needs internet, maps as hero are forbidden (§11), and Bluetooth gives no direction.
  - Added `NearbySection` and `BluetoothAsk` to §12.
- **2026-09-27, lock.** v1 locked as the anchor. Folded in the remaining critique fixes:
  - no ✓ in "Nearby" (it read as "verified")
  - phones semibold in the evidence line
  - aging shown inline with the time
  - `?` for no-report areas
  - Undo after Resolve

  Components section populated.
- **2026-09-27, colour pass** (Step 9, dimension: colour). The team said v0 was "lacking colour, a bit boring".
  - Diagnosis: execution was too timid; the concept wasn't wrong.
  - Fix: added ballpen blue as a second ink, mode colours, big colour fields, a changed-row tint, stamp inks by stage, and ISO 22324 grey for "no reports".
  - Coral-on-data ban kept. Rank numerals moved to ballpen at 20 pt. Ledger stamps raised to 13 pt.
- **2026-09-27, draft.** Q5 decided by Veronica: device labels stay as short codes (`#7A3`), not word pairs. ⚑
