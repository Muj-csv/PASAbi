// PASAbi theme — "logbook + stamp" (docs/design/DESIGN_BRIEF.md, the
// downloaded package under docs/design/ locked 2026-09-27, Veronica pipeline).
// This supersedes the earlier blue-accent brief; that file is kept for
// history but this is the source of truth for src/.
//
// Rules:
// - Components use these values, never a raw hex or a one-off size.
// - Coral = something done (Report, primary buttons, stamps). Ballpen blue =
//   information and station mode. Data (freshness, categories) is ink only.
// - Never red, orange, yellow, green or purple on data (PAGASA / ISO 22324
//   collide with those hues). Resolved fades to ink-3, not green.

import type { TextStyle } from "react-native";

export const color = {
  /** Page background. */
  paper: "#ffffff",
  /** Blocks, panels, pinned bars. */
  surface: "#f2f2f2",
  /** Primary text; fresh evidence. */
  ink: "#000000",
  /** Secondary text; aging evidence. */
  ink2: "#4a4a4a",
  /** Tertiary text; old/stale evidence (AA floor). */
  ink3: "#767676",
  /** Ledger ruling, dividers, hairlines. */
  rule: "#dcd7d2",
  /** Primary action fill: Report, primary buttons, stamps. */
  coral: "#ff6f61",
  /** Stamp ink / borders on white (AA-safe darkening of coral). */
  coralInk: "#c0453a",
  /** Information, station mode, links, log times. */
  ballpen: "#2343d1",
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
  /** Ledger rows, timeline. It's paper, not cards. */
  row: 0,
  /** Stamps (2 pt border). */
  stamp: 4,
  /** Buttons, inputs. */
  control: 12,
  /** Resident widget blocks. */
  block: 20,
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
