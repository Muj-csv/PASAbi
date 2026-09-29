// PASAbi theme — "logbook + stamp" (docs/design/DESIGN_BRIEF.md, the
// downloaded package under docs/design/ locked 2026-09-27, Veronica pipeline).
// This supersedes the earlier blue-accent brief; that file is kept for
// history but this is the source of truth for src/.
//
// 2026-09-29 nudge: ink, ink2, coral and coralInk were adjusted toward a
// higher-contrast reference (near-black ink instead of pure black, a
// bluer-grey secondary text, a genuine red action colour instead of salmon)
// on explicit product direction — action/emergency colour, never data.
// `paper` and `surface` were deliberately left untouched: `ink3` is
// hand-calibrated to sit exactly at the 4.5:1 AA floor against `paper`
// (#767676 on #ffffff = 4.54:1), and any off-white page background drops it
// below that floor. See LEARNING.md, "Reference-image nudge" entry.
//
// 2026-09-29, second nudge: a full visual reskin toward a card-based
// "dashboard" reference (dark navy headers, rounded white cards on a light
// blue-grey canvas, red = emergency action, blue = information). This is a
// presentation-layer change only — see LEARNING.md. `pageBg` is new (the
// canvas behind cards); `paper` stays pure white on purpose, still the only
// surface `ink3` is calibrated against, so anything reading `ink3` must sit
// on a card, never directly on `pageBg`.
//
// 2026-09-29, third nudge: the reference names an exact palette (#111827 /
// #687280 / #F8FAFC / #FFFFFF / #DC2626 / #2563EB). `ink`, `pageBg` and
// `paper` already matched exactly; the other three did NOT move to their
// exact spec hexes, each for a real (not edge-case) contrast failure found
// by checking every background the token is actually used against, not just
// `paper`: `#687280` drops to 4.04:1 on `ballpenTint` (the tint every
// changed incident row carries) and 4.36:1 on `surface`; `#DC2626` with
// black text is 4.35:1 (the Report / Save / Acknowledge buttons); `#2563EB`
// on `ballpenTint` is 4.28:1 (the "new"/"more reports" change-flag caption,
// again on every flagged row). All three are already near-identical hues to
// the spec and AA-checked at their current values — "approximately this
// palette" was taken literally rather than re-breaking a contrast pair
// already fixed once before.
//
// Rules:
// - Components use these values, never a raw hex or a one-off size.
// - Coral = something done (Report, primary buttons, stamps). Ballpen blue =
//   information and station mode. Data (freshness, categories) is ink only.
// - Never red, orange, yellow, green or purple on data (PAGASA / ISO 22324
//   collide with those hues). Resolved fades to ink-3, not green. This is
//   why incident severity/priority is never colour-coded even though the
//   2026-09-29 reference image colour-codes it — see LEARNING.md.

import type { TextStyle } from "react-native";

export const color = {
  /** The canvas behind cards — never a text surface (see file header). */
  pageBg: "#f8fafc",
  /** Card / surface white. Page background before the reskin; still the
   *  only surface `ink3` is calibrated against. */
  paper: "#ffffff",
  /** Blocks, panels, pinned bars. */
  surface: "#f2f2f2",
  /** Primary text; fresh evidence. Near-black, not pure black (17:1 on paper). */
  ink: "#111827",
  /** Secondary text; aging evidence. Cooler grey (5.98:1 on paper). */
  ink2: "#5b6472",
  /** Tertiary text; old/stale evidence (AA floor: 4.54:1 on paper — do not
   *  change without also changing `paper`, see file header). */
  ink3: "#767676",
  /** Ledger ruling, dividers, hairlines. */
  rule: "#dcd7d2",
  /** Primary action fill: Report, primary buttons, stamps. A genuine red,
   *  not salmon (black text on it: 4.71:1). */
  coral: "#dc3b2e",
  /** Stamp ink / borders on white (AA-safe darkening of coral: 4.87:1 on
   *  paper; black onCoral text on it: 4.31:1, matching the old pair's ratio). */
  coralInk: "#d1382c",
  /** The one flag that's genuinely bad news ("escalated"), never data.
   *  Darker than `coralInk` so it stays AA on `ballpenTint` too (4.83:1),
   *  since a flagged row always carries that tint (5.84:1 on plain paper). */
  danger: "#bb3227",
  /** Information, station mode, links, log times. */
  ballpen: "#2343d1",
  /** Pressed state for a ballpen-filled control (the `info` button variant). */
  ballpenPressed: "#1c37ab",
  /** Changed-row background, evidence block fill. */
  ballpenTint: "#e4e9ff",
  /** "No reports" chip (ISO 22324 grey = no information). */
  nodata: "#dcd7d2",
  /** Text on a ballpen or ink fill. */
  onFill: "#ffffff",
  /** Text on a coral fill. Always black: white on coral fails contrast. */
  onCoral: "#000000",
  /** QR modules are never themed. */
  qrDark: "#000000",
  qrLight: "#ffffff",
} as const;

