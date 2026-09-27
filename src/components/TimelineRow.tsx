import { StyleSheet, Text, View } from "react-native";

import type { TimelineEntry } from "@pasabi/core";

import { useStrings } from "@/i18n";
import { color, size, space, tabularNums } from "@/theme/tokens";

function when(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleString();
}

/** FR-014: one report or status action, with its 6-character source label. */
export function TimelineRow({ entry }: { entry: TimelineEntry }) {
  const t = useStrings();
  const what =
    entry.type === "STATUS"
      ? entry.action === "RESOLVE"
        ? t.statusResolved
        : t.statusAcknowledged
      : t.timelineReport;
  const details = [
    entry.note,
    entry.area_text,
    typeof entry.people === "number"
      ? t.peopleAffectedShort + ": " + String(entry.people)
      : undefined,
  ].filter((d): d is string => Boolean(d));

  return (
    <View style={styles.row}>
      <Text style={styles.head}>
        {what} · {when(entry.created_at)}
      </Text>
      {details.map((d) => (
        <Text key={d} style={styles.detail}>
          {d}
        </Text>
      ))}
      <Text style={styles.source}>
        {t.phone} {entry.source}
      </Text>
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
    fontSize: size.body,
    fontWeight: "600",
    color: color.textPrimary,
    ...tabularNums,
  },
  detail: { fontSize: size.body, color: color.textPrimary },
  source: {
    fontSize: size.caption,
    color: color.textSecondary,
    ...tabularNums,
  },
});
