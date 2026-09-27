import { StyleSheet, Text } from "react-native";

import { color, radius, size, space } from "@/theme/tokens";

/**
 * DESIGN_BRIEF sections 5 and 10. The text is always present, so colour is
 * never the only signal. warning = uncertainty, success = resolved only.
 */
export type BadgeTone = "accent" | "danger" | "warning" | "success";

const BACKGROUND: Record<BadgeTone, string> = {
  accent: color.accent,
  danger: color.danger,
  warning: color.warning,
  success: color.success,
};

export function Badge({
  label,
  tone,
  accessibilityLabel,
}: {
  label: string;
  tone: BadgeTone;
  accessibilityLabel?: string;
}) {
  return (
    <Text
      style={[styles.badge, { backgroundColor: BACKGROUND[tone] }]}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    color: color.textOnAccent,
    fontSize: size.caption,
    fontWeight: "700",
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: radius.badge,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
});
