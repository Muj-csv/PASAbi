# PASAbi — UX Map

Veronica · Locked Pipeline, Phase B · 2026-09-27 · against PRD v0.5.2
Status: **Locked for this build (2026-09-27).** Flows were drafted from the PRD because the team answered "not sure"; items marked *(Flag)* are still Veronica proposals and can be changed through `PIPELINE.md` → "Revisiting a locked phase".
No visual decisions live in this file; they belong in `DESIGN_BRIEF.md`.

---

## 1. Who does what

| Mode | Who | One job |
|---|---|---|
| **Resident** (default) | Residents, volunteers, tanods, BHWs, SK | Save what I saw. Pass it on. |
| **Station** (PIN) | BDRRMC operator, barangay secretary | See what needs attention, how we know, and what we don't know. |
| **Web dashboard** | MDRRMO / LGU responders | The same picture as the station, once any phone has uploaded. |

Carrier is not its own mode. It's the Pass on and Receive actions inside Resident and Station.

## 2. Flows

### F1 — Report (FR-001; target ≤ 20 s one-handed, NFR-006)

1. **Home → Report.**
2. **What's happening?** Pick one of 8 categories.
   - "I'm safe" (SAFE_CHECKIN) is a separate, smaller entry on Home.
3. **How many need help?** A − n + stepper plus a "Not sure" option, which saves as no count.
   - Skipped for ROAD_BLOCKED and STRUCTURAL.
   - *(Flag: the PRD allows people on every category. The skip is a UX proposal.)*
4. **What did you see?** Optional, up to 140 characters, with a placeholder example.
5. **Where?**
   - GPS runs in the background from step 1.
   - If there's a fix: "Location found" plus an optional landmark field.
   - If there's no fix after 30 s: purok or landmark becomes required.
6. **Save** → F1-S, the Saved slip.

**Failure states:** rate limit reached (BR-010), no GPS and empty landmark, storage full (BR-008 evicts silently; tell the user only if their own report is at risk).

**Exit:** after the slip, the user taps Pass on (goes to F2) or Done (goes Home).

### F1-S — Saved slip (FR-015, BR-015)

- Shows the report (category, place, time) and the stamp row.
- The first stamp is always **SAVED**.
- Later stamps appear only from evidence the phone holds, in order: PASSED ON, AT STATION, UPLOADED.
- If the incident has more than one source, add "Grouped with reports from N other phones".

### F2 — Pass on (share, FR-013)

1. **Home → Pass on.** The screen shows "You're carrying N reports" and "Hold this up to the other phone."
2. The QR frames cycle.
   - Controls: pause, manual frame step, and **Next batch** (the next PRD page of up to 60).
   - Optional first step: scan the receiver's ID frame so the batch skips what that phone already has.
3. **Scan their receipt** turns the camera on and reads the one-frame receipt.
4. Result: "Passed on N". PASSED ON stamps are applied, or AT STATION if the receipt role is station. Station receipts are trusted, not verified (BR-015).

**Failure states:**
- Receipt not scanned: status stays as it was and is not upgraded.
- User leaves mid-way: nothing is lost.
- Camera permission denied: explain once, then link to Settings.

**Two-way exchange** is stated on screen as "Swap roles to get theirs."

### F3 — Receive (scan, FR-013)

1. **Home → Receive.** The camera opens with the prompt "Point at their code."
2. A progress bar shows "Hold steady · 7 of 12". Frames can arrive in any order.
3. Done: "Got 18 · 7 new."
4. **Show receipt:** one QR frame for the sender to scan.

**Failure states:**
- Can't read: show one rotating tip.
- Partial batch: nothing is applied until the batch is complete. *(Flag: confirm this matches the engine.)*
- Camera denied.

### F4 — Station entry

- **Settings → Station mode → PIN.**
- Wrong PIN: "Wrong PIN" with no lockout. The PIN only hides a UI mode (PRD §14).
- Exit through Station → Leave station mode.

### F5 — Read the situation (station; FR-006, FR-007, FR-017)

