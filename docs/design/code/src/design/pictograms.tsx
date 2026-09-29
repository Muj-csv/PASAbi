/**
 * PASAbi pictograms — one set, drawn for PASAbi (DESIGN_BRIEF.md §10).
 * 24-unit grid, 2pt stroke, round caps/joins, monochrome. Always shown next to a text label.
 * No emoji, no stock icon library. Medical deliberately avoids the red-cross emblem (a protected sign).
 * Requires react-native-svg (bundled in Expo Go: `npx expo install react-native-svg`).
 */
import React from 'react';
import Svg, { Path } from 'react-native-svg';

export type Category =
  | 'MEDICAL'
  | 'TRAPPED'
  | 'STRUCTURAL'
  | 'FLOOD'
  | 'ROAD_BLOCKED'
  | 'MISSING_PERSON'
  | 'WATER_FOOD'
  | 'SHELTER'
  | 'SAFE_CHECKIN';

/** Report-flow order: life first, then access, then needs (SCREENS.md R2a). */
export const REPORT_ORDER: Category[] = [
  'MEDICAL', 'TRAPPED', 'FLOOD', 'ROAD_BLOCKED', 'STRUCTURAL', 'MISSING_PERSON', 'WATER_FOOD', 'SHELTER',
];

export const CATEGORY_PATHS: Record<Category, string[]> = {
  MEDICAL: ['M3 12h4l2-5 4 10 2-5h6'],
  TRAPPED: ['M3 6l18 4', 'M10 13a2 2 0 1 0 4 0a2 2 0 1 0 -4 0', 'M8 21v-1a4 4 0 0 1 8 0v1'],
  STRUCTURAL: ['M4 11l8-7 8 7v9H4z', 'M12 9l-1.5 3.5 2.5 2-1.5 5.5'],
  FLOOD: [
    'M7 11V7l5-4 5 4v4',
    'M3 15c2 0 2-1.5 4.5-1.5S9.5 15 12 15s2.5-1.5 4.5-1.5S18.5 15 21 15',
    'M3 19.5c2 0 2-1.5 4.5-1.5S9.5 19.5 12 19.5s2.5-1.5 4.5-1.5S18.5 19.5 21 19.5',
  ],
  ROAD_BLOCKED: ['M4 9h16v5H4z', 'M8 9l3 5M14 9l3 5', 'M6 14v6M18 14v6'],
  MISSING_PERSON: [
    'M7 7a3 3 0 1 0 6 0a3 3 0 1 0 -6 0',
    'M3 21v-1a7 7 0 0 1 10-6.3',
    'M16 14.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.4',
    'M18.5 21v.01',
  ],
  WATER_FOOD: ['M12 3c3 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-6.5 6-11z'],
  SHELTER: ['M3 20L12 4l9 16z', 'M9.5 20l2.5-5 2.5 5'],
  SAFE_CHECKIN: ['M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M8.5 12.5l2.5 2.5 4.5-5'],
};

/** UI icons used by the anchor. Same drawing rules. */
export const UI_PATHS = {
  passOn: ['M4 12h13', 'M13 7l5 5-5 5', 'M20 5v14'],
  receive: ['M4 8V4h4', 'M16 4h4v4', 'M20 16v4h-4', 'M8 20H4v-4', 'M8 12h8'],
  ledger: ['M5 4h14v16H5z', 'M9 9h7', 'M9 13h7', 'M9 17h4'],
  station: ['M4 20V10l8-6 8 6v10z', 'M10 20v-5h4v5'],
  report: ['M6 3h9l4 4v14H6z', 'M15 3v4h4', 'M12 11v6', 'M9 14h6'],
  back: ['M15 5l-7 7 7 7'],
  gps: ['M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z', 'M10 10a2 2 0 1 0 4 0a2 2 0 1 0 -4 0'],
  error: ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z', 'M12 8v5', 'M12 16v.01'],
} as const;

export type UiIcon = keyof typeof UI_PATHS;

interface GlyphProps {
  size?: number;
  color: string;
  strokeWidth?: number;
}

function Glyph({ paths, size = 24, color, strokeWidth = 2 }: GlyphProps & { paths: readonly string[] }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden importantForAccessibility="no">
      {paths.map((d, i) => (
        <Path key={i} d={d} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}

export function Pictogram({ category, ...rest }: GlyphProps & { category: Category }) {
  return <Glyph paths={CATEGORY_PATHS[category]} {...rest} />;
}

export function Icon({ name, ...rest }: GlyphProps & { name: UiIcon }) {
  return <Glyph paths={UI_PATHS[name]} {...rest} />;
}
