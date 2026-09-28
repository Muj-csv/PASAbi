import { Pressable, StyleSheet, Text } from "react-native";

import { color, radius, size, space, TOUCH_TARGET } from "@/theme/tokens";

type Variant = "primary" | "secondary" | "ink" | "quiet";

/**
 * DESIGN_BRIEF section 12. `primary` = coral fill, black text (the one
 * primary action per screen). `secondary` = ballpen outline. `ink` = filled
 * dark, for the few actions coral would read wrong for (Delete, Leave
 * station). `quiet` = text only. Busy keeps its width and says what it is
 * doing; there is no disabled state, because a screen should say why an
 * action cannot happen rather than grey the button out.
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
  if (variant === "quiet") {
    return (
      <Pressable
        onPress={busy ? undefined : onPress}
        accessibilityRole="button"
        accessibilityState={{ busy }}
        style={styles.quiet}
      >
        <Text style={styles.quietLabel}>{busy && busyLabel ? busyLabel : label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={busy ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ busy }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && variant === "primary" && styles.primaryPressed,
        pressed && variant === "secondary" && styles.secondaryPressed,
        pressed && variant === "ink" && styles.inkPressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === "primary" && styles.labelOnCoral,
          variant === "ink" && styles.labelOnFill,
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
  primary: { backgroundColor: color.coral },
  primaryPressed: { backgroundColor: color.coralInk },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: color.ballpen,
  },
  secondaryPressed: { backgroundColor: color.ballpenTint },
  ink: { backgroundColor: color.ink },
  inkPressed: { backgroundColor: color.ink2 },
  label: { fontSize: size.body, fontWeight: "700", color: color.ink },
  labelOnCoral: { color: color.onCoral },
  labelOnFill: { color: color.onFill },
  quiet: {
    minHeight: TOUCH_TARGET,
    paddingVertical: space[3],
    paddingHorizontal: space[2],
    alignItems: "center",
    justifyContent: "center",
  },
  quietLabel: {
    fontSize: size.body,
    fontWeight: "600",
    color: color.ballpen,
    textDecorationLine: "underline",
  },
});
