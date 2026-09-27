import { Pressable, StyleSheet, Text } from "react-native";

import { color, radius, size, space, TOUCH_TARGET } from "@/theme/tokens";

type Variant = "primary" | "secondary" | "dangerSecondary";

/**
 * DESIGN_BRIEF section 10. Busy keeps its width and says what it is doing;
 * there is no disabled state, because a screen should say why an action
 * cannot happen rather than grey the button out (section 8).
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  busy = false,
  busyLabel,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  busy?: boolean;
  busyLabel?: string;
}) {
  return (
    <Pressable
      onPress={busy ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ busy }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && variant === "primary" && styles.primaryPressed,
        pressed && variant !== "primary" && styles.secondaryPressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === "primary" && styles.labelOnAccent,
          variant === "dangerSecondary" && styles.labelDanger,
        ]}
      >
        {busy && busyLabel ? busyLabel : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: TOUCH_TARGET,
    borderRadius: radius.control,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: color.accent },
  primaryPressed: { backgroundColor: color.accentHover },
  secondary: { backgroundColor: color.surfaceRaised },
  dangerSecondary: { backgroundColor: color.surfaceRaised },
  secondaryPressed: { backgroundColor: color.borderSubtle },
  label: { fontSize: size.body, fontWeight: "700", color: color.textPrimary },
  labelOnAccent: { color: color.textOnAccent },
  labelDanger: { color: color.danger },
});
