# PASAbi — Implementation Guide (design → Expo front end)

For whoever wires the UI into the app. Read `DESIGN_BRIEF.md` §12 (components) and the screen you're building in `SCREENS.md` first.

## 0. What's in `code/`

| Path | What it is | Status |
|---|---|---|
| `src/design/theme.ts` | Tokens (colour, type, spacing, radius, motion, freshness, stamp inks) | Ready. Code form of DESIGN_BRIEF §3–8. |
| `src/design/copy.ts` | Every UI string, EN + FIL, plus the fixed caveats | Ready. Filipino needs a native pass ⚑. |
| `src/design/context.tsx` | `DesignProvider` / `useDesign()` for theme + language | Ready |
| `src/design/pictograms.tsx` | 9 category pictograms + UI icons (react-native-svg) | Ready |
| `src/design/components/*` | The kit from DESIGN_BRIEF §12 | Ready. Typechecked against stubs, **not yet run on a device**. |
| `src/design/adapters.ts` | Engine output → component props | **Adjust the input types** to `packages/core` |
| `src/screens/*.example.tsx` | S1 Ledger and R1 Home composed from the kit | Examples to copy from |
| `scripts/check-design.mjs` | Guard: banned words, raw hex, emoji, ALL-CAPS | Ready. Run in CI. |

**Honest limits.**
- This sandbox couldn't install React Native, so the kit was typechecked against minimal type stubs and its pure functions were smoke-tested in Node.
- The first run on an iPhone is where layout bugs will show. Budget an hour for it.
- The existing app's folder layout wasn't available, so paths below are suggestions.

## 1. Drop-in

1. Copy `code/src/design/` into the Expo app, e.g. `apps/mobile/src/design/`, next to your screens.
2. Copy `code/scripts/check-design.mjs` into the repo's `scripts/`.
3. Keep the tokens in `theme.ts` and the strings in `copy.ts`. If you already have an i18n file, **merge** these keys into it; don't run two string sources.

## 2. Dependencies (Expo SDK 57, works in Expo Go)

```bash
npx expo install react-native-svg expo-haptics expo-font
# Display font: try the package first…
npx expo install @expo-google-fonts/doto
# …if it doesn't exist, download Doto from https://fonts.google.com/specimen/Doto (OFL),
# put the ExtraBold and Black static TTFs in assets/fonts/ and load them with expo-font.
```

Load the fonts at the root, keeping the family names that `theme.ts` expects:

```tsx
import { useFonts } from 'expo-font';
// Package route:
import { Doto_800ExtraBold, Doto_900Black } from '@expo-google-fonts/doto';
const [ready] = useFonts({ Doto_800ExtraBold, Doto_900Black });
// TTF route:
// const [ready] = useFonts({
//   Doto_800ExtraBold: require('./assets/fonts/Doto-ExtraBold.ttf'),
//   Doto_900Black: require('./assets/fonts/Doto-Black.ttf'),
// });
```

Until `ready` is true, render the system font. Don't block the app: Doto is decoration on numbers, not content.

## 3. App root

```tsx
<DesignProvider lang={lang} force="light">   {/* 'light' for the demo; remove to follow the system */}
  <Navigation />
</DesignProvider>
```

- **Resident vs station:** station mode must render `StatusBand mode="station"` on every screen. That band is how people tell the two modes apart.
- **Station tabs:** Ledger · Pass on · Receive · Station. Use your router's native tabs (expo-router `Tabs` or `NativeTabs`). Draw icons with `Icon` from `pictograms.tsx`. Mark the active tab with the 16×4 coral bar, or let native tabs use `tintColor = c.ink`.
- **Liquid Glass** (`expo-glass-effect`) is optional and only for native chrome such as the tab bar. Guard it with `isGlassEffectAPIAvailable()`. **Never put glass on content.**

## 4. Where engine data goes

| UI | Engine / PRD field | Adapter |
|---|---|---|
| LedgerRow rank | order of open incidents from the engine | `toLedgerRows` |
| LedgerRow phones / reports | Evidence `sourceCount` / `reportCount` (BR-012) | `toLedgerRows` |
| LedgerRow people | Incident `peopleAffected` (omit when null) | `toLedgerRows` |
| FreshnessMark | Evidence `freshness`, `lastSeen` (BR-011) | `toLedgerRows`, `clock` |
| ChangeMark | FR-007 "what changed" since Mark seen | `changes` map → `MARK` |
| ACK / RESOLVED stamps | Incident `status` + STATUS observation time (BR-007) | `toLedgerRows(…, ackTimes)` |
| WhyFirst | Incident `score` + `breakdown` (BR-005) | `whyLines`. **Map your breakdown keys.** |
| GapList | Gaps `known[]` / `unknown[]` (BR-013) | Direct |
| CoverageRow | Coverage `{area, lastObservationAt, distinctDevices, level}` (BR-014) | `toCoverageRows` |
| Slip stamps | Own obs local flags `passed_on`, `reached_station`, `uploaded` (BR-015/016) | `slipStamps`, `slipStatus` |
| LogEntry | Evidence `timeline[]`, source label = short device ID `#7A3` | Your mapping |

Rules the adapters already follow:

- **Never compute display values inside components.** Components take plain strings and numbers.
- **Freshness names:** the engine says `stale`; the UI says "old". This is intentional.
- **Stamps come only from flags that are true.** `justEarned` (animation + haptic) fires only when a flag flips from false to true between renders. Pass the previous flags in.

## 5. Build order (fits the Sept 30 target)

Screens are ordered so that each lands on top of the PRD phase that feeds it.

| When | Screens | Needs PRD phase |
|---|---|---|
| **Day 1** | Tokens + provider + fonts · `StatusBand` · **S1 Ledger** · **S2 Incident** (counts, facts, log, why, ack/resolve) | R1 evidence |
| **Day 2** | **R1 Home** · R2 Report restyle (steps, category grid, stepper) · **R3 Saved slip + stamps** · R4/R5 QR screens restyled (coral Pass on page, receive progress) | R2 QR, R3 propagation |
| **Day 3** | GapList (R4) · Coverage rows on S1 (R5) · R6 My reports · R7/R8 · W1 web two-column · **Design Council pass** · Filipino native pass | R4, R5 |

**If time runs out, cut in this order:**
1. S3 Coverage screen
2. W1 two-column layout (a single column works)
3. Dark mode
4. Change-mark fade
5. Stamp animation (keep the haptic)

**Never cut:**
- honest stamps and status copy
- the two numbers (phones · reports)
- the caveats
- the station blue band

## 6. Guardrails while coding

- Run `node scripts/check-design.mjs apps/mobile/src` before every demo build, and in CI.
- **No new colours, sizes or components.** Need one? Add it to `DESIGN_BRIEF.md` first (see `PIPELINE.md` → Revisiting), then to `theme.ts`.
- **Don't set `allowFontScaling={false}`.** Dynamic Type must work. If a row breaks at large text, let it wrap; don't shrink the text.
- **Touch targets:** at least 44 pt everywhere, 72 for report categories, 52 for primary buttons.
- **The demo runs in Expo Go:** load online, switch to airplane mode, never reload (PRD D-024). Test every screen in airplane mode.

## 7. Done means

- ☐ Every in-scope screen in `SCREENS.md` is built, including its states.
- ☐ `check-design.mjs` is clean.
- ☐ Design Council pass (`DESIGN_COUNCIL.md`) is run on the built app, and the fixes are logged.
- ☐ A native speaker has passed the Filipino strings.
- ☐ Screens are tested at the largest Dynamic Type size and in airplane mode.
