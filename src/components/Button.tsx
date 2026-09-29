import { Pressable, StyleSheet, Text } from "react-native";

import { color, layout, radius, size, space, TOUCH_TARGET } from "@/theme/tokens";

type Variant = "primary" | "secondary" | "info" | "ink" | "quiet";

/**
 * DESIGN_BRIEF section 12. `primary` = coral fill, black text (the one
 * emergency/report action per screen — "something done"). `info` = ballpen
 * fill, white text, for data/sync actions that aren't the emergency action
 * (Upload). `secondary` = ballpen outline on paper. `ink` = filled dark, for
 * the few actions coral would read wrong for (Delete, Leave station).
 * `quiet` = text only. Busy keeps its width and says what it is doing; there
 * is no disabled state, because a screen should say why an action cannot
 * happen rather than grey the button out.
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
        pressed && variant === "info" && styles.infoPressed,
        pressed && variant === "ink" && styles.inkPressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === "primary" && styles.labelOnCoral,
          (variant === "info" || variant === "ink") && styles.labelOnFill,
        ]}
      >
        {busy && busyLabel ? busyLabel : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    // layout.primaryButtonHeight, not the 44 pt touch-target floor: the
    // reference direction asks for large, obvious primary actions, and this
    // token already existed for exactly that (previously unused).
    minHeight: layout.primaryButtonHeight,
    borderRadius: radius.control,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: color.coral },
  primaryPressed: { backgroundColor: color.coralInk },
  secondary: {
    backgroundColor: color.paper,
    borderWidth: 2,
    borderColor: color.ballpen,
  },
  secondaryPressed: { backgroundColor: color.ballpenTint },
  info: { backgroundColor: color.ballpen },
  infoPressed: { backgroundColor: color.ballpenPressed },
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
