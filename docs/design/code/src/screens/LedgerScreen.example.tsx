/**
 * EXAMPLE composition of S1 Ledger (SCREENS.md). Wire `data` to your engine selectors.
 * This file shows layout order and which component goes where; copy it into your screen and adapt.
 */
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import {
  Button,
  CoverageRow,
  EngineCoverage,
  EngineEvidence,
  EngineIncident,
  Change,
  LedgerRow,
  StatusBand,
  layout,
  space,
  toCoverageRows,
  toLedgerRows,
  type,
  useDesign,
} from '../design';

export function LedgerScreen({
  stationName,
  online,
  lastUploadAt,
  lastLocalUpdate,
  incidents,
  evidence,
  changes,
  coverage,
  onOpen,
  onMarkSeen,
}: {
  stationName: string;
  online: boolean;
  lastUploadAt?: string;
  lastLocalUpdate: string; // "14:32"
  incidents: EngineIncident[];
  evidence: Record<string, EngineEvidence>;
  changes: Record<string, Change | undefined>;
  coverage: EngineCoverage[];
  onOpen: (key: string) => void;
  onMarkSeen: () => void;
}) {
  const { c, t, lang, caveats } = useDesign();
  const rows = toLedgerRows(incidents, evidence, changes, lang, onOpen);
  const open = rows.filter((r) => !r.resolved).length;
  const allOld = rows.length > 0 && rows.every((r) => r.freshness === 'stale');

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <StatusBand
        mode="station"
        online={online}
        label={t('band.station', { name: stationName })}
        connection={online ? t('band.online.station', { time: lastUploadAt ?? '—' }) : t('band.offline.station')}
      />
      <ScrollView>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: layout.sideMargin, paddingTop: space.xl, paddingBottom: space.l }}>
          <View style={{ gap: space.xs }}>
            <Text accessibilityRole="header" style={[type.title, { color: c.ink }]}>{t('ledger.title')}</Text>
            <Text style={[type.caption, { color: c.ink2 }]}>{t('ledger.counts', { open, resolved: rows.length - open })}</Text>
            {allOld ? <Text style={[type.caption, { color: c.ink2 }]}>{t('ledger.allOld')}</Text> : null}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[type.display, { color: c.ink }]}>{lastLocalUpdate}</Text>
            <Text style={[type.caption, { color: c.ink2 }]}>{t('ledger.lastUpdate')}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: layout.sideMargin, paddingBottom: space.m, borderBottomWidth: 1, borderBottomColor: c.rule }}>
          <Text style={[type.caption, { color: c.ink2 }]}>{t('ledger.sort')}</Text>
          <Button variant="secondary" label={t('ledger.markSeen')} onPress={onMarkSeen} />
        </View>

        {rows.length === 0 ? (
          <View style={{ padding: layout.sideMargin, gap: space.s }}>
            <Text style={[type.body, { color: c.ink }]}>{t('ledger.empty')}</Text>
            <Text style={[type.caption, { color: c.ink2 }]}>{caveats.noReport}</Text>
          </View>
        ) : (
          rows.map((r) => <LedgerRow key={r.id} {...r} />)
        )}

        <View style={{ paddingHorizontal: layout.sideMargin, paddingTop: space.xxl, paddingBottom: space.m, gap: space.xs, borderBottomWidth: 1, borderBottomColor: c.rule }}>
          <Text style={[type.heading, { color: c.ink }]}>{t('cov.title')}</Text>
          <Text style={[type.caption, { color: c.ink2 }]}>{caveats.coverage}</Text>
        </View>
        {toCoverageRows(coverage, lang).map((r) => (
          <CoverageRow key={r.area} {...r} />
        ))}
        <View style={{ height: space.xxxl }} />
      </ScrollView>
    </View>
  );
}
