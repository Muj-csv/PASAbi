import { StyleSheet, Text, View } from "react-native";

import { color, radius, size, space } from "@/theme/tokens";

type Tone = "info" | "warning" | "error";

const EDGE: Record<Tone, string> = {
  info: color.border,
  warning: color.warning,
  error: color.danger,
};

/**
 * DESIGN_BRIEF section 10: replaces raw error strings. `detail` is for
 * developer-facing text, kept small and secondary (section 8).
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
      style={[styles.box, { borderColor: EDGE[tone] }]}
      accessibilityRole={tone === "info" ? undefined : "alert"}
    >
      <Text style={[styles.message, tone === "error" && styles.error]}>
        {message}
      </Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space[3],
    gap: space[1],
  },
  message: { fontSize: size.body, color: color.textPrimary, fontWeight: "600" },
  error: { color: color.danger },
  detail: { fontSize: size.caption, color: color.textSecondary },
});
