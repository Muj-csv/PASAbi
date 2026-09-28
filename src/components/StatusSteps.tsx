import { StyleSheet, Text, View } from "react-native";

import type { Propagation } from "@pasabi/core";

import { fill, useStrings } from "@/i18n";
import { color, size, space } from "@/theme/tokens";

import { Stamp } from "./Stamp";

/**
 * DESIGN_BRIEF section 12 (BR-015): the stamp row, in order SAVED · PASSED
 * ON · AT STATION · UPLOADED, inks per section 5. A stage the phone has no
 * evidence for renders as a dashed pending outline, never a real stamp — a
 * stronger step never implies a weaker one, because a report can be
 * uploaded straight from this phone without ever having been passed on.
 */
export function StatusSteps({
  status,
  seed,
  footer = true,
}: {
  status: Propagation;
  /** Observation ID — same tilt every render for the earned stamps. */
  seed: string;
  footer?: boolean;
}) {
  const t = useStrings();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Stamp label={t.stampSaved} ink="black" seed={seed} />
        <Stamp
          label={t.stampPassed}
          ink="ballpen"
          seed={seed}
          pending={!status.passedOn}
        />
        <Stamp
          label={t.stampStation}
          ink="coralInk"
          seed={seed}
          pending={!status.reachedStation}
        />
        <Stamp
          label={t.stampUploaded}
          ink="coralSolid"
          seed={seed}
          pending={!status.uploaded}
        />
      </View>
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
  wrap: { gap: space[2] },
  row: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  grouped: { fontSize: size.body, color: color.ink },
  footer: { fontSize: size.caption, color: color.ink2 },
});
