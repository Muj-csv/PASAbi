import { StyleSheet, Text, View } from "react-native";

import type { Gaps } from "@pasabi/core";

import { CATEGORY_LABELS, fill, plural, useLang, useStrings } from "@/i18n";
import { color, size, space, tabularNums } from "@/theme/tokens";

/**
 * FR-016, DESIGN_BRIEF sections 5 and 10. Known items get a check; unknown
 * items get "?" and warning colour, and are always worded as a missing
 * report ("Trapped: no report yet"), never as an absence (BR-013, BR-017).
 */
export function KnownUnknownList({ gaps }: { gaps: Gaps }) {
  const t = useStrings();
  const lang = useLang();

  const unknownLines = gaps.unknown.map((c) =>
    fill(t.unknownItem, { category: CATEGORY_LABELS[lang][c] }),
  );
  if (gaps.peopleUnknown) unknownLines.push(t.peopleUnknown);

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>{t.knownHeading}</Text>
      {gaps.known.length === 0 ? (
        <Text style={styles.empty}>{t.knownEmpty}</Text>
      ) : (
        gaps.known.map((k) => (
          <View key={k.category} style={styles.row}>
            <Text style={styles.mark}>✓</Text>
            <Text style={styles.known}>
              {CATEGORY_LABELS[lang][k.category]} ·{" "}
              {plural(k.sourceCount, t.sourceOne, t.sourceMany)}
            </Text>
          </View>
        ))
      )}

      {unknownLines.length > 0 ? (
        <>
          <Text style={[styles.heading, styles.unknownHeading]}>
            {t.unknownHeading}
          </Text>
          {unknownLines.map((line) => (
            <View key={line} style={styles.row}>
              <Text style={[styles.mark, styles.unknown]}>?</Text>
              <Text style={styles.unknown}>{line}</Text>
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[1] },
  heading: { fontSize: size.body, fontWeight: "700", color: color.textPrimary },
  unknownHeading: { marginTop: space[2], color: color.warning },
  row: { flexDirection: "row", gap: space[2], alignItems: "baseline" },
  mark: {
    width: space[4],
    fontSize: size.body,
    fontWeight: "700",
    color: color.textPrimary,
  },
  known: {
    fontSize: size.body,
    color: color.textPrimary,
    flexShrink: 1,
    ...tabularNums,
  },
  unknown: {
    fontSize: size.body,
    color: color.warning,
    fontWeight: "600",
    flexShrink: 1,
  },
  empty: { fontSize: size.body, color: color.textSecondary },
});
