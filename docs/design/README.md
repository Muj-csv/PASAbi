# PASAbi — Design Package

**Logbook + stamp.** The station is a barangay logbook, strict and scannable. Each resident report is a *pasabi* slip that collects rubber stamps as it travels. The visual reference is Nothing OS, and the one warm colour is Living Coral. It was built with Veronica's Locked Pipeline against PRD v0.5.2 (2026-09-27).

## Start here

| If you are… | Read |
|---|---|
| Wiring the UI into the app | `IMPLEMENTATION.md` → `SCREENS.md` (your screen) → `code/` |
| Checking what it should look like | `mockups/anchor.html` (open it in a browser; needs internet for the Doto font) |
| Deciding or changing a design rule | `DESIGN_BRIEF.md` (locked), then `PIPELINE.md` → "Revisiting a locked phase" |
| Reviewing a built screen | `DESIGN_COUNCIL.md` |
| Re-running a phase or adding a screen | `PIPELINE.md` + `PROMPTS.md` |
| Using Claude Code in the repo | Paste `CLAUDE_DESIGN_RULES.md` into `CLAUDE.md` |

## The five rules nobody breaks

1. **Coral = something done** (Report, primary buttons, stamps). **Ballpen blue = information and station mode.** Data stays ink.
2. **No red, orange, yellow, green or purple on data.** Those colours are PAGASA's and ISO 22324's.
3. **Phones and reports are always two numbers.** Freshness is a glyph, a time and a word, never colour alone.
4. **A stamp or status appears only with evidence the phone holds.** Never say responders received anything.
5. **Sentence case and short.** Caveats come from `copy.ts` and appear once per screen.

## Status

- **Locked:** UX map, design brief, anchor (S1 Ledger + S2 Incident).
- **Screens:** all written.
- **Code kit:** typechecked; not yet run on a device.

**Open items:**
- Native Filipino pass on `copy.ts`.
- Header clock size (DESIGN_COUNCIL pass 1, #2).
- Adapter input types must be matched to `packages/core`.

**Live canvas:** "PASAbi Anchor v0" (claude.ai artifact, private to its owner until shared from its Share menu).
