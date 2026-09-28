import { StyleSheet, Text, View } from "react-native";

import type { Evidence } from "@pasabi/core";

import { fill, formatAge, useStrings, type Strings } from "@/i18n";
import { freshnessStyle, size, tabularNums } from "@/theme/tokens";

/** BR-011 "Last Known Truth": stale information is labelled as such. */
export function freshnessText(evidence: Evidence, t: Strings): string {
  const age = formatAge(evidence.latestAgeSeconds);
  return evidence.freshness === "stale"
    ? fill(t.staleLine, { t: age })
    : fill(t.lastReported, { t: age });
}

/**
 * Freshness is ink weight + a glyph + words, never colour alone and never a
 * warning hue (DESIGN_BRIEF section 4, rule 4). Fresh and aging read as one
 * line; stale adds a second line, "May have changed."
 */
export function FreshnessText({ evidence }: { evidence: Evidence }) {
  const t = useStrings();
  const f = freshnessStyle(evidence.freshness);
  const word =
    evidence.freshness === "aging"
      ? t.freshAging
      : evidence.freshness === "stale"
        ? t.freshOld
        : null;
  // The visual line drops the "may have changed" suffix that staleLine
  // carries for accessibility labels (freshnessText below): it gets its own
  // line here instead of being said twice.
  const age = formatAge(evidence.latestAgeSeconds);
  const text = fill(
    evidence.freshness === "stale" ? t.lastKnownShort : t.lastReported,
    { t: age },
  );

  return (
    <View style={styles.wrap}>
      <Text style={[styles.line, { color: f.ink }]}>
        {f.glyph} {text}
        {word ? " · " + word : ""}
      </Text>
      {evidence.freshness === "stale" ? (
        <Text style={[styles.note, { color: f.sub }]}>{t.oldNote}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  line: { fontSize: size.caption, ...tabularNums },
  note: { fontSize: size.caption, fontWeight: "600" },
});
