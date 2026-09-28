// StatusBand — top of every screen (DESIGN_BRIEF.md section 12). Station and
// responder screens get the ballpen fill so nobody mistakes the mode; the
// resident band stays a plain surface strip. There is deliberately no
// connectivity dot here: this app has no live network-state signal wired up
// (sync is manual QR, uploads are a manual button with their own real
// success/error text), and a fake "online" dot would say more than the
// phone actually knows (BR-017).
import { Text, View } from "react-native";

import { color, layout, size, space } from "@/theme/tokens";

export function StatusBand({
  mode,
  label,
}: {
  mode: "resident" | "station" | "responder" | "sim";
  label: string;
}) {
  const filled = mode !== "resident";
  const fg = filled ? color.onFill : color.ink;
  return (
    <View
      accessibilityRole="header"
      style={{
        paddingHorizontal: layout.sideMargin,
        paddingVertical: space[3],
        backgroundColor: filled ? color.ballpen : color.surface,
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          fontSize: size.caption,
          fontWeight: "700",
          color: fg,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
