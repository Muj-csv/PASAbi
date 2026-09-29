/**
 * Buttons, resident blocks, coverage rows, slips, undo:
 * Button · ActionBlock · CountWidget · SlipCard · CoverageRow · UndoBar.
 */
import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useDesign } from '../context';
import { Icon, UiIcon } from '../pictograms';
import { layout, motion, radius, space, StampInk, type } from '../theme';
import { Stamp } from './Stamp';

export function Button({
  label,
  onPress,
  variant = 'primary',
  onCoralPage = false,
  disabled = false,
  resident = false,
}: {
  label: string;
  onPress?: () => void;
  /** Resident quiet buttons are underlined ink; station quiet buttons are ballpen. */
  resident?: boolean;
  /** primary: coral fill · secondary: ballpen outline · quiet: text only */
  variant?: 'primary' | 'secondary' | 'quiet';
  /** R3/R4 have a coral page: primary becomes ink fill + white text. */
  onCoralPage?: boolean;
  disabled?: boolean;
}) {
  const { c } = useDesign();
  let bg = 'transparent';
  let fg = c.ink;
  let border: string | undefined;
  if (variant === 'primary') {
    bg = onCoralPage ? c.ink : c.coral;
    fg = onCoralPage ? c.paper : c.onCoral;
  } else if (variant === 'secondary') {
    border = onCoralPage ? c.ink : c.ballpen;
    fg = border;
  } else {
    fg = onCoralPage || resident ? c.ink : c.ballpen;
  }
  if (disabled && variant === 'primary') {
    bg = c.surface;
    fg = c.ink2;
  }
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        minHeight: variant === 'quiet' ? layout.touchMin : layout.primaryButtonHeight,
        paddingHorizontal: variant === 'quiet' ? 0 : space.l,
        borderRadius: radius.control,
        backgroundColor: bg,
        borderWidth: border ? 2 : 0,
        borderColor: border,
        alignItems: variant === 'quiet' ? 'flex-start' : 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={[type.body, { color: fg, fontWeight: '700', textDecorationLine: variant === 'quiet' && resident ? 'underline' : 'none' }]}>{label}</Text>
    </Pressable>
  );
}

export function ActionBlock({
  label,
  sub,
  icon,
  tone,
  height = 104,
  onPress,
  disabled = false,
  grow = false,
}: {
  label: string;
  sub?: string;
  icon: UiIcon;
  /** true when side by side in a row (Pass on | Receive). */
  grow?: boolean;
  /** coral: Report · ballpen: Pass on · ink: Receive */
  tone: 'coral' | 'ballpen' | 'ink';
  height?: number;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const { c } = useDesign();
  const bg = tone === 'coral' ? c.coral : tone === 'ballpen' ? c.ballpen : c.ink;
  const fg = tone === 'coral' ? c.onCoral : c.onFill;
  const big = height >= 160;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        flex: grow ? 1 : undefined,
        height,
        borderRadius: radius.block,
        padding: big ? 20 : space.l,
        backgroundColor: bg,
        justifyContent: 'space-between',
        opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
      })}
    >
      <Icon name={icon} size={big ? 36 : 28} color={fg} />
      <View style={{ gap: 2 }}>
        <Text style={{ fontSize: big ? 34 : 20, lineHeight: big ? 40 : 25, fontWeight: '800', color: fg }}>{label}</Text>
        {sub ? <Text style={[type.bodySmall, { color: fg, fontWeight: '500' }]}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

export function CountWidget({ count, label, side }: { count: number; label: string; side?: string }) {
  const { c } = useDesign();
  return (
    <View
      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: space.l, backgroundColor: c.surface, borderRadius: radius.block }}
    >
      <View>
        <Text style={[type.display, { color: c.ink }]}>{count}</Text>
        <Text style={[type.bodySmall, { color: c.ink }]}>{label}</Text>
      </View>
      {side ? <Text style={[type.bodySmall, { color: c.ink, fontWeight: '600' }]}>{side}</Text> : null}
    </View>
  );
}

export interface SlipStamp {
  label: string;
  ink: StampInk;
  earned: boolean;
  justEarned?: boolean;
}

/** A report as a slip: label + time · category · place · stamp row (earned stamps, then pending outlines). */
export function SlipCard({
  id,
  eyebrow,
  time,
  title,
  detail,
  stamps,
  onPress,
}: {
  id: string;
  eyebrow?: string;
  time: string;
  title: string;
  detail?: string;
  stamps: SlipStamp[];
  onPress?: () => void;
}) {
  const { c } = useDesign();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={{ padding: space.l, gap: space.m, borderWidth: 1, borderColor: c.rule, borderRadius: radius.block, backgroundColor: c.paper }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={[type.caption, { color: c.ink2 }]}>{eyebrow ?? ''}</Text>
        <Text style={[type.caption, type.numbers, { color: c.ink2 }]}>{time}</Text>
      </View>
      <Text style={[type.heading, { color: c.ink }]}>{title}</Text>
      {detail ? <Text style={[type.bodySmall, { color: c.ink2 }]}>{detail}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s, alignItems: 'center' }}>
        {stamps.map((s) => (
          <Stamp key={s.label} seed={`${id}:${s.label}`} label={s.label} ink={s.ink} pending={!s.earned} justEarned={s.justEarned} />
        ))}
      </View>
    </Pressable>
  );
}

export type CoverageLevel = 'high' | 'limited' | 'stale' | 'none';

/** Worst first. "No reports" is the loudest row, on the ISO 22324 "no information" grey. */
export function CoverageRow({ area, level, label }: { area: string; level: CoverageLevel; label: string }) {
  const { c } = useDesign();
  const dots = { high: '●●●', limited: '●●○', stale: '○○○', none: '?' }[level];
  const chipBg = level === 'none' ? c.nodata : level === 'stale' ? c.surface : 'transparent';
  const weight = level === 'none' ? '700' : level === 'stale' ? '600' : '400';
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', minHeight: layout.touchMin, paddingHorizontal: layout.sideMargin, gap: space.s, borderBottomWidth: 1, borderBottomColor: c.rule }}
    >
      <Text style={[type.body, { flex: 1, color: c.ink, fontWeight: '600' }]}>{area}</Text>
      <Text style={[type.displaySmall, { width: 56, color: c.ink }]}>{dots}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text numberOfLines={1} style={[type.caption, { color: c.ink, fontWeight: weight, backgroundColor: chipBg, paddingHorizontal: space.s, paddingVertical: space.xs, borderRadius: radius.stamp, overflow: 'hidden' }]}>
          {label}
        </Text>
      </View>
    </View>
  );
}

/** "Resolved. Undo" — 5 s, then commits. Replaces a modal confirm for reversible actions. */
export function UndoBar({ message, onUndo, onCommit }: { message: string; onUndo: () => void; onCommit: () => void }) {
  const { c, t } = useDesign();
  useEffect(() => {
    const id = setTimeout(onCommit, motion.undoMs);
    return () => clearTimeout(id);
  }, [onCommit]);
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', margin: layout.sideMargin, paddingLeft: space.l, borderRadius: radius.control, backgroundColor: c.ink }}
    >
      <Text style={[type.body, { color: c.paper }]}>{message}</Text>
      <Pressable onPress={onUndo} accessibilityRole="button" style={{ minHeight: layout.touchMin, paddingHorizontal: space.l, justifyContent: 'center' }}>
        <Text style={[type.body, { color: c.paper, fontWeight: '700' }]}>{t('undo')}</Text>
      </Pressable>
    </View>
  );
}
