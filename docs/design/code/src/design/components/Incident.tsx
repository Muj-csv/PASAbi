/**
 * Incident-detail components (S2, W1 right column):
 * EvidenceCounts · FactList · WhyFirst · GapList · LogEntry.
 */
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useDesign } from '../context';
import { CopyKey } from '../copy';
import { Category } from '../pictograms';
import { layout, space, type } from '../theme';

/** Two numbers, never merged (BR-012). */
export function EvidenceCounts({ phones, reports }: { phones: number; reports: number }) {
  const { c, t, caveats } = useDesign();
  const cell = (n: number, label: string, divider: boolean) => (
    <View style={{ flex: 1, padding: space.l, borderRightWidth: divider ? 1 : 0, borderRightColor: c.paper }}>
      <Text style={[type.display, { color: c.ink }]}>{n}</Text>
      <Text style={[type.bodySmall, { color: c.ink }]}>{label}</Text>
    </View>
  );
  return (
    <View>
      <View style={{ flexDirection: 'row', backgroundColor: c.ballpenTint }}>
        {cell(phones, t('inc.phones'), true)}
        {cell(reports, t('inc.reports'), false)}
      </View>
      <Text style={[type.caption, { color: c.ink2, paddingHorizontal: layout.sideMargin, paddingTop: space.s }]}>{caveats.counts}</Text>
    </View>
  );
}

export function FactList({ rows }: { rows: { label: string; value: string; strong?: boolean }[] }) {
  const { c } = useDesign();
  return (
    <View style={{ paddingHorizontal: layout.sideMargin, paddingVertical: space.xl, gap: space.m, borderBottomWidth: 1, borderBottomColor: c.rule }}>
      {rows.map((r) => (
        <View key={r.label} style={{ flexDirection: 'row', gap: space.m }}>
          <Text style={[type.body, { width: 112, color: c.ink2 }]}>{r.label}</Text>
          <Text style={[type.body, type.numbers, { flex: 1, color: c.ink, fontWeight: r.strong ? '600' : '400' }]}>{r.value}</Text>
        </View>
      ))}
    </View>
  );
}

/** "Why 2nd?" — the score breakdown lives behind a tap, never as a headline. */
export function WhyFirst({
  ordinal,
  lines,
  total,
}: {
  ordinal: string;
  lines: { label: string; points: number }[];
  total: number;
}) {
  const { c, t, caveats } = useDesign();
  const [open, setOpen] = useState(false);
  const fmt = (n: number) => (n > 0 ? `+${n}` : String(n));
  return (
    <View style={{ paddingHorizontal: layout.sideMargin, paddingTop: space.s, paddingBottom: space.l, borderBottomWidth: 1, borderBottomColor: c.rule }}>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{ minHeight: layout.touchMin, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Text style={[type.body, { color: c.ballpen, fontWeight: '600' }]}>{t('why.title', { ordinal })}</Text>
        <Text style={[type.heading, { color: c.ballpen }]}>{open ? '−' : '+'}</Text>
      </Pressable>
      {open ? (
        <View>
          {lines.map((l) => (
            <View key={l.label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.s, borderBottomWidth: 1, borderBottomColor: c.rule }}>
              <Text style={[type.bodySmall, { color: c.ink }]}>{l.label}</Text>
              <Text style={[type.bodySmall, type.numbers, { color: c.ink, fontWeight: '600' }]}>{fmt(l.points)}</Text>
            </View>
          ))}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.s }}>
            <Text style={[type.bodySmall, { color: c.ink, fontWeight: '600' }]}>{t('why.total')}</Text>
            <Text style={[type.bodySmall, type.numbers, { color: c.ink, fontWeight: '600' }]}>{total}</Text>
          </View>
          <Text style={[type.caption, { color: c.ink2 }]}>{caveats.why}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Known / haven't heard (BR-013). Never ✓/✕. One caveat. */
export function GapList({
  nearby,
  unheard,
}: {
  nearby: { category: Category; phones: number; time: string }[];
  unheard: Category[];
}) {
  const { c, t, caveats } = useDesign();
  const row = { minHeight: layout.touchMin, flexDirection: 'row' as const, alignItems: 'center' as const, gap: space.s, borderBottomWidth: 1, borderBottomColor: c.rule };
  const cat = (k: Category) => t(`cat.${k}` as CopyKey);
  return (
    <View style={{ paddingHorizontal: layout.sideMargin, paddingTop: space.xl }}>
      {nearby.length > 0 ? (
        <>
          <Text style={[type.heading, { color: c.ink, marginBottom: space.s }]}>{t('gap.nearby')}</Text>
          {nearby.map((n) => (
            <View key={n.category} style={row}>
              <Text style={[type.body, { width: 24, color: c.ink }]}>●</Text>
              <Text style={[type.body, { flex: 1, color: c.ink }]}>
                {`${cat(n.category)} · ${n.phones === 1 ? t('ev.phone') : t('ev.phones', { n: n.phones })}`}
              </Text>
              <Text style={[type.bodySmall, type.numbers, { color: c.ink2 }]}>{n.time}</Text>
            </View>
          ))}
        </>
      ) : null}
      <Text style={[type.heading, { color: c.ink, marginTop: space.xl, marginBottom: space.xs }]}>{t('gap.unheard')}</Text>
      <Text style={[type.caption, { color: c.ink2, paddingBottom: space.s }]}>{caveats.noReport}</Text>
      {unheard.map((k) => (
        <View key={k} style={row}>
          <Text style={[type.body, { width: 24, color: c.ink2, fontWeight: '700' }]}>?</Text>
          <Text style={[type.body, { color: c.ink2 }]}>{cat(k)}</Text>
        </View>
      ))}
    </View>
  );
}

/** One line of the incident log. Operator actions are written in coral-ink. */
export function LogEntry({ time, what, detail, operator = false }: { time: string; what: string; detail?: string; operator?: boolean }) {
  const { c } = useDesign();
  const ink = operator ? c.coralInk : c.ink;
  return (
    <View style={{ flexDirection: 'row', gap: space.m, paddingVertical: space.m, borderBottomWidth: 1, borderBottomColor: c.rule }}>
      <Text style={[type.bodySmall, type.numbers, { width: 56, fontWeight: '700', color: operator ? c.coralInk : c.ballpen }]}>{time}</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.body, { color: ink }]}>{what}</Text>
        {detail ? <Text style={[type.caption, { color: c.ink2 }]}>{detail}</Text> : null}
      </View>
    </View>
  );
}

