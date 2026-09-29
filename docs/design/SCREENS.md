# PASAbi — Screens

Veronica · Locked Pipeline, Phase E · 2026-09-27
Built against: `DESIGN_BRIEF.md` (Locked), `UX_MAP.md` (Locked), and the anchor canvas v1 (S1, S2, R1 preview).
Reference renders: `mockups/anchor.html`.

## How to read a section

Each screen section has:

- **Job:** what the screen is for.
- **Layout:** top to bottom.
- **Primary action.**
- **Priority:** most important first.
- **Copy:** EN / FIL.
- **States.**
- **Do not.**

Other conventions:

- Component names match `DESIGN_BRIEF.md` §12 and `code/src/design/components/`.
- Every string also lives in `code/src/design/copy.ts`. The Filipino is a first draft ⚑ and needs a native pass before the demo.
- **Global rules, not repeated per screen:**
  - `StatusBand` is on top of every screen.
  - Side margin is 16.
  - Spacing only uses 4 · 8 · 12 · 16 · 24 · 32 · 48.
  - One primary button per screen.
  - The "no report" caveat appears at most once per screen.
  - No modals, except the Delete confirmation.

---

# Resident mode

## R1 — Home

**Job:** say what's on this phone, and put Report under the thumb.

**Layout**

```
┌ StatusBand (resident): ○ Offline · reports stay on this phone   EN · FIL ┐
│ PASAbi                                   (Doto 32, wordmark)             │
│ ┌ CountWidget ──────────────────────────────┐                            │
│ │ 12                              3 urgent  │                            │
│ │ reports on this phone                     │                            │
│ └───────────────────────────────────────────┘                            │
│ ┌ SlipCard: Your last report · 14:02 ───────┐                            │
│ │ Flood · Purok 4                           │                            │
│ │ [SAVED] [PASSED ON] ⌜At station⌟          │                            │
│ └───────────────────────────────────────────┘                            │
│                 (flex space: actions sit in the bottom half)             │
│ I'm safe  (quiet button)                                                  │
│ ┌ Pass on (ballpen) ┐ ┌ Receive (ink) ─┐                                  │
│ └───────────────────┘ └────────────────┘                                  │
│ ┌ Report (coral, 176 tall) ─────────────────┐                            │
│ │ [note icon]  Report                       │                            │
│ │              What's happening?            │                            │
│ └───────────────────────────────────────────┘                            │
```

**Primary action:** Report.

**Priority:** 1 Report · 2 Pass on / Receive · 3 last slip · 4 count.

**Copy**

| Key | EN | FIL |
|---|---|---|
| band.offline | Offline · reports stay on this phone | Offline · nasa phone na ito ang ulat |
| home.count | reports on this phone | ulat sa phone na ito |
| home.urgent | {n} urgent | {n} apurahan |
| home.last | Your last report | Huling ulat mo |
| action.report | Report | Mag-ulat |
| action.report.sub | What's happening? | Ano'ng nangyayari? |
| action.passOn | Pass on | Ipasa |
| action.receive | Receive | Tumanggap |
| action.safe | I'm safe | Ligtas ako |

**States**

- **First run** (0 carried, no reports): hide the SlipCard. The CountWidget reads "0 · Nothing on this phone yet".
- **Connected:** the band reads "● Online".
- **Rate limit** (BR-010): the Report block reads "6 reports this hour. Try again at {hh:mm}." and is disabled at 40% opacity with the text kept.

**Do not**

- Add a map, feed, weather, or any incidents list.
- Put Report at the top.
- Show evidence counts or a score.

---

## R2 — Report (4 steps, one question each)

The progress indicator is four Doto dots at top right, `● ● ○ ○`. Back is top left. **Save** stays pinned bottom on every step once a category is chosen, so steps 2–4 can be skipped.

### R2a — What's happening?

