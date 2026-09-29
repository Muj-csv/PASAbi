# PASAbi — Prompts (copy, paste, fill the brackets)

For Claude or Claude Code with this folder in the repo. Every prompt points at the locked documents so the model builds against decisions, not its defaults.

---

### 1. Implement a screen

```
Implement [screen ID, e.g. R3 Saved slip] for PASAbi.
Read docs/design/SCREENS.md (section [ID]), docs/design/DESIGN_BRIEF.md §4, §9, §11 and §12,
and use only components and tokens from src/design/. Strings come from src/design/copy.ts; add missing keys there in EN and FIL.
Map engine data through src/design/adapters.ts. Implement every state listed for the screen.
Do not add colours, sizes, components or copy that the docs don't list. If something is missing, stop and tell me what.
Run node scripts/check-design.mjs src when done.
```

### 2. Design Council pass (after a milestone)

```
Run a Design Council pass on [screens / files] using docs/design/DESIGN_COUNCIL.md.
Compare against docs/design/DESIGN_BRIEF.md (locked) and the anchor in docs/design/mockups/anchor.html.
Output exactly: the 5 strongest aspects, the 10 most important problems in priority order (each with the principle it breaks),
anything unnecessary, anything missing, and any drift toward generic or AI-typical patterns.
Don't redesign, don't propose features, and don't praise without a specific reason.
```

### 3. Add a new screen

```
Using Veronica's Locked Pipeline (docs/design/PIPELINE.md → "Adding a new screen"), add [screen] to PASAbi.
First add it to UX_MAP.md §3, then write its SCREENS.md section in the same format as the others
(job, layout sketch, primary action, priority, EN/FIL copy, states, do-not). Existing components only.
Ask me at most 3 questions, each with a "you decide" option.
```

### 4. Change a locked decision

```
I want to change [the exact line] in docs/design/[DESIGN_BRIEF|UX_MAP|SCREENS].md because [reason].
Follow PIPELINE.md → "Revisiting a locked phase": edit the line, add a dated change-log entry,
list and update everything built against the old value (theme.ts, copy.ts, screens), and summarise what moved.
```

### 5. "It doesn't look right"

```
[Screen] doesn't land: [what feels off, in one sentence].
Per PIPELINE.md, ask me which dimension (colour, type, layout, motion, concept) and which layer missed
(execution, brief, taste) before changing anything. Don't make it more generic; sharpen the reference.
```

### 6. Trend refresh

```
Run the trend refresh in docs/design/PIPELINE.md for [year/month].
Update DESIGN_BRIEF.md §11 (forbidden) with new instances, flag any new kind of tell separately,
and log the refresh with today's date.
```

### 7. Filipino copy pass

```
Review every FIL string in src/design/copy.ts against its EN key.
Goal: everyday spoken Filipino for resident strings and plain standard Filipino for station strings, within the word budgets in DESIGN_BRIEF.md §9.
Never introduce: verified, confirmed, safe (outside "I'm safe"), or any promise that responders received something.
Return a table: key · current · proposed · why.
```

### 8. New teammate onboarding

```
Summarise docs/design/ for a teammate who joins today: the concept in 3 lines, the 5 rules they must not break,
which screens are built, and what's next. Don't paste the documents.
```