/** Spacing scale (pt). No other values. Numeric keys read as space[n]. */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48 } as const;

export const radius = {
  /** Ledger rows, timeline, inside a card. Zero on purpose: dividers between
   *  rows of the same card, not a card edge. */
  row: 0,
  /** Stamps (2 pt border). */
  stamp: 4,
  /** Buttons, inputs. */
  control: 12,
  /** Resident widget blocks. */
  block: 20,
  /** Cards: incidents, reports, panels — the reskin's basic unit. */
  card: 16,
  /** Status chips / badges. */
  pill: 999,
} as const;

/**
 * A white/paper card on `pageBg`: subtle border, soft shadow. Same recipe
 * everywhere so cards never drift (iOS/web read the shadow* props, Android
 * reads `elevation`).
 */
export const cardShadow = {
  backgroundColor: color.paper,
  borderRadius: radius.card,
  borderWidth: 1,
  borderColor: color.rule,
  shadowColor: "#0f172a",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 6,
  elevation: 1,
} as const;

export const layout = {
  sideMargin: 16,
  rankGutter: 44,
  rowMinHeight: 64,
  touchMin: 44,
  categoryButtonMin: 72,
  primaryButtonHeight: 52,
} as const;

/** Minimum touch target on iPhone (Apple HIG 44 pt; WCAG 2.5.8 floor is 24). */
export const TOUCH_TARGET = layout.touchMin;

/**
 * Fonts. `display` is loaded with expo-font / @expo-google-fonts/doto (see
 * src/app/_layout.tsx) and bundled into the app, so it works fully offline.
 * `undefined` fontFamily = the iOS system face (SF Pro), for Dynamic Type.
 */
export const fonts = {
  display: "Doto_800ExtraBold",
  displayHeavy: "Doto_900Black",
  system: undefined as string | undefined,
} as const;

/** Type scale (pt): 13 → 17 → 20 → 28 → 44. Doto only on numbers, >= 20 pt. */
export const size = {
  display: { fontFamily: fonts.display, fontSize: 44, lineHeight: 48 },
  displaySmall: { fontFamily: fonts.display, fontSize: 20, lineHeight: 25 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: "700" as const },
  heading: { fontSize: 20, lineHeight: 25, fontWeight: "600" as const },
  /** Plain numbers so existing `fontSize: size.h2` call sites keep working. */
  h2: 28,
  h3: 20,
  body: 17,
  bodySmall: 15,
  caption: 13,
  tab: { fontSize: 11, lineHeight: 13, fontWeight: "600" as const },
  /** The only all-caps style in the app. */
  stamp: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "800" as const,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
} as const;

export const motion = {
  stampMs: 160,
  stampFromScale: 1.25,
  changeMarkFadeMs: 200,
  undoMs: 5000,
} as const;

export type Freshness = "fresh" | "aging" | "stale";

/** Freshness is ink weight + glyph + words. Never colour alone, never a warning hue. */
export const freshnessStyle = (
  f: Freshness,
): { ink: string; sub: string; glyph: string } =>
  ({
    fresh: { ink: color.ink, sub: color.ink2, glyph: "●" },
    aging: { ink: color.ink2, sub: color.ink2, glyph: "◐" },
    stale: { ink: color.ink3, sub: color.ink3, glyph: "○" },
  })[f];

export type StampInk = "black" | "ballpen" | "coralInk" | "coralSolid" | "faded";

export const stampColors = (
  ink: StampInk,
): { border: string; text: string; fill: string } =>
  ({
    black: { border: color.ink, text: color.ink, fill: "transparent" },
    ballpen: { border: color.ballpen, text: color.ballpen, fill: "transparent" },
    coralInk: { border: color.coralInk, text: color.coralInk, fill: "transparent" },
    coralSolid: { border: color.coral, text: color.onCoral, fill: color.coral },
    faded: { border: color.ink3, text: color.ink3, fill: "transparent" },
  })[ink];

/** Deterministic stamp rotation from an ID: -4deg..+3deg, same slip every render. */
export function stampRotation(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const deg = (Math.abs(h) % 8) - 4;
  return `${deg === 0 ? -2 : deg}deg`;
}

/**
 * Counts, times and scores line up in columns when scanned down a list.
 * Typed as TextStyle: `as const` made the array readonly, which React
 * Native's mutable FontVariant[] rejects wherever this is spread.
 */
export const tabularNums: Pick<TextStyle, "fontVariant"> = {
  fontVariant: ["tabular-nums"],
};
