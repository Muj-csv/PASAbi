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
import { color, freshnessStyle, layout, size, space } from "@/theme/tokens";

import { EvidenceLine, evidenceText } from "./EvidenceLine";
import { freshnessText, FreshnessText } from "./FreshnessText";
import { Pictogram } from "./pictograms";
import { Stamp } from "./Stamp";

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
 * A ledger row (DESIGN_BRIEF section 12, `LedgerRow`), shared by the station
 * board and the dashboard so the two cannot drift. Radius 0, hairline below,
 * ink follows freshness. No headline score: rank order already says how the
 * engine sorted it, and "Why ranked here" on the detail screen explains it.
 */
export function IncidentCard({
  incident,
  evidence,
  flags = [],
  rank = null,
  onPress,
  children,
}: {
  incident: Incident;
  evidence: Evidence;
  flags?: IncidentChange[];
  /** 1-based rank among open incidents; omit or null for resolved rows. */
  rank?: number | null;
  onPress?: () => void;
  children?: ReactNode;
}) {
  const t = useStrings();
  const lang = useLang();

  const category = CATEGORY_LABELS[lang][incident.category];
  const area = areaOf(incident);
  const corroboration = corroborationLabel(incident.corroboration, t);
  const status = statusLabel(incident.status, t);
  const resolved = incident.status === "resolved";
  const rowInk = resolved ? color.ink3 : color.ink;
  const rowSub = resolved ? color.ink3 : freshnessStyle(evidence.freshness).sub;
  const rankInk =
    evidence.freshness === "stale" || resolved ? color.ink3 : color.ballpen;
  const rankText = resolved || rank === null ? "—" : String(rank).padStart(2, "0");
  const changeText = flags.map((f) => changeLabel(f, t)).join(" · ");

  const spoken = [
    [category, area].filter(Boolean).join(", "),
    evidenceText(evidence, t, corroboration),
    freshnessText(evidence, t),
    status,
    changeText,
  ]
    .filter(Boolean)
    .join(". ");

  const body = (
    <>
      <Text style={[styles.rank, { color: rankInk }]}>{rankText}</Text>

      <View style={styles.content}>
        <View style={styles.headRow}>
          <View style={styles.catRow}>
            <Pictogram category={incident.category} size={22} color={rowInk} />
            <Text numberOfLines={1} style={[styles.category, { color: rowInk }]}>
              {category}
            </Text>
          </View>
          {area ? (
            <Text numberOfLines={1} style={[styles.place, { color: rowSub }]}>
              {area}
            </Text>
          ) : null}
        </View>

        <EvidenceLine
          evidence={evidence}
          people={incident.peopleAffected}
          color={rowSub}
        />

        <View style={styles.statusRow}>
          <Text style={styles.status}>{status}</Text>
          {incident.status === "acknowledged" ? (
            <Stamp label={t.statusAcknowledged} ink="coralInk" seed={incident.key} />
          ) : null}
          {resolved ? (
            <Stamp label={t.statusResolved} ink="faded" seed={incident.key} />
          ) : null}
        </View>

        {children}
      </View>

      <View style={styles.right}>
        <FreshnessText evidence={evidence} />
        {changeText ? <Text style={styles.change}>{changeText}</Text> : null}
      </View>
    </>
  );

  const tinted = changeText.length > 0 && styles.rowChanged;

  if (!onPress) {
    return (
      <View style={[styles.row, tinted]} accessible accessibilityLabel={spoken}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, tinted, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={spoken}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    minHeight: layout.rowMinHeight,
    paddingVertical: space[3],
    paddingRight: layout.sideMargin,
    paddingLeft: space[2],
    gap: space[3],
    borderBottomWidth: 1,
    borderBottomColor: color.rule,
    backgroundColor: color.paper,
    alignItems: "flex-start",
  },
  rowChanged: { backgroundColor: color.ballpenTint },
  rowPressed: { backgroundColor: color.surface },
  rank: {
    width: layout.rankGutter,
    textAlign: "center",
    fontFamily: "Doto_800ExtraBold",
    fontSize: 20,
    lineHeight: 25,
  },
  content: { flex: 1, gap: space[1] / 2 },
  headRow: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: space[2] },
  catRow: { flexDirection: "row", alignItems: "center", gap: space[2] },
  category: { fontSize: size.heading.fontSize, fontWeight: "600", color: color.ink },
  place: { fontSize: size.body, color: color.ink2, flexShrink: 1 },
  statusRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: space[2] },
  status: { fontSize: size.caption, fontWeight: "600", color: color.ink2 },
  right: { alignItems: "flex-end", gap: space[1] },
  change: { fontSize: size.caption, fontWeight: "700", color: color.ballpen },
});
