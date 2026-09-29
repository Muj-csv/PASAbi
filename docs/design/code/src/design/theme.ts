/**
 * PASAbi design tokens — the code form of docs/design/DESIGN_BRIEF.md (Locked 2026-09-27).
 * If this file and DESIGN_BRIEF.md disagree, DESIGN_BRIEF.md wins: fix this file.
 * Never add a colour, size or spacing value here that is not in the brief.
 */
import { useColorScheme } from 'react-native';

export type Scheme = 'light' | 'dark';

export interface Palette {
  paper: string;
  surface: string;
  ink: string;
  ink2: string;
  ink3: string;
  rule: string;
  coral: string;
  coralInk: string;
  ballpen: string;
  ballpenTint: string;
  nodata: string;
  /** Text that sits on a ballpen or ink fill. */
  onFill: string;
  /** Text that sits on a coral fill. Always black: white on coral fails contrast. */
  onCoral: string;
}

export const palettes: Record<Scheme, Palette> = {
  light: {
    paper: '#FFFFFF',
    surface: '#F2F2F2',
    ink: '#000000',
    ink2: '#4A4A4A',
    ink3: '#767676',
    rule: '#DCD7D2',
    coral: '#FF6F61',
    coralInk: '#C0453A',
    ballpen: '#2343D1',
    ballpenTint: '#E4E9FF',
    nodata: '#DCD7D2',
    onFill: '#FFFFFF',
    onCoral: '#000000',
  },
  dark: {
    paper: '#0A0A0A',
    surface: '#1A1A1A',
    ink: '#F2F2F2',
    ink2: '#A3A3A3',
    ink3: '#8A8A8A',
    rule: '#2A2A2A',
    coral: '#FF6F61',
    coralInk: '#FF6F61',
    ballpen: '#8FA6FF',
    ballpenTint: '#16204A',
    nodata: '#2A2A2A',
    onFill: '#0A0A0A',
    onCoral: '#000000',
  },
};

/** Spacing scale. No other values. */
export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { row: 0, stamp: 4, control: 12, block: 20 } as const;

export const layout = {
  sideMargin: 16,
  rankGutter: 44,
  rowMinHeight: 64,
  touchMin: 44,
  categoryButtonMin: 72,
  primaryButtonHeight: 52,
} as const;

/**
 * Fonts. `display` must be loaded with expo-font (see IMPLEMENTATION.md §2).
 * `undefined` fontFamily = iOS system font (SF Pro), which gives Dynamic Type for free.
 */
export const fonts = {
  display: 'Doto_800ExtraBold',
  displayHeavy: 'Doto_900Black',
  system: undefined as string | undefined,
} as const;

/** Type scale (pt). 13 → 17 → 20 → 28 → 44. */
export const type = {
  display: { fontFamily: fonts.display, fontSize: 44, lineHeight: 48 },
  displaySmall: { fontFamily: fonts.display, fontSize: 20, lineHeight: 25 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '600' as const },
  heading: { fontSize: 20, lineHeight: 25, fontWeight: '600' as const },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' as const },
  bodySmall: { fontSize: 15, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  tab: { fontSize: 11, lineHeight: 13, fontWeight: '600' as const },
  /** The only all-caps style in the app. */
  stamp: { fontSize: 13, lineHeight: 16, fontWeight: '800' as const, letterSpacing: 1, textTransform: 'uppercase' as const },
  numbers: { fontVariant: ['tabular-nums'] as ('tabular-nums')[] },
} as const;

export const motion = {
  stampMs: 160,
  stampFromScale: 1.25,
  changeMarkFadeMs: 200,
  undoMs: 5000,
} as const;

export type Freshness = 'fresh' | 'aging' | 'stale';

/** Freshness is ink weight + glyph + words. Never colour alone, never warning hues. */
export const freshnessStyle = (p: Palette, f: Freshness) =>
  ({
    fresh: { ink: p.ink, sub: p.ink2, glyph: '●' },
    aging: { ink: p.ink2, sub: p.ink2, glyph: '◐' },
    stale: { ink: p.ink3, sub: p.ink3, glyph: '○' },
  })[f];

export type StampInk = 'black' | 'ballpen' | 'coral' | 'coralSolid' | 'faded';

export const stampColors = (p: Palette, ink: StampInk) =>
  ({
    black: { border: p.ink, text: p.ink, fill: 'transparent' },
    ballpen: { border: p.ballpen, text: p.ballpen, fill: 'transparent' },
    coral: { border: p.coralInk, text: p.coralInk, fill: 'transparent' },
    coralSolid: { border: p.coral, text: p.onCoral, fill: p.coral },
    faded: { border: p.ink3, text: p.ink3, fill: 'transparent' },
  })[ink];

export interface Theme {
  scheme: Scheme;
  c: Palette;
}

/** Follows system appearance. Pass `force` for the demo (light) or screenshots. */
export function useTheme(force?: Scheme): Theme {
  const sys = useColorScheme();
  const scheme: Scheme = force ?? (sys === 'dark' ? 'dark' : 'light');
  return { scheme, c: palettes[scheme] };
}

/** Deterministic stamp rotation from an ID, −4°…+3°. Same slip, same tilt, every render. */
export function stampRotation(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const deg = (Math.abs(h) % 8) - 4;
  return `${deg === 0 ? -2 : deg}deg`;
}
