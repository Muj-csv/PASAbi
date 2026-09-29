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
import { cardShadow, color, freshnessStyle, layout, radius, size, space } from "@/theme/tokens";

import { EvidenceLine, evidenceText } from "./EvidenceLine";
import { freshnessText, FreshnessText } from "./FreshnessText";
import { Pictogram } from "./pictograms";
import { Stamp } from "./Stamp";

/**
 * Change-flag colour (DESIGN_BRIEF §5's accent/danger/warning split, applied
 * with the tokens this app actually has). "escalated" is the one flag that
 * is genuinely bad news, so it's the one that gets coralInk — always next to
 * its own word, never colour-alone. The rest stay ballpen (more information
 * arrived) or ink2 ("resolved" fading toward neutral, not blue).
 */
function changeColor(flag: IncidentChange): string {
  if (flag === "escalated") return color.danger;
  if (flag === "resolved") return color.ink2;
  return color.ballpen;
}

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
 * board and the dashboard so the two cannot drift. Ink follows freshness. No
 * headline score: rank order already says how the engine sorted it, and "Why
 * ranked here" on the detail screen explains it.
 *
 * 2026-09-29 reskin: a rounded, shadowed card per incident (radius.card)
 * instead of a continuous flat ledger row — see LEARNING.md. The category
 * icon still gets no colour-coding by severity: that's the one thing kept
 * from the reference image that this app can't copy (ISO 22324 / PAGASA hue
 * rule, tokens.ts file header).
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
  const changeWords = flags.map((f) => changeLabel(f, t)).join(" · ");

  const spoken = [
    [category, area].filter(Boolean).join(", "),
    evidenceText(evidence, t, corroboration),
    freshnessText(evidence, t),
    status,
    changeWords,
  ]
    .filter(Boolean)
    .join(". ");

  const body = (
    <>
      <View style={styles.badge}>
        <Pictogram category={incident.category} size={20} color={color.ink} />
      </View>

      <View style={styles.content}>
        <View style={styles.headRow}>
          <View style={styles.catRow}>
            <Text numberOfLines={1} style={[styles.category, { color: rowInk }]}>
              {category}
            </Text>
            <Text style={[styles.rank, { color: rankInk }]}>{rankText}</Text>
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
        {flags.length > 0 ? (
          <Text style={styles.change}>
            {flags.map((f, i) => (
              <Text key={f} style={{ color: changeColor(f) }}>
                {i > 0 ? " · " : ""}
                {changeLabel(f, t)}
              </Text>
            ))}
          </Text>
        ) : null}
      </View>
    </>
  );

  const tinted = flags.length > 0 && styles.rowChanged;

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
    padding: space[3],
    gap: space[3],
    alignItems: "flex-start",
    ...cardShadow,
  },
  rowChanged: { backgroundColor: color.ballpenTint, borderColor: color.ballpen },
  rowPressed: { backgroundColor: color.surface },
  badge: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  rank: {
    fontFamily: "Doto_800ExtraBold",
    fontSize: 15,
    lineHeight: 18,
  },
  content: { flex: 1, gap: space[1] / 2 },
  headRow: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: space[2] },
  catRow: { flexDirection: "row", alignItems: "baseline", gap: space[2] },
  category: { fontSize: size.heading.fontSize, fontWeight: "600", color: color.ink },
  place: { fontSize: size.body, color: color.ink2, flexShrink: 1 },
  statusRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: space[2] },
  status: { fontSize: size.caption, fontWeight: "600", color: color.ink2 },
  right: { alignItems: "flex-end", gap: space[1] },
  change: { fontSize: size.caption, fontWeight: "700" },
});