```
┌ StatusBand ┐
│ ‹ Back                         ●○○○ │
│ What's happening?   (Title 28)      │
│ ┌ Medical ┐ ┌ Trapped ┐            │  2-column grid of 8 category buttons,
│ ┌ Flood   ┐ ┌ Road blocked ┐       │  min 72 tall, r12, 1pt ink hairline,
│ ┌ Damage  ┐ ┌ Missing person ┐     │  pictogram 28 + label 17 semibold.
│ ┌ Water & food ┐ ┌ Shelter ┐       │  Tap = select (coral fill, black text) → auto-advance.
```

- Order: Medical, Trapped, Flood, Road blocked, Damage, Missing person, Water & food, Shelter. (Life first, then access, then needs.)
- "I'm safe" is **not** here. It lives on Home (R8).

### R2b — How many need help?

- Stepper: `−` [Doto 44 number] `+`. Each button is 56×56.
- Below it, a quiet button: "Not sure".
- Skip this step for Road blocked and Damage *(Flag, UX_MAP F1)*.

### R2c — What did you see?

- Text field, 140 characters max, with a live counter `0/140` in the caption.
- Placeholder: "e.g. Water above the road near the chapel"
- Optional. The primary button says "Next" (or "Save" if the location is already set).

### R2d — Where?

**GPS found:**

```
Where?
● Location found           (ink, with the accuracy hidden)
Landmark (optional) [ near Purok 4 chapel      ]
[ Save report ]  (primary, coral)
```

**No fix after 30 s:**
- Show "Location not found".
- The landmark field becomes required, labelled "Purok or landmark".
- Save stays disabled until there is text.

**Copy**

| Key | EN | FIL |
|---|---|---|
| report.q1 | What's happening? | Ano'ng nangyayari? |
| report.q2 | How many need help? | Ilan ang kailangan ng tulong? |
| report.notSure | Not sure | Hindi sigurado |
| report.q3 | What did you see? | Ano'ng nakita mo? |
| report.q3.ph | e.g. Water above the road near the chapel | hal. Tubig lampas daan malapit sa kapilya |
| report.q4 | Where? | Saan? |
| report.gps.ok | Location found | Nahanap ang lokasyon |
| report.gps.none | Location not found | Hindi mahanap ang lokasyon |
| report.landmark | Purok or landmark | Purok o palatandaan |
| report.save | Save report | I-save ang ulat |
| cat.* | Medical · Trapped · Flood · Road blocked · Damage · Missing person · Water & food · Shelter | Medikal · Na-trap · Baha · Sarado ang daan · Pinsala · Nawawala · Tubig at pagkain · Matutuluyan |

**Do not**

- Ask "How urgent?"
- Show GPS accuracy in metres.
- Show a success toast. The slip (R3) is the confirmation.

---

## R3 — Saved slip (signature moment)

**Job:** prove the report exists, and say honestly how far it has gone.

**Layout.** The page background is `coral` ⚑, the handoff colour; the slip itself is white.

```
┌ StatusBand ┐
│ (coral page)                                   │
│ ┌ SlipCard (white, r20) ────────────────────┐ │
│ │ Flood · Purok 4                   14:02   │ │
│ │ 2 people · "Water above the road…"        │ │
│ │                                            │ │
│ │  [SAVED]  ← stamp press + haptic on arrival│ │
│ │  ⌜Passed on⌟ ⌜At station⌟ ⌜Uploaded⌟       │ │   pending = dashed outline
│ └────────────────────────────────────────────┘ │
│ Saved on this phone only.        (Heading 20)  │
│ [ Pass it on ]  (primary: ink fill, white text on coral page) │
│ Done  (quiet)                                   │
```

- **Primary action:** Pass it on. On a coral page, the primary button is **ink-filled with white text**, because a coral button would vanish.
- **Grouped state:** when the incident has more than one source, add the line "Grouped with reports from {n} other phones."

**Copy**

