import { StyleSheet, Text, View } from "react-native";

import type { Evidence } from "@pasabi/core";

import { fill, formatAge, useStrings, type Strings } from "@/i18n";
import { color, size, space, tabularNums } from "@/theme/tokens";

import { Badge } from "./Badge";

/** BR-011 "Last Known Truth": stale information is labelled as such. */
export function freshnessText(evidence: Evidence, t: Strings): string {
  const age = formatAge(evidence.latestAgeSeconds);
  return evidence.freshness === "stale"
    ? fill(t.staleLine, { t: age })
    : fill(t.lastReported, { t: age });
}

/** Fresh and aging read the same; stale adds the badge and the warning. */
export function FreshnessText({ evidence }: { evidence: Evidence }) {
  const t = useStrings();
  const text = freshnessText(evidence, t);

  if (evidence.freshness !== "stale") {
    return <Text style={styles.plain}>{text}</Text>;
  }
  return (
    <View style={styles.row}>
      <Badge
        label={t.staleBadge}
        tone="warning"
        accessibilityLabel={t.staleBadge + ". " + text}
      />
      <Text style={styles.stale}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: space[2],
  },
  plain: {
    fontSize: size.caption,
    color: color.textSecondary,
    ...tabularNums,
  },
  stale: {
    fontSize: size.caption,
    color: color.warning,
    fontWeight: "600",
    flexShrink: 1,
    ...tabularNums,
  },
});
