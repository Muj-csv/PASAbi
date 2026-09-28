import { StyleSheet, Text, View } from "react-native";

import type { AreaCoverage, CoverageLevel } from "@pasabi/core";

import { fill, formatAge, plural, useStrings, type Strings } from "@/i18n";
import { color, size, space, tabularNums } from "@/theme/tokens";

/**
 * DESIGN_BRIEF section 12, `CoverageRow`. High coverage is ballpen, never
 * green: many phones say someone is there, not that the area is fine.
 * "No reports" is the ISO 22324 no-information grey, bold, so it never
 * reads as fainter (and safer) than a thin level.
 */
function levelText(level: CoverageLevel, t: Strings): string {
  if (level === "high") return t.coverageHigh;
  if (level === "limited") return t.coverageLimited;
  if (level === "stale") return t.coverageStale;
  return t.coverageNone;
}

function dots(level: CoverageLevel): string {
  if (level === "high") return "●●●";
  if (level === "limited") return "●●○";
  if (level === "stale") return "○○○";
  return "?";
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
        <View style={styles.headLeft}>
          <Text style={styles.dots}>{dots(row.level)}</Text>
          <Text style={[styles.name, row.area === null && styles.unnamed]}>
            {name}
          </Text>
        </View>
        <Text
          style={[
            styles.chip,
            row.level === "none" ? styles.chipNoData : styles.chipPlain,
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
    borderTopColor: color.rule,
    gap: 2,
  },
  head: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: space[2],
  },
  headLeft: { flexDirection: "row", alignItems: "center", gap: space[2], flexShrink: 1 },
  dots: { fontSize: size.heading.fontSize, color: color.ink, ...tabularNums },
  name: { fontSize: size.body, fontWeight: "600", color: color.ink },
  unnamed: { fontStyle: "italic", fontWeight: "400" },
  chip: {
    fontSize: size.caption,
    fontWeight: "700",
    paddingHorizontal: space[2],
    paddingVertical: 2,
  },
  chipPlain: { color: color.ink2 },
  chipNoData: {
    color: color.ink,
    backgroundColor: color.nodata,
    overflow: "hidden",
  },
  detail: {
    fontSize: size.caption,
    color: color.ink2,
    ...tabularNums,
  },
});
