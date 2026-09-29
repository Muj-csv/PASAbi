/**
 * EXAMPLE composition of R1 Home (SCREENS.md). Actions live in the bottom half (thumb zone).
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  ActionBlock,
  Button,
  CountWidget,
  CopyKey,
  Lang,
  OwnFlags,
  SlipCard,
  StatusBand,
  layout,
  slipStamps,
  space,
  useDesign,
} from '../design';

export function HomeScreen({
  online,
  carrying,
  urgent,
  lastReport,
  rateLimitedUntil,
  onReport,
  onPassOn,
  onReceive,
  onSafe,
  onOpenLast,
  onToggleLang,
}: {
  online: boolean;
  carrying: number;
  urgent: number;
  lastReport?: { id: string; category: string; place: string; time: string; flags: OwnFlags };
  /** "15:02" when BR-010 limit is hit, else undefined. */
  rateLimitedUntil?: string;
  onReport: () => void;
  onPassOn: () => void;
  onReceive: () => void;
  onSafe: () => void;
  onOpenLast: () => void;
  onToggleLang: () => void;
}) {
  const { c, t, lang } = useDesign();
  const other: Lang = lang === 'en' ? 'fil' : 'en';

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <StatusBand
        mode="resident"
        online={online}
        connection={online ? t('band.online') : t('band.offline')}
        accessory={
          <Pressable onPress={onToggleLang} accessibilityRole="button" accessibilityLabel={`Language: ${other}`} style={{ minHeight: layout.touchMin, justifyContent: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.ink }}>EN · FIL</Text>
          </Pressable>
        }
      />
      <View style={{ paddingHorizontal: layout.sideMargin, paddingTop: space.l, gap: space.m }}>
        <Text style={{ fontFamily: 'Doto_900Black', fontSize: 32, lineHeight: 36, color: c.ink }}>PASAbi</Text>
        <CountWidget
          count={carrying}
          label={carrying === 0 ? t('home.countEmpty') : t('home.count')}
          side={urgent > 0 ? t('home.urgent', { n: urgent }) : undefined}
        />
        {lastReport ? (
          <SlipCard
            id={lastReport.id}
            eyebrow={t('home.last')}
            time={lastReport.time}
            title={`${t(`cat.${lastReport.category}` as CopyKey)} · ${lastReport.place}`}
            stamps={slipStamps(lastReport.flags, lang)}
            onPress={onOpenLast}
          />
        ) : null}
      </View>

      <View style={{ flex: 1 }} />

      <View style={{ paddingHorizontal: layout.sideMargin, paddingBottom: space.xxl, gap: space.s }}>
        <Button resident variant="quiet" label={t('action.safe')} onPress={onSafe} />
        <View style={{ flexDirection: 'row', gap: space.s }}>
          <ActionBlock grow tone="ballpen" icon="passOn" label={t('action.passOn')} onPress={onPassOn} />
          <ActionBlock grow tone="ink" icon="receive" label={t('action.receive')} onPress={onReceive} />
        </View>
        <ActionBlock
          tone="coral"
          icon="report"
          height={176}
          label={t('action.report')}
          sub={rateLimitedUntil ? t('home.rateLimit', { time: rateLimitedUntil }) : t('action.report.sub')}
          disabled={!!rateLimitedUntil}
          onPress={onReport}
        />
      </View>
    </View>
  );
}
