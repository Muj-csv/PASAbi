# Paste this block into the repo's CLAUDE.md

```markdown
## UI / design rules (PASAbi)

The UI is specified in docs/design/. These documents are locked decisions, not suggestions.

- Before touching any screen, read its section in docs/design/SCREENS.md and DESIGN_BRIEF.md §11–12.
- Use only src/design/ (theme.ts tokens, copy.ts strings, components, pictograms). Never hard-code a colour, font size, spacing value or UI string.
- Colours: coral = something done (Report, primary buttons, stamps). Ballpen blue = information and station mode. Data (freshness, categories) is ink only. Never use red/orange/yellow/green/purple on data.
- Copy: sentence case, within the word budgets (button ≤ 3 words, status ≤ 6). Never write: successfully, please, oops, verified, confirmed, "safe" for areas, or anything saying responders received a report (BR-017).
- Show phones and reports as two numbers. Freshness = glyph + time + word, never colour alone. Stamps only from real evidence flags (BR-015).
- One primary button per screen. No modals except the Delete confirmation. No emoji. No ALL-CAPS except stamps.
- Missing a component, token or string? Stop and say so; propose the addition to DESIGN_BRIEF.md first (docs/design/PIPELINE.md → "Revisiting a locked phase").
- Run `node scripts/check-design.mjs <src>` after UI changes.
```
