// Stamp — the one expressive gesture in PASAbi (DESIGN_BRIEF.md sections 8
// and 12). Press-in animation + a medium haptic ONLY when `justEarned` (the
// moment evidence arrived). A pending stage renders as a dashed outline in
// sentence case, never as a real stamp (never claim evidence the phone
// doesn't hold).
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Text, View } from "react-native";

import {
  color,
  motion,
  radius,
  size,
  stampColors,
  stampRotation,
  type StampInk,
} from "@/theme/tokens";

export function Stamp({
  label,
  ink,
  seed,
  justEarned = false,
  pending = false,
  large = false,
}: {
  label: string;
  ink: StampInk;
  /** Observation/incident ID — gives the same tilt every render. */
  seed: string;
  justEarned?: boolean;
  pending?: boolean;
  large?: boolean;
}) {
  // react-hooks/refs (R2's LEARNING.md note) rejects reading ref.current
  // during render, so the Animated.Value is lazily constructed once via
  // useState instead of the usual useRef(...).current idiom.
  const [scale] = useState(() => new Animated.Value(justEarned ? motion.stampFromScale : 1));
  const [opacity] = useState(() => new Animated.Value(justEarned ? 0 : 1));

  useEffect(() => {
    if (!justEarned) return;
    let cancelled = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        scale.setValue(1);
        opacity.setValue(1);
        return;
      }
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: motion.stampMs,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: motion.stampMs,
          useNativeDriver: true,
        }),
      ]).start();
    });
    return () => {
      cancelled = true;
    };
  }, [justEarned, scale, opacity]);

  const pad = large
    ? { paddingHorizontal: 10, paddingVertical: 6 }
    : { paddingHorizontal: 6, paddingVertical: 2 };

  if (pending) {
    return (
      <View
        style={[
          {
            borderWidth: 2,
            borderStyle: "dashed",
            borderColor: color.rule,
            borderRadius: radius.stamp,
          },
          pad,
        ]}
      >
        <Text style={[size.stamp, { color: color.ink3 }]}>{label}</Text>
      </View>
    );
  }

  const col = stampColors(ink);
  return (
    <Animated.View
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
      style={[
        {
          alignSelf: "flex-start",
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
      <Text style={[size.stamp, { color: col.text }]}>{label}</Text>
    </Animated.View>
  );
}
