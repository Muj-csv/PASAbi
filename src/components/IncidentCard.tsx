import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Evidence, Incident, IncidentChange } from "@pasabi/core";

import {
  CATEGORY_LABELS,
  changeLabel,
  corroborationLabel,
  statusLabel,
  useLang,
  useStrings,
} from "@/i18n";
import { color, radius, size, space, tabularNums } from "@/theme/tokens";

import { Badge, type BadgeTone } from "./Badge";
import { EvidenceLine, evidenceText } from "./EvidenceLine";
import { FreshnessText, freshnessText } from "./FreshnessText";

const FLAG_TONE: Record<IncidentChange, BadgeTone> = {
  new: "accent",
  escalated: "danger",
  newly_corroborated: "warning",
  resolved: "success",
};

/** Area text when there is one, otherwise the centroid (FR-006). */
export function areaOf(incident: Incident): string {
  if (incident.areaText) return incident.areaText;
  if (incident.centroid) {
    return (
      incident.centroid.lat.toFixed(4) + ", " + incident.centroid.lon.toFixed(4)
    );
  }
  return "";
}

/**
 * DESIGN_BRIEF section 3, card anatomy. Shared by the station board and the
 * dashboard so the two cannot drift. One touch target when `onPress` is set;
 * no coloured stripe, because colour alone never carries meaning.
 */
export function IncidentCard({
  incident,
  evidence,
  flags = [],
  onPress,
  children,
}: {
  incident: Incident;
  evidence: Evidence;
  flags?: IncidentChange[];
  onPress?: () => void;
  children?: ReactNode;
}) {
  const t = useStrings();
  const lang = useLang();

  const category = CATEGORY_LABELS[lang][incident.category];
  const area = areaOf(incident);
  const extent =
    incident.spatialExtentM > 0
      ? t.extent + " " + String(incident.spatialExtentM) + " m"
      : "";
  const title = [category, area, extent].filter(Boolean).join(" · ");
  const corroboration = corroborationLabel(incident.corroboration, t);
  const status = statusLabel(incident.status, t);

  const spoken = [
    title,
    evidenceText(evidence, t, corroboration),
    freshnessText(evidence, t),
    status,
    ...flags.map((f) => changeLabel(f, t)),
    String(incident.score),
  ].join(". ");

  const body = (
    <>
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.score}>{incident.score}</Text>
      </View>
      <EvidenceLine evidence={evidence} corroboration={corroboration} />
      <FreshnessText evidence={evidence} />
      <View style={styles.statusRow}>
        <Text style={styles.status}>{status}</Text>
        {flags.map((flag) => (
          <Badge key={flag} label={changeLabel(flag, t)} tone={FLAG_TONE[flag]} />
        ))}
      </View>
      {children}
    </>
  );

  const cardStyle = [
    styles.card,
    incident.status === "resolved" && styles.faded,
  ];

  if (!onPress) {
    return (
      <View style={cardStyle} accessible accessibilityLabel={spoken}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      style={cardStyle}
      accessibilityRole="button"
      accessibilityLabel={spoken}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.borderSubtle,
    borderRadius: radius.card,
    padding: space[3],
    gap: space[1],
  },
  faded: { opacity: 0.55 },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: space[2],
  },
  title: {
    fontSize: size.h3,
    fontWeight: "700",
    color: color.textPrimary,
    flexShrink: 1,
  },
  score: {
    fontSize: size.h3,
    fontWeight: "700",
    color: color.textPrimary,
    ...tabularNums,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: space[2],
  },
  status: {
    fontSize: size.caption,
    fontWeight: "600",
    color: color.textSecondary,
  },
});
