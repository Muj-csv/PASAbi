import { StyleSheet, Text } from "react-native";

import type { Evidence } from "@pasabi/core";

import { fill, plural, useStrings, type Strings } from "@/i18n";
import { color, size, tabularNums } from "@/theme/tokens";

/**
 * BR-012: reports and sources are always two separate numbers, and always
 * shown together, never split across components (DESIGN_BRIEF section 12).
 * "Phones" (independent sources) is the trust number and always comes
 * first, bold; "reports" is the raw count. People is added only when known.
 */
export function evidenceText(
  evidence: Evidence,
  t: Strings,
  extra?: string,
): string {
  return (
    plural(evidence.sourceCount, t.phone, t.phones) +
    " · " +
    plural(evidence.reportCount, t.reportOne, t.reportMany) +
    (extra ? " · " + extra : "")
  );
}

export function EvidenceLine({
  evidence,
  people,
  corroboration,
  color: textColor = color.ink,
}: {
  evidence: Evidence;
  /** Incident.peopleAffected — omitted from the line entirely when unknown (0). */
  people?: number;
  corroboration?: string;
  color?: string;
}) {
  const t = useStrings();
  const peopleText =
    people && people > 0 ? fill(t.evidencePeople, { n: people }) : null;
  return (
    <Text style={[styles.line, { color: textColor }]}>
      <Text style={styles.phones}>{plural(evidence.sourceCount, t.phone, t.phones)}</Text>
      {" · " + plural(evidence.reportCount, t.reportOne, t.reportMany)}
      {peopleText ? " · " + peopleText : ""}
      {corroboration ? " · " + corroboration : ""}
    </Text>
  );
}

const styles = StyleSheet.create({
  line: { fontSize: size.body, ...tabularNums },
  phones: { fontWeight: "700" },
});