| Key | EN | FIL |
|---|---|---|
| slip.status.saved | Saved on this phone only. | Naka-save lang sa phone na ito. |
| slip.status.passed | Passed to another phone. | Naipasa na sa ibang phone. |
| slip.status.station | Reached a station. | Umabot na sa istasyon. |
| slip.status.uploaded | Uploaded from this phone. | Na-upload mula sa phone na ito. |
| slip.grouped | Grouped with reports from {n} other phones. | Kasama ng ulat mula sa {n} pang phone. |
| stamp.* | SAVED · PASSED ON · AT STATION · UPLOADED | NAKA-SAVE · NAIPASA · NASA ISTASYON · NA-UPLOAD |
| action.passItOn | Pass it on | Ipasa |
| action.done | Done | Tapos |

**Do not**

- Say "sent", "submitted", "success", or "responders notified".
- Stamp anything the phone has no evidence for (BR-015).

---

## R4 — Pass on (share by QR)

**Job:** hand the reports to another phone. It should feel like passing a note.

**Layout.** The page is `coral` ⚑. The QR sits on a white card with a quiet zone of at least 16 pt. The screen stays awake.

```
┌ StatusBand ┐
│ ‹ Back                                       │
│ Pass on        (Title, ink on coral)         │
│ Hold this up to the other phone.  (Body)     │
│ ┌ white card ──────────────────────────────┐ │
│ │            [ QR, max width − 64 ]         │ │
│ │   Batch 1 of 2 · 60 reports              │ │   caption, ink-2
│ └──────────────────────────────────────────┘ │
│ [Pause] [Next batch]    (secondary, ink outline) │
│ ─────────────────────────────────────────────  │
│ [ Scan their receipt ]  (primary: ink fill)  │
│ Swap roles to get theirs.  (caption)          │
```

**States**

- **Nothing to pass** (0 reports): "Nothing on this phone to pass on." Hide the QR.
- **Receipt scanned:** show a full-width result.
  - Text: "Passed on 18" in Doto 44.
  - Stamps land on the affected slips: PASSED ON, or AT STATION if the receipt says station.
  - Button: Done.
- **Receipt unreadable:** "Can't read it. Tilt away from light." Nothing is stamped.
- **Camera denied:** "Camera is off for PASAbi." plus a [Open Settings] button.

**Copy**

| Key | EN | FIL |
|---|---|---|
| pass.title | Pass on | Ipasa |
| pass.hint | Hold this up to the other phone. | Itapat ito sa kabilang phone. |
| pass.batch | Batch {i} of {n} · {count} reports | Batch {i} ng {n} · {count} ulat |
| pass.pause / pass.next | Pause · Next batch | Ihinto · Susunod |
| pass.scanReceipt | Scan their receipt | I-scan ang resibo |
| pass.swap | Swap roles to get theirs. | Magpalit para makuha ang sa kanila. |
| pass.done | Passed on {n} | Naipasa {n} |
| pass.empty | Nothing on this phone to pass on. | Walang maipapasa mula sa phone na ito. |
| err.cantRead | Can't read it. Tilt away from light. | Hindi mabasa. Iiwas sa ilaw. |
| err.camera | Camera is off for PASAbi. | Naka-off ang camera para sa PASAbi. |

**Do not**

- Show "frame 7/14", protocol strings, or device IDs.
- Animate anything except the QR frame cycle.

---

## R5 — Receive (scan)

**Job:** take in another phone's reports.

**Layout.** A full-bleed camera with an `ink` scrim. The aim frame has 4 white corner brackets.

- Progress bar at the bottom: `ballpen` fill on a white track, 8 tall, r4, with the caption "Hold steady · 7 of 12".
- **Done:**
  - The screen turns white.
  - "Got 18" in Doto 44, "7 new" underneath.
  - A [Show receipt] primary button (coral).
  - The receipt QR on a white card, with the caption "Let them scan this."

**Copy**

