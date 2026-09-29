# PASAbi — Design Council (Phase F)

A critique of **built** UI against a fixed rubric.

- Run it at each milestone (`PIPELINE.md`), by someone who didn't build the screens, or by a fresh session.
- It diagnoses; the team decides what to fix.
- Every problem names the principle it breaks, so the fix teaches something.

## The 12-point rubric

| # | Check | PASAbi-specific questions |
|---|---|---|
| 1 | Information hierarchy | Station: does the order follow what · where · phones · last heard · what's unknown? Resident: is the next action obvious? |
| 2 | Visual hierarchy | Is the most important thing the most dominant? Do rank numbers, the header clock or stamps out-shout the incident? |
| 3 | Alignment | Rank gutter 44, 16 margins, and the right column aligned across rows. |
| 4 | Spacing | Only 4 · 8 · 12 · 16 · 24 · 32 · 48? |
| 5 | Typography | Only the six styles in brief §3? Doto only on numbers and ≤ 3 words, and ≥ 20 pt? Caps only on stamps? |
| 6 | Density | Station rows answer the four questions without a tap? Resident screens ask one question each? |
| 7 | Component consistency | Only brief §12 components? Same stamp look everywhere? |
| 8 | Interaction clarity | One primary per screen? Coral only for doing, blue only for info and where you are? Undo after Resolve? |
| 9 | Accessibility | Text ≥ 4.5:1 (tokens are pre-checked)? Targets ≥ 44? Works at the largest Dynamic Type? Meaning never carried by colour alone? VoiceOver labels on icon-only controls? |
| 10 | Responsive | W1 at ≥ 1024 px two columns and < 1024 single column? No clipped text on small iPhones (375 pt wide)? |
| 11 | Forbidden list | Brief §11 clean? `check-design.mjs` clean? No warning hues on data? No ✓/✕ for known/unknown? |
| 12 | Still PASAbi? | Strip the logo and data: would this read as any other emergency or SaaS app? If yes, it isn't done. |

**Honesty checks.** These are PRD BR-015 and BR-017, and they are always blocking:

- ☐ No screen says or implies responders received anything.
- ☐ No stamp or status appears without evidence the phone holds.
- ☐ "No report" is never shown as safe or clear.
- ☐ The score is never a headline; it lives only in "Why {n}?".

## Output format (every pass)

```
Milestone: [name] · Date: [date] · Screens: [IDs] · Reviewer: [name/session]
5 strongest: 1–5, each tied to a rubric number and a concrete reason
10 problems, priority order: [#] [where] [what] → breaks [principle] → suggested direction
Unnecessary: …
Missing: …
Drift toward generic/AI-typical: …
Team decision: fix [#s] now · defer [#s] · reject [#s] (why)
```

Rules for the reviewer:
- **No redesign, no new features.**
- **No praise without a specific reason.**

## Log

### Pass 1: anchor v0 (2026-09-27), canvas S1 + S2

**5 strongest**

1. Rows answer what/where/phones/last-heard in order (#1).
2. Freshness reads without colour (#9).
3. Coral stays off data (#11).
4. The phones and reports block keeps the two numbers apart (#1, BR-012).
5. The caveat appears once per screen (#8).

**Problems**

1. Rank numerals out-shouted the category → breaks visual hierarchy.
2. The header clock was the largest element → breaks dominance of the primary content. ⚑ Kept, still open.
3. ✓ in "Nearby" read as "verified" → breaks honest language.
4. "No reports" was drawn fainter than "Few" → breaks salience of unknowns (G-6).
5. Phones had the same weight as reports → breaks emphasis on the trust number.
6. Ledger stamps were 11 pt → breaks the type minimum.
7. "Aging" sat on its own line → wordiness in the layout.
8. No undo on Resolve → breaks error recovery under stress.

**Team decision** (colour pass + lock)
- The team said v0 was "lacking colour, a bit boring" → colour pass v1.
- Fixed:
  - #1: numerals now ballpen, 20 pt
  - #3: ● instead of ✓
  - #4: bold chip, `?` dots
  - #5: phones semibold
  - #6: stamps 13 pt
  - #7: aging shown inline
  - #8: UndoBar
- #2 is still open ⚑. Decide after seeing it on a device.

### Pass 2: [after Day 1 build]

*(to fill)*
