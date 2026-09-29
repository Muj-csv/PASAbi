/**
 * LedgerRow — the anchor component (S1, W1). Includes EvidenceLine, FreshnessMark and ChangeMark.
 * Row answers what · where · how many phones · last heard without a tap.
 * Radius 0, hairline below. Changed rows: ballpen-tint background. Ink follows freshness.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useDesign } from '../context';
import { CopyKey } from '../copy';
import { Category, Pictogram } from '../pictograms';
import { Freshness, freshnessStyle, layout, motion, space, StampInk, type } from '../theme';
import { Stamp } from './Stamp';

export interface LedgerRowProps {
  id: string;
  /** 1-based rank among OPEN incidents; null when resolved. */
  rank: number | null;
  category: Category;
  place: string;
  phones: number;
  reports: number;
  people?: number | null;
  /** Clock time "14:19" of the latest observation. */
  lastHeard: string;
  freshness: Freshness;
  /** Already translated, e.g. t('mark.phone'). */
  changeMark?: string | null;
  stamp?: { label: string; ink: StampInk; justEarned?: boolean } | null;
  resolved?: boolean;
  onPress?: () => void;
}

export function EvidenceLine({ phones, reports, people, color }: { phones: number; reports: number; people?: number | null; color: string }) {
  const { t } = useDesign();
  const p = phones === 1 ? t('ev.phone') : t('ev.phones', { n: phones });
  const r = reports === 1 ? t('ev.report') : t('ev.reports', { n: reports });
  return (
    <Text style={[type.bodySmall, type.numbers, { color }]}>
      <Text style={{ fontWeight: '600' }}>{p}</Text>
      {` · ${r}`}
      {people ? ` · ${t('ev.people', { n: people })}` : ''}
    </Text>
  );
}

export function FreshnessMark({ time, freshness }: { time: string; freshness: Freshness }) {
  const { c, t } = useDesign();
  const f = freshnessStyle(c, freshness);
  const word = freshness === 'fresh' ? null : t(freshness === 'aging' ? 'fresh.aging' : 'fresh.stale');
  // Word sits UNDER the time so the time column stays narrow (render check, 2026-09-27).
  return (
    <View style={{ alignItems: 'flex-end' }}>
      <Text numberOfLines={1} style={[type.bodySmall, type.numbers, { color: f.ink, fontWeight: '600' }]}>
        {`${f.glyph} ${time}`}
      </Text>
      {word ? <Text style={[type.caption, { color: f.ink }]}>{word}</Text> : null}
    </View>
  );
}

export function ChangeMark({ label }: { label: string }) {
  const { c } = useDesign();
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: motion.changeMarkFadeMs, useNativeDriver: true }).start();
  }, [opacity]);
  return <Animated.Text style={[type.caption, { color: c.ballpen, fontWeight: '700', opacity }]}>{label}</Animated.Text>;
}

export function LedgerRow(props: LedgerRowProps) {
  const { c, t } = useDesign();
  const f = freshnessStyle(c, props.freshness);
  const rankText = props.rank == null ? '—' : String(props.rank).padStart(2, '0');
  const rankInk = props.freshness === 'stale' || props.resolved ? c.ink3 : c.ballpen;

  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row',
        minHeight: layout.rowMinHeight,
        paddingVertical: space.l,
        paddingRight: layout.sideMargin,
        paddingLeft: space.s,
        gap: space.m,
        borderBottomWidth: 1,
        borderBottomColor: c.rule,
        backgroundColor: pressed ? c.surface : props.changeMark ? c.ballpenTint : c.paper,
      })}
    >
      <Text style={[type.displaySmall, { width: layout.rankGutter, textAlign: 'center', color: rankInk }]}>{rankText}</Text>

      <View style={{ flex: 1, gap: space.xs }}>
        {/* Pictogram + category never split; the place may wrap below. */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', columnGap: space.s, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s }}>
            <Pictogram category={props.category} size={22} color={f.ink} />
            <Text numberOfLines={1} style={[type.heading, { color: f.ink }]}>{t(`cat.${props.category}` as CopyKey)}</Text>
          </View>
          <Text style={[type.body, { color: f.sub }]}>{props.place}</Text>
        </View>
        <EvidenceLine phones={props.phones} reports={props.reports} people={props.people} color={f.sub} />
        {props.freshness === 'stale' && !props.resolved ? (
          <Text style={[type.caption, { color: f.sub }]}>{t('old.note')}</Text>
        ) : null}
        {/* Stamps live in the content column so they never squeeze the time column. */}
        {props.stamp ? (
          <View style={{ marginTop: space.xs }}>
            <Stamp seed={props.id} {...props.stamp} />
          </View>
        ) : null}
      </View>

      <View style={{ alignItems: 'flex-end', gap: space.s }}>
        <FreshnessMark time={props.lastHeard} freshness={props.freshness} />
        {props.changeMark ? <ChangeMark label={props.changeMark} /> : null}
      </View>
    </Pressable>
  );
}