| Key | EN | FIL |
|---|---|---|
| recv.aim | Point at their code. | Itapat sa code nila. |
| recv.progress | Hold steady · {i} of {n} | Huwag galawin · {i} ng {n} |
| recv.got | Got {n} | Natanggap {n} |
| recv.new | {m} new | {m} bago |
| recv.showReceipt | Show receipt | Ipakita ang resibo |
| recv.receiptHint | Let them scan this. | Ipa-scan ito sa kanila. |

**States:** can't read (rotating tips) · camera denied · partial (nothing applied until complete *(Flag)*).

**Do not:** show a percentage with decimals, or claim the reports are true.

---

## R6 — My reports

**Job:** see each of my slips and how far it went.

**Layout**

- A segmented control at the top: **Mine** | **Carrying**.
- **Mine:** SlipCards, newest first, each with its stamp row. Swipe left to reveal Delete.
- **Carrying:** read-only compact rows showing category · place · time. No stamps, because those belong to other phones' slips.

**Delete confirm** (the one modal) reads: "Delete from this phone? Copies already passed on stay." Buttons: [Delete] (ink) and [Keep] (quiet). Afterwards an UndoBar shows for 5 s.

**Copy**

| Key | EN | FIL |
|---|---|---|
| mine.tab / carrying.tab | Mine · Carrying | Akin · Dala ko |
| mine.empty | Nothing reported yet. | Wala ka pang ulat. |
| delete.q | Delete from this phone? | Burahin sa phone na ito? |
| delete.body | Copies already passed on stay. | Mananatili ang mga naipasa na. |

---

## R7 — Settings

- **Language:** EN / FIL segmented control.
- **What PASAbi saves:** a static list.
  - ✓ What you report · ✓ Location, if found · ✓ Time
  - — Not your name · — Not your number · — No account
  - Use en-dashes here, not ✕, which reads as an error.
- **Station mode:** a row leading to a PIN sheet with 4 digit boxes. A wrong PIN shows "Wrong PIN" inline; there is no lockout.

## R8 — I'm safe (check-in)

- Opens as a bottom sheet from Home, one step.
- The "Purok or landmark" field is required (BR-006).
- Primary button: "Check in".
- Result: a small slip with a SAVED stamp, closed with Done.
- Copy: "Tell the barangay you're safe." / "Ipaalam sa barangay na ligtas ka."

---

# Station mode

The station StatusBand is always `ballpen`. The TabBar is **Ledger · Pass on · Receive · Station**. Pass on and Receive reuse R4 and R5 with the ballpen band.

## S1 — Ledger (anchor, locked)

**Job:** what needs attention now, where, how we know, and how fresh it is.

**Layout:** see `mockups/anchor.html` (left phone) and the canvas board "S1 · Ledger".

```
┌ StatusBand (ballpen): Station · Brgy. Hall            ○ Offline · local data only ┐
│ Situation (Title)                                     14:32  (Doto 44) ⚑          │
│ 5 open · 1 resolved                            Last update here                  │
│ By priority                                          [Mark seen] (secondary)     │
│ ─────────────────────────────────────────────────────────────────────────────── │
│ 01  [pict] Trapped  Purok 4                                    ● 14:08            │
│     2 phones · 3 reports · 3 people                                               │
│ ─── (ballpen-tint row) ─────────────────────────────────────────────────────────  │
│ 02  [pict] Flood  Purok 4                                      ● 14:19            │
│     3 phones · 4 reports · 6 people                              +1 phone         │
│ …                                                                                 │
│ 05  [pict] Road blocked  Purok 1   (ink-3 row)                 ○ 10:05            │
│     1 phone · 1 report                                                   old      │
│     May have changed.                                                             │
│ —   [pict] Damage  Purok 2  (ink-3)                            ○ 11:48            │
│     2 phones · 2 reports                                                          │
│     [RESOLVED]            ← stamps sit in the content column, under the evidence  │
│                                                                                   │
│ Coverage (Heading)                                                                │
│ Last 3 hours. No report doesn't mean none.                                        │
│ Purok 5        ?        [No reports] (nodata chip, bold)                          │
│ Purok 1        ○○○      [Quiet since 10:05]                                       │
│ Purok 3        ●●○      Few phones                                                │
│ Purok 4        ●●●      Many phones                                               │
│ TabBar                                                                            │
```

