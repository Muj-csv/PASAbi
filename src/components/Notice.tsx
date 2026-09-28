import { StyleSheet, Text, View } from "react-native";

import { color, radius, size, space } from "@/theme/tokens";

type Tone = "info" | "warning" | "error";

/**
 * DESIGN_BRIEF section 12: replaces raw error strings. There is no colour
 * for "error": ink on surface, bold, with one sentence — the forbidden list
 * bans red for uncertainty and there is no severity hue at all here.
 * `detail` is for developer-facing text, kept small and secondary.
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
    <View style={styles.box} accessibilityRole={tone === "info" ? undefined : "alert"}>
      <Text style={styles.message}>{message}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: color.surface,
    borderRadius: radius.control,
    padding: space[3],
    gap: space[1],
  },
  message: { fontSize: size.body, color: color.ink, fontWeight: "600" },
  detail: { fontSize: size.caption, color: color.ink2 },
});
