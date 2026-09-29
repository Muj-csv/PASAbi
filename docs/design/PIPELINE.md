# PASAbi — The Design Pipeline (repeatable)

This is the Veronica Locked Pipeline as it was run for PASAbi. It's written so the team can re-run any phase without the original chat and without the Veronica skill installed. With Veronica available, say "run Veronica Phase X for PASAbi" and point it at this folder.

**One rule under everything:** every colour, font, size, layout and word traces to a reason: a reference, a team decision, the PRD, or a sweep finding. If you can't say why, it doesn't go in. Anything marked ⚑ is a Veronica-proposed default; challenge it freely.

## Phase map and current status

| Phase | Decides | Output | Status |
|---|---|---|---|
| **A · Ingest & scope** | Product in one line, screen list, anchor screen | `00_SWEEP_AND_SCOPE.md` §5 | ✅ Done |
| **Sweep** | What's current, what's generic, what humans do | `00_SWEEP_AND_SCOPE.md` §3, `01_COLOR_SWEEP.md` | ✅ Done (Sep 2026) |
| **B · UX map** | Flows, screen tree, states, vocabulary | `UX_MAP.md` | ✅ Locked |
| **C · Design brief** | Personality, type, colour, spacing, geometry, motion, voice, forbidden list | `DESIGN_BRIEF.md` | ✅ Locked |
| **D · Anchor lock** | Prove the brief on one real screen, then correct the brief | Canvas "PASAbi Anchor v0" (v1) · `mockups/anchor.html` · brief §12–14 | ✅ Locked (S1 + S2) |
| **E · Screens** | Every other screen against the locked brief and anchor | `SCREENS.md` | ✅ Written |
| **F · Build → Council → revise** | Implementation quality, drift | `IMPLEMENTATION.md`, `DESIGN_COUNCIL.md` | 🔁 Repeat at milestones |

## How each phase runs (the same shape every time)

1. **State the decision.** Say what this phase needs to decide, in one or two lines.
2. **Check what's already answered** (PRD, earlier docs, team). Don't re-ask it.
3. **Ask 1–3 concrete questions,** each with real options *and* "not sure, you decide".
   - When someone picks "you decide", choose the most defensible option and mark it ⚑ with a one-line reason.
4. **Write the answer into the document now.** Don't batch several phases of answers.
5. **Lock** before the next phase. "Locked" means later phases can build on it, not that it's frozen.

## Phase F loop: use at every milestone

1. **Build** a screen, or a batch of screens, against `SCREENS.md` using `code/src/design/`.
2. **Run the guard:** `node scripts/check-design.mjs <src>`.
3. **Design Council pass** (`DESIGN_COUNCIL.md`), done by someone who didn't build it, or by a fresh Claude/Veronica session.
4. **The team picks** which findings to fix. Council never redesigns on its own.
5. **Fix,** then **log the change** in `DESIGN_BRIEF.md` §14 or in the `SCREENS.md` section, so the docs stay the source of truth.

**Milestones for this build:**
- end of Day 1: S1 + S2 built
- end of Day 2: resident flow built
- before recording the demo

## Adding a new screen later

1. Add it to `UX_MAP.md` §3 with: purpose, entry → exit, primary action, info order, states, and mobile behaviour.
2. Write its `SCREENS.md` section:
   - job
   - layout sketch
   - primary action
   - priority
   - EN/FIL copy
   - states
   - do-not list
3. Build it **from existing components only.** If it truly needs a new component, add it to `DESIGN_BRIEF.md` §12 first, with a reason.
4. Run the Council pass on it, **plus** a cross-screen check: same tokens, same scale, no private styles.

## Revisiting a locked phase

1. Name the document and the exact line that's wrong, not "it feels off".
2. Edit that line and add a dated entry to the document's change log (brief §14; UX_MAP and SCREENS in-place with a date).
3. List what was built against the old version (tokens → every screen; copy → `copy.ts`) and update it, including `theme.ts` / `copy.ts`.
4. Tell the team, so anyone who read the old version knows it moved.

**When the result doesn't land ("boring", "too corporate"):**

1. **Ask which dimension is off:** colour, type, layout, motion, or concept.
2. **Decide which layer missed:**
   - the execution (fix the screen)
   - the brief (re-lock the brief)
   - taste (update the taste notes)
3. **Never respond by going more generic.** Get a sharper reference instead.

The v0 → v1 colour pass is the worked example (brief §14).

## Trend refresh (keeps the forbidden list current)

**When:** before each new hackathon or major redesign, or if the sweep docs are more than 3 months old.

**Searches to run** (change the year):
- "AI UI design slop [year]"
- "AI generated color palette tells [year]"
- "emergency app UX [year]"
- one query on whatever `DESIGN_BRIEF.md` currently calls the "tasteful default"
- one query on the platform (e.g. "iOS [version] design guidelines")

**What to do with the results:**

| Finding | Action |
|---|---|
| A new instance of a known tell | Add it to brief §11 |
| A genuinely new kind of tell | Add it, and tell the team |
| A platform change | Update brief §2/§6 and `IMPLEMENTATION.md` |

Log every refresh with a date.

## Document map

```
docs/design/
  README.md               ← start here
  PIPELINE.md             ← this file: how to re-run
  PROMPTS.md              ← copy-paste prompts per phase
  00_SWEEP_AND_SCOPE.md   ← Phase A + first sweep + ChatGPT review
  01_COLOR_SWEEP.md       ← colour sweep (emergency apps, ISO 22324, PAGASA)
  UX_MAP.md               ← Phase B (locked)
  DESIGN_BRIEF.md         ← Phases C–D (locked) — the rules
  SCREENS.md              ← Phase E — every screen
  DESIGN_COUNCIL.md       ← Phase F rubric + log
  IMPLEMENTATION.md       ← wiring guide
  CLAUDE_DESIGN_RULES.md  ← paste into the repo's CLAUDE.md
  mockups/anchor.html     ← static render of S1, S2, R1
  code/                   ← tokens, copy, pictograms, components, adapters, guard script
```