**Primary action:** open an incident (tap a row). "Mark seen" is secondary.

**Priority**

1. Rows in rank order.
2. Change marks.
3. Freshness.
4. Coverage.
5. Header clock.

**Row order:** open incidents by engine score (BR-005). Resolved incidents always come last.

**Row layout rules** (from the render check):
- Keep the pictogram and category together on one line (no wrap between them). The place may wrap below.
- The right column holds only the freshness time (with the word "aging" or "old" on a caption line under it) and the change mark, with no wrapping.
- Stamps (ACK, RESOLVED) go in the content column, under the evidence line, so they don't squeeze the row.

**Copy**

| Key | EN | FIL |
|---|---|---|
| band.station | Station · {name} | Istasyon · {name} |
| band.offline.station | Offline · local data only | Offline · lokal na datos lang |
| band.online | Online · uploaded {hh:mm} | Online · na-upload {hh:mm} |
| ledger.title | Situation | Sitwasyon |
| ledger.counts | {open} open · {resolved} resolved | {open} bukas · {resolved} tapos na |
| ledger.lastUpdate | Last update here | Huling update dito |
| ledger.sort | By priority | Ayon sa priyoridad |
| ledger.markSeen | Mark seen | Nakita na |
| mark.* | New · +1 phone · More people · Reopened | Bago · +1 phone · Mas maraming tao · Binuksan muli |
| fresh.aging / fresh.old | aging · old | lumilipas · luma |
| old.note | May have changed. | Baka nagbago na. |
| evidence | {p} phones · {r} reports · {n} people | {p} phone · {r} ulat · {n} tao |
| cov.title | Coverage | Saklaw |
| cov.caveat | Last 3 hours. No report doesn't mean none. | Huling 3 oras. Walang ulat ≠ wala. |
| cov.* | Many phones · Few phones · Quiet since {hh:mm} · No reports | Maraming phone · Kaunting phone · Tahimik mula {hh:mm} · Walang ulat |

**States**

- **Empty:** "No reports yet." plus the caveat. The coverage list still shows the expected areas as No reports.
- **All old:** the header adds "Everything here is over 3 hours old."
- **Connected:** band text changes, and nothing else moves.

**Do not**

- Show the score number on rows.
- Add stat tiles, a map, a "What changed" section, or colour on categories.

---

## S2 — Incident (anchor, locked)

**Job:** show how we know this, how fresh it is, what we haven't heard, and let the operator act.

**Layout:** see `mockups/anchor.html` (middle phone) and the canvas board "S2".

1. ‹ Ledger (`ballpen` quiet) · "2nd of 5 open"
2. Header: pictogram 32 + category (Title) + place. Below it, the status line "Open · not acknowledged". When acknowledged, a large Stamp "ACKNOWLEDGED 14:33 · #ST1" appears **below the status line** (not floating over the title; it collided with the place name in the render check).
3. `EvidenceCounts` (3 phones | 4 reports) + "Counts phones, not people."
4. `FactList`: Last heard · First heard · Freshness · People · Spread
5. `WhyFirst` (collapsed)
6. `GapList`:
   - "Reported nearby": ● Trapped · 2 phones · 14:08
   - "Haven't heard about": ? Medical, ? Road blocked
   - One caveat.
7. `LogEntry` list "Log", oldest first. The station receipt row is "Received at this station · Carried by #K42".
8. Pinned action bar: [Acknowledge] primary coral · [Resolve] secondary ballpen.

**Behaviour**

- **Acknowledge:**
  1. Creates a STATUS observation (BR-007).
  2. The stamp presses in with a haptic.
  3. A log row is added in `coral-ink`.
  4. The button becomes a disabled "Acknowledged" on `surface`.
