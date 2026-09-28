import { StyleSheet, Text, View } from "react-native";

import type { TimelineEntry } from "@pasabi/core";

import { useStrings } from "@/i18n";
import { color, size, space, tabularNums } from "@/theme/tokens";

function when(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleString();
}

/**
 * FR-014. Log times are ballpen (DESIGN_BRIEF section 4, colour rule 1);
 * operator actions (ACK/RESOLVE) are written in coral-ink, per the `LogEntry`
 * anatomy in section 12.
 */
export function TimelineRow({ entry }: { entry: TimelineEntry }) {
  const t = useStrings();
  const isAction = entry.type === "STATUS";
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
      <Text style={styles.time}>{when(entry.created_at)}</Text>
      <Text style={[styles.head, isAction && styles.action]}>{what}</Text>
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
    borderTopColor: color.rule,
    gap: 2,
  },
  time: {
    fontSize: size.caption,
    fontWeight: "700",
    color: color.ballpen,
    ...tabularNums,
  },
  head: { fontSize: size.body, fontWeight: "600", color: color.ink },
  action: { color: color.coralInk },
  detail: { fontSize: size.body, color: color.ink },
  source: {
    fontSize: size.caption,
    color: color.ink2,
    ...tabularNums,
  },
});
