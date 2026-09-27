# AEGIS Council — 2026-09-27 — Relay-alignment screens

**Scope:** existing screens (report, station, my-data, dashboard, incident detail) as rendered in the web build, plus the planned R1–R5 screens in `DESIGN_BRIEF.md`.
**Depth:** Council-lite (Standard tier): one pass through all four seat checklists. **(self-reviewed)** — the same pass wrote the brief. New screens are **(plan only)**: nothing new is rendered yet.

**Evidence:** `tokens_export.py --check` (0 errors) · `slop_lint.py src --tokens` (0 strong, 20 weak: hard-coded colors) · `render_check.py` at 390/768/1440 on `/`, `/station`, `/dashboard`, `/my-data` with screenshots read · `contrast.py` on every existing color pair.

## Findings

| # | Seat | Sev | Finding | Evidence | Fix | Where it lands |
|---|---|---|---|---|---|---|
| 1 | Advocate | **P1** | The report button stays greyed out after a purok is typed, with no visible reason; the missing step (choose a category) isn't named. Hits the core ~15 s flow | `/` at 390 px; `index.tsx` disabled style | Submit always enabled; on tap, name what's missing inline and scroll to it (`chooseCategoryFirst`) | R1 UI task |
| 2 | Advocate | **P1** | Input borders `#c3cad2` are 1.65:1, under the 3:1 minimum for a field's edge; the station PIN field is nearly invisible on grey | `contrast.py`; `/station` screenshot | `color.border` (3.35:1) on every input | R1 UI task |
| 3 | Advocate | **P1** | Hint text `#8a6d1f` is 4.37:1 on the real page background `#f2f2f2` (render check FAIL) | `render_check.py` on `/station` | `color.warning` `#735a12` (5.86:1) | R1 UI task |
| 4 | Advocate | **P1** | The dashboard's not-configured state is raw developer text naming environment variables. It's what a judge sees if Supabase isn't connected on the Vercel URL | `/dashboard` at 390 px | Designed `Notice` (§11 `dashNotConnected`); developer detail in small secondary text | R1 UI task (and connect Supabase before submitting) |
| 5 | Architect | P2 | Colors and sizes are hard-coded per screen (17 colors, 10 font sizes); no shared theme. New screens would drift | `slop_lint.py` 20 weak; style inventory | `src/theme/tokens.ts` added; migrate each screen when a phase touches it — not a separate refactor | R1–R5, per screen touched |
| 6 | Advocate | P2 | Category buttons wrap to ragged widths | `/` at 390 px | Even 2-column grid; "We are safe" full width below | R1 UI task |
| 7 | Engineer | P2 | `app.json` is `userInterfaceStyle: automatic` while every screen is light-only; the background is React Navigation's default rather than a set value | `app.json`, `_layout.tsx` | `"light"`, and set the navigation theme background to `color.bg` | R1 UI task |
| 8 | Adversary | — | Load-bearing picks (`color.bg`, both fonts) are `delegated`, none `aegis-default`; accent is `team`. No HOLD from traceability | `--check` "Picked for you" | Lead confirms or changes them | Picked for you |
| 9 | Architect | — | New screens map to AERIAL's routes and component names (`share`, `scan`, `receiveObservations`, `IncidentCard` reused by board and dashboard); state matrix covers every new screen, including camera denied and wrong bundle | `DESIGN_BRIEF.md` §3, §10, §11 | — | — |
| 10 | Engineer | — | Buildable in the time: React Native StyleSheet plus one theme file; no new UI library beyond the QR pair already in R2 | — | — | — |

No P0: core flows have their states defined, primary text passes contrast, and the docs agree with the PRD and architecture.

## Gate

**HOLD (plan only, self-reviewed).** Four P1s, all in existing screens and all small. **Unblocked now:** every new screen (R1–R5, share, scan) can be built against `src/theme/tokens.ts` and the brief. **To clear:** fix findings 1–4 while R1 touches those screens, then re-render `/`, `/station` and `/dashboard` at 390 px.

## Picked for you (change any)

- Page background stays `#f2f2f2`, now set on purpose.
- One system font family (SF Pro on iPhone), no downloaded fonts.
- Direction "a field logbook, not a feed": plain, dense, calm; no animation added.
- Uncertainty is amber (`#735a12`), never red; green only for resolved and safe check-ins; high coverage is blue, not green.
- Light only this round.
- Filipino strings in the brief are drafts for a native speaker to check.

Checks: slop lint ✓ (0 strong, 20 weak drift) · tokens/contrast ✓ · render ✓ (existing screens, 3 widths; new screens not yet built) · Council: Council-lite, one pass (self-reviewed)
