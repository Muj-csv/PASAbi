/**
 * StatusBand — top of every screen. Mode colour + connection in words (never a modal).
 * Station / responder / sim: ballpen fill, mode label left, connection right.
 * Resident: surface fill, connection left, optional accessory (language toggle) right.
 */
import React from 'react';
import { Text, View } from 'react-native';
import { useDesign } from '../context';
import { layout, space, type } from '../theme';

export function StatusBand({
  mode,
  online,
  connection,
  label,
  accessory,
}: {
  mode: 'resident' | 'station' | 'responder' | 'sim';
  online: boolean;
  /** Connection words, e.g. t('band.offline.station'). Always shown. */
  connection: string;
  /** Mode label for filled bands, e.g. t('band.station', { name: 'Brgy. Hall' }). */
  label?: string;
  /** Resident only: e.g. an EN · FIL toggle. */
  accessory?: React.ReactNode;
}) {
  const { c } = useDesign();
  const filled = mode !== 'resident';
  const fg = filled ? c.onFill : c.ink;

  const connectionView = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s, flexShrink: 1 }}>
      <View
        style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: fg, backgroundColor: online ? fg : 'transparent' }}
      />
      <Text numberOfLines={1} style={[type.caption, { color: fg }]}>
        {connection}
      </Text>
    </View>
  );

  return (
    <View
      accessibilityRole="header"
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: space.m,
        paddingHorizontal: layout.sideMargin,
        paddingVertical: space.m,
        backgroundColor: filled ? c.ballpen : c.surface,
      }}
    >
      {filled ? (
        <>
          <Text style={[type.caption, { color: fg, fontWeight: '700' }]}>{label}</Text>
          {connectionView}
        </>
      ) : (
        <>
          {connectionView}
          {accessory}
        </>
      )}
    </View>
  );
}
