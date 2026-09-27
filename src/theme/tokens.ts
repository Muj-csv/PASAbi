// PASAbi theme. Hand-mirrored from docs/design/tokens.json (the source of
// truth); keep the two identical. AEGIS has no React Native export target.
//
// Rules (docs/design/DESIGN_BRIEF.md):
// - Components use these values, never a raw hex or a one-off size.
// - Colour never carries meaning alone: every status also has a text label.
// - success (green) is RESERVED for "resolved" and explicit safe check-ins.
//   Coverage, sources and freshness never use it (BR-017).

import type { TextStyle } from "react-native";

export const color = {
  bg: "#f2f2f2",
  surface: "#ffffff",
  surfaceRaised: "#e8ecf1",
  surfaceHover: "#e8f1fc",
  textPrimary: "#14181d",
  textSecondary: "#5a6673",
  textOnAccent: "#ffffff",
  border: "#7a8591",
  borderSubtle: "#d8dde3",
  accent: "#1566c0",
  accentHover: "#0f4c92",
  success: "#1c6b3c",
  warning: "#735a12",
  danger: "#b3261e",
  focusRing: "#1566c0",
  qrDark: "#000000",
  qrLight: "#ffffff",
} as const;

export const size = {
  caption: 13,
  body: 16,
  h3: 20,
  h2: 26,
} as const;

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 48,
} as const;

export const radius = {
  control: 10,
  card: 10,
  badge: 4,
} as const;

export const motion = {
  fastMs: 120,
  baseMs: 200,
} as const;

export const breakpoint = {
  md: 768,
} as const;

/** Minimum touch target on iPhone (Apple HIG 44 pt; WCAG 2.5.8 floor is 24). */
export const TOUCH_TARGET = 44;

/**
 * Counts, times and scores line up in columns when scanned down a list.
 * Typed as TextStyle: `as const` made the array readonly, which React
 * Native's mutable FontVariant[] rejects wherever this is spread.
 */
export const tabularNums: Pick<TextStyle, "fontVariant"> = {
  fontVariant: ["tabular-nums"],
};
