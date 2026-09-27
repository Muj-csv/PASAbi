import { StyleSheet, Text } from "react-native";

import type { Evidence } from "@pasabi/core";

import { plural, useStrings, type Strings } from "@/i18n";
import { color, size, tabularNums } from "@/theme/tokens";

/**
 * BR-012: reports and sources are always two separate numbers, and always
 * shown together, never split across components (DESIGN_BRIEF section 10).
 */
export function evidenceText(
  evidence: Evidence,
  t: Strings,
  corroboration?: string,
): string {
  return (
    plural(evidence.reportCount, t.reportOne, t.reportMany) +
    " · " +
    plural(evidence.sourceCount, t.sourceOne, t.sourceMany) +
    (corroboration ? " · " + corroboration : "")
  );
}

/** The signature line (DESIGN_BRIEF section 7): what a message feed can't show. */
export function EvidenceLine({
  evidence,
  corroboration,
}: {
  evidence: Evidence;
  corroboration?: string;
}) {
  const t = useStrings();
  return (
    <Text style={styles.line}>{evidenceText(evidence, t, corroboration)}</Text>
  );
}

const styles = StyleSheet.create({
  line: { fontSize: size.body, color: color.textPrimary, ...tabularNums },
});
