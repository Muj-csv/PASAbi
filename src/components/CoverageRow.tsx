import { StyleSheet, Text, View } from "react-native";

import type { AreaCoverage, CoverageLevel } from "@pasabi/core";

import { fill, formatAge, plural, useStrings, type Strings } from "@/i18n";
import { color, size, space, tabularNums } from "@/theme/tokens";

/**
 * DESIGN_BRIEF sections 5 and 10. High coverage is blue, never green: many
 * reports say someone is there, not that the area is fine. Every thin level
 * is amber, and "no reports" always says it does not mean safe (BR-017).
 */
function levelText(level: CoverageLevel, t: Strings): string {
  if (level === "high") return t.coverageHigh;
  if (level === "limited") return t.coverageLimited;
  if (level === "stale") return t.coverageStale;
  return t.coverageNone;
}

export function CoverageRow({ row, now }: { row: AreaCoverage; now: number }) {
  const t = useStrings();
  const name = row.label ?? t.noAreaNamed;
  const level = levelText(row.level, t);
  const detail =
    row.lastObservationAt === null
      ? null
      : fill(t.coverageLast, {
          t: formatAge(Math.max(0, now - row.lastObservationAt)),
        }) +
        (row.distinctDevices > 0
          ? " · " + plural(row.distinctDevices, t.phone, t.phones)
          : "");

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={[name, level, detail].filter(Boolean).join(". ")}
    >
      <View style={styles.head}>
        <Text style={[styles.name, row.area === null && styles.unnamed]}>
          {name}
        </Text>
        <Text
          style={[
            styles.level,
            row.level === "high" ? styles.high : styles.thin,
            row.level === "none" && styles.none,
          ]}
        >
          {level}
        </Text>
      </View>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: space[2],
    borderTopWidth: 1,
    borderTopColor: color.borderSubtle,
    gap: 2,
  },
  head: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: space[2],
  },
  name: { fontSize: size.body, fontWeight: "600", color: color.textPrimary },
  unnamed: { fontStyle: "italic", fontWeight: "400" },
  level: { fontSize: size.body, flexShrink: 1 },
  high: { color: color.accent, fontWeight: "600" },
  thin: { color: color.warning, fontWeight: "600" },
  none: { fontWeight: "700" },
  detail: {
    fontSize: size.caption,
    color: color.textSecondary,
    ...tabularNums,
  },
});
