// StatusBand — top of every screen, below the native header (DESIGN_BRIEF.md
// section 12). 2026-09-29 reskin: a compact status pill (reference section 7,
// "small status indicators") rather than a full-width colour band, now that
// the navy header above it already carries the screen title. Station and
// responder modes still get the ballpen dot so nobody mistakes the mode; the
// resident pill stays neutral ink. There is deliberately no connectivity dot
// here: this app has no live network-state signal wired up (sync is manual
// QR, uploads are a manual button with their own real success/error text),
// and a fake "online" dot would say more than the phone actually knows
// (BR-017).
import { StyleSheet, Text, View } from "react-native";

import { color, layout, radius, size, space } from "@/theme/tokens";

export function StatusBand({
  mode,
  label,
}: {
  mode: "resident" | "station" | "responder" | "sim";
  label: string;
}) {
  const flagged = mode !== "resident";
  return (
    <View style={styles.wrap} accessibilityRole="header">
      <View style={[styles.pill, flagged && styles.pillFlagged]}>
        <View style={[styles.dot, { backgroundColor: flagged ? color.ballpen : color.ink3 }]} />
        <Text numberOfLines={1} style={styles.label}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: layout.sideMargin, paddingTop: space[3] },
  pill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: space[1],
    paddingHorizontal: space[3],
    paddingVertical: space[1],
    borderRadius: radius.pill,
    backgroundColor: color.paper,
    borderWidth: 1,
    borderColor: color.rule,
  },
  pillFlagged: { borderColor: color.ballpen },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: size.caption, fontWeight: "700", color: color.ink },
});