- **Resolve:** creates a STATUS, then shows the UndoBar "Resolved. Undo" for 5 s, then returns to the Ledger with the row faded and stamped RESOLVED.
- **Resolved incident:** there is no Reopen button, because only a new report reopens it (BR-007). The action bar is hidden, and the status line reads "Resolved {hh:mm}. A new report reopens it."

**Copy**

| Key | EN | FIL |
|---|---|---|
| inc.back | Ledger | Talaan |
| inc.rank | {ordinal} of {n} open | ika-{i} sa {n} bukas |
| inc.status | Open · not acknowledged / Open · acknowledged / Resolved {hh:mm} | Bukas · hindi pa natatanggap / Bukas · natanggap / Tapos na {hh:mm} |
| inc.phones / inc.reports | phones · reports | phone · ulat |
| inc.countsNote | Counts phones, not people. | Bilang ng phone, hindi ng tao. |
| fact.* | Last heard · First heard · Freshness · People · Spread | Huling ulat · Unang ulat · Kasariwaan · Tao · Lawak |
| fact.people | {n} in latest report | {n} sa huling ulat |
| why.title | Why {ordinal}? | Bakit ika-{i}? |
| why.caveat | Sorted by fixed rules. Not a danger rating. | Inayos ayon sa takdang patakaran. Hindi sukat ng panganib. |
| gap.nearby | Reported nearby | May ulat sa malapit |
| gap.unheard | Haven't heard about | Wala pang ulat tungkol sa |
| gap.caveat | No report doesn't mean none. | Walang ulat, hindi ibig sabihing wala. |
| log.title | Log | Talaan ng pangyayari |
| log.received | Received at this station | Natanggap sa istasyong ito |
| action.ack / action.resolve | Acknowledge · Resolve | Tanggapin · Tapusin |
| undo.resolved | Resolved. Undo | Tapos na. Ibalik |

**Do not**

- Use ✓/✕ for known/unknown.
- Use "verified" or "confirmed".
- Show the score as a headline.
- Give instructions such as "Send rescue".

---

## S3 — Coverage (only if R5 lands)

- Full list of CoverageRows, worst first.
- Tapping an area expands it to show the last report time and the categories heard in the last 3 h.
- [Add expected area] (secondary) opens a single text field.
- The caveat appears once at the top.

## S4 — Station

- `CountWidget`: "{n} reports held" plus a storage caption, e.g. "1,240 of 3,000".
- Fact rows: Last upload · Connection · Station name.
- [Upload now] is the primary button, disabled while offline with the caption "Needs internet."
- If the upload fails: "Not uploaded. Still on this phone." plus [Try again].
- [Leave station mode] is a quiet button at the bottom.

---

# Web dashboard

## W1 — Responder dashboard

- The same components as S1 and S2 via react-native-web. `StatusBand` reads "Responder view · last sync {hh:mm}".
- **≥ 1024 px:** two columns. The Ledger is 420 wide on the left. The Incident detail fills the right, and its action bar is hidden (responders read; stations act ⚑).
- **< 1024 px:** single column, as on the phone.
- A "Since last sync" line sits above the ledger: "3 new · 1 more phones · 1 resolved". It's rendered as ChangeMarks in text, not as stat tiles.
- The category filter is a row of text chips: `ink` outline, selected = `ink` fill with white text.

## W2 — /sim

Unchanged in behaviour. It gets the tokens and `StatusBand` "Simulation · proof of protocol, not radios".

---

# Global states (apply anywhere)

| State | Treatment |
|---|---|
| Offline | Band text only. Never a modal. |
| Storage limited | Band suffix "· storage almost full". Details in S4 / R6. |
| Old data | Ink fades plus the "May have changed." line. |
| Loading | Skeleton rows in `surface`, no shimmer animation. |
| Error | `ink` on `surface` block + pictogram + one sentence + one action. |
