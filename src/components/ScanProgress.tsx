import { useEffect, useRef } from "react";
import { AccessibilityInfo, StyleSheet, Text, View } from "react-native";

import { fill, useStrings } from "@/i18n";
import { color, size, space, tabularNums } from "@/theme/tokens";

const ANNOUNCE_EVERY_MS = 2000;

/**
 * DESIGN_BRIEF section 12: "12 of 29 frames", readable at a glance while
 * both people hold their phones up, and announced to VoiceOver at most
 * every two seconds so it doesn't talk over itself. Ballpen fill on a
 * white track, matching R5's receive-progress bar.
 */
export function ScanProgress({
  received,
  total,
}: {
  received: number;
  total: number;
}) {
  const t = useStrings();
  const text = fill(t.scanProgress, { k: received, n: total });
  const lastSpoken = useRef(0);

  useEffect(() => {
    const now = Date.now();
    if (total > 0 && now - lastSpoken.current >= ANNOUNCE_EVERY_MS) {
      lastSpoken.current = now;
      AccessibilityInfo.announceForAccessibility(text);
    }
  }, [text, total]);

  const share = total > 0 ? Math.min(1, received / total) : 0;
  return (
    <View style={styles.wrap} accessible accessibilityLabel={text}>
      <View style={styles.track}>
        <View style={[styles.bar, { width: `${Math.round(share * 100)}%` }]} />
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[1] },
  track: {
    height: space[3],
    borderRadius: 4,
    backgroundColor: color.paper,
    borderWidth: 1,
    borderColor: color.rule,
    overflow: "hidden",
  },
  bar: { height: "100%", backgroundColor: color.ballpen },
  text: {
    fontSize: size.heading.fontSize,
    fontWeight: "700",
    color: color.ink,
    ...tabularNums,
  },
});