1. **Ledger.** Incidents in priority order, a margin mark on anything that changed since "Mark seen", and the coverage strip.
2. **Tap a row → Incident detail.**
3. The operator can **Acknowledge** or **Resolve**. This creates a STATUS observation.
   - The stamp appears on the incident.
   - A newer report reopens a resolved incident (BR-007), shown as a "Reopened" margin mark.

### F6 — Upload (FR-009)

- **Station → Upload now.**
- Offline: the button is disabled and the strip says "Offline · local data only".
- Upload fails: "Not uploaded. Still on this phone." with a Retry button.
- Success: "Uploaded 14:32". UPLOADED stamps are applied to this phone's own reports.

### F7 — My reports / My data (FR-011)

- Your own slips, newest first, each with its stamps.
- Delete sits behind a swipe or long-press and asks for confirmation. The confirmation says: "Deletes from this phone only. Copies already passed on stay."
- A second tab shows everything the phone carries. It's read-only.

## 3. Screen tree

| ID | Screen | Entry → exit | Primary / secondary | Info order (most important first) | States | Mobile behaviour |
|---|---|---|---|---|---|---|
| R1 | Home | Launch → R2, R4, R5, R6, R7 | **Report** / Pass on, Receive, I'm safe, My reports | 1 connection strip · 2 "Carrying N" · 3 actions in the thumb zone | first run (carrying 0), offline (normal state) | Actions stay in the bottom half |
| R2 | Report (4 steps) | R1 → R3 | **Save** / Back, Not sure | One question per step | no GPS, rate limit, storage | Full-screen steps; keyboard only on step 3 |
| R3 | Saved slip | R2, R6 → R4, R1 | **Pass it on** / Done | 1 stamp row · 2 what/where/when | only SAVED (normal) | — |
| R4 | Pass on | R1, R3 → R1 | **Scan their receipt** / Pause, Next batch | 1 QR · 2 "Hold up" instruction · 3 carrying count | nothing to pass, receipt fail | QR at maximum width; screen stays awake |
| R5 | Receive | R1 → R1 | **Show receipt** / Cancel | 1 camera · 2 progress | can't read, camera denied, done | — |
| R6 | My reports | R1 → R3 | Open slip / Delete | Newest first | empty ("Nothing reported yet") | — |
| R7 | Settings | R1 → F4 | Language / What PASAbi saves, Station mode | — | — | — |
| S1 | **Ledger (anchor)** | Station entry → S2, S3, S4, R4, R5 | Open incident / Mark seen, Pass on, Receive | 1 connection strip · 2 ranked incidents (what, where, phones, last heard) · 3 change marks · 4 coverage strip · 5 "No report ≠ none" caveat | empty, all stale, offline, connected | Single column; coverage strip scrolls sideways |
| S2 | Incident detail | S1 → S1 | **Acknowledge / Resolve** / Why first? | 1 what + where · 2 phones vs reports · 3 first and last heard + freshness · 4 people · 5 haven't heard about · 6 timeline | stale, resolved, reopened, single report | Long scroll; action bar pinned at the bottom |
| S3 | Coverage | S1 → S1 | Add expected area | Areas by level: none → stale → limited → high | — | *Only if R5 lands* |
| S4 | Station | S1 → S1 | **Upload now** / Leave station | Storage, last upload, connection | offline, failed | — |
| W1 | Web dashboard | URL | Filter category | Same as S1, plus a "Since last sync" header | no data yet | Two columns ≥ 1024 px: ledger and detail |
| W2 | /sim | URL | — | Unchanged | — | — |

## 4. Status vocabulary (fixed; BR-015, BR-017)

| Concept | EN | FIL |
|---|---|---|
| Propagation stamps | SAVED · PASSED ON · AT STATION · UPLOADED | NAKA-SAVE · NAIPASA · NASA ISTASYON · NA-UPLOAD |
| Freshness | Fresh · Aging · Old | Bago · Lumilipas · Luma |
| Coverage | Many phones · Few phones · Quiet since hh:mm · No reports | Maraming phone · Kaunting phone · Tahimik mula hh:mm · Walang ulat |
| Incident status | Open · Acknowledged · Resolved · Reopened | Bukas · Natanggap · Tapos na · Binuksan muli |

**Never used anywhere:** verified, confirmed, safe, success, severity, danger level.

The Filipino wording is a first draft and needs a native pass by the team.
