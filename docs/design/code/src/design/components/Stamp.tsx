/**
 * Stamp — the one expressive gesture in PASAbi (DESIGN_BRIEF.md §8, §12).
 * Press-in animation + medium haptic ONLY when `justEarned` (the moment evidence arrived).
 * A pending stage renders as a dashed outline in sentence case, never as a real stamp.
 */
import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useDesign } from '../context';
import { motion, radius, StampInk, stampColors, stampRotation, type } from '../theme';

export function Stamp({
  label,
  ink,
  seed,
  justEarned = false,
  pending = false,
  size = 'small',
}: {
  label: string;
  ink: StampInk;
  /** Report/incident ID — gives the same tilt every render. */
  seed: string;
  justEarned?: boolean;
  pending?: boolean;
  size?: 'small' | 'large';
}) {
  const { c } = useDesign();
  const scale = useRef(new Animated.Value(justEarned ? motion.stampFromScale : 1)).current;
  const opacity = useRef(new Animated.Value(justEarned ? 0 : 1)).current;

  useEffect(() => {
    if (!justEarned) return;
    let cancelled = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        scale.setValue(1);
        opacity.setValue(1);
        return;
      }
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: motion.stampMs, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: motion.stampMs, useNativeDriver: true }),
      ]).start();
    });
    return () => {
      cancelled = true;
    };
  }, [justEarned, scale, opacity]);

  const pad = size === 'large' ? { paddingHorizontal: 10, paddingVertical: 6 } : { paddingHorizontal: 6, paddingVertical: 2 };

  if (pending) {
    return (
      <View style={[{ borderWidth: 2, borderStyle: 'dashed', borderColor: c.rule, borderRadius: radius.stamp }, pad]}>
        <Text style={[type.caption, { color: c.ink3, fontWeight: '600' }]}>{label}</Text>
      </View>
    );
  }

  const col = stampColors(c, ink);
  return (
    <Animated.View
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
      style={[
        {
          alignSelf: 'flex-start',
          borderWidth: 2,
          borderColor: col.border,
          backgroundColor: col.fill,
          borderRadius: radius.stamp,
          opacity,
          transform: [{ rotate: stampRotation(seed) }, { scale }],
        },
        pad,
      ]}
    >
      <Text style={[type.stamp, { color: col.text }]}>{label}</Text>
    </Animated.View>
  );
}
