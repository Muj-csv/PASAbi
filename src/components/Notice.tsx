import { StyleSheet, Text, View } from "react-native";

import { cardShadow, color, size, space } from "@/theme/tokens";

type Tone = "info" | "warning" | "error";

/**
 * DESIGN_BRIEF section 12: replaces raw error strings. There is no colour
 * for "error": ink on surface, bold, with one sentence — the forbidden list
 * bans red for uncertainty and there is no severity hue at all here.
 * Weight (not hue) marks "warning"/"error" — a thicker ink left edge — so a
 * notice still reads as more urgent without a status colour. `detail` is for
 * developer-facing text, kept small and secondary.
 */
export function Notice({
  message,
  detail,
  tone = "info",
}: {
  message: string;
  detail?: string;
  tone?: Tone;
}) {
  return (
    <View
      style={[styles.box, tone !== "info" && styles.boxFlagged]}
      accessibilityRole={tone === "info" ? undefined : "alert"}
    >
      <Text style={styles.message}>{message}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    padding: space[3],
    gap: space[1],
    ...cardShadow,
  },
  boxFlagged: { borderLeftWidth: 4, borderLeftColor: color.ink },
  message: { fontSize: size.body, color: color.ink, fontWeight: "600" },
  detail: { fontSize: size.caption, color: color.ink2 },
});
