import { StyleSheet, Text, View } from "react-native";

import type { Propagation } from "@pasabi/core";

import { fill, useStrings } from "@/i18n";
import { color, size, space } from "@/theme/tokens";

/**
 * DESIGN_BRIEF section 3a, BR-015. Four steps; each shows only its own flag,
 * so a report uploaded but never passed on never shows "passed" as done.
 * Done steps get a check, the strongest done step is bold, the rest are
 * secondary. No green anywhere: none of these steps means help is coming.
 */
export function StatusSteps({
  status,
  footer = true,
}: {
  status: Propagation;
  footer?: boolean;
}) {
  const t = useStrings();
  const steps = [
    { label: t.stepSaved, done: true },
    { label: t.stepPassed, done: status.passedOn },
    { label: t.stepStation, done: status.reachedStation },
    { label: t.stepUploaded, done: status.uploaded },
  ];
  let current = 0;
  steps.forEach((s, i) => {
    if (s.done) current = i;
  });

  return (
    <View style={styles.wrap}>
      {steps.map((s, i) => (
        <View
          key={s.label}
          style={styles.row}
          accessible
          accessibilityLabel={(s.done ? "✓ " : "") + s.label}
        >
          <Text style={[styles.mark, !s.done && styles.future]}>
            {s.done ? "✓" : "·"}
          </Text>
          <Text
            style={[
              styles.label,
              !s.done && styles.future,
              i === current && styles.current,
            ]}
          >
            {s.label}
          </Text>
        </View>
      ))}
      {status.groupedWith > 0 ? (
        <Text style={styles.grouped}>
          {status.groupedWith === 1
            ? t.stepGroupedOne
            : fill(t.stepGrouped, { n: status.groupedWith })}
        </Text>
      ) : null}
      {footer ? <Text style={styles.footer}>{t.stepFooter}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[1] },
  row: { flexDirection: "row", gap: space[2], alignItems: "baseline" },
  mark: {
    width: space[4],
    fontSize: size.body,
    fontWeight: "700",
    color: color.textPrimary,
  },
  label: { fontSize: size.body, color: color.textPrimary, flexShrink: 1 },
  current: { fontWeight: "700" },
  future: { color: color.textSecondary },
  grouped: {
    fontSize: size.body,
    color: color.textPrimary,
    marginTop: space[1],
  },
  footer: {
    fontSize: size.caption,
    color: color.textSecondary,
    marginTop: space[1],
  },
});
