import { Link, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  compute,
  evidenceOf,
  type Evidence,
  type Incident,
  type StatusAction,
} from "@pasabi/core";

import { Button } from "@/components/Button";
import { EvidenceLine } from "@/components/EvidenceLine";
import { FreshnessText } from "@/components/FreshnessText";
import { areaOf } from "@/components/IncidentCard";
import { Notice } from "@/components/Notice";
import { TimelineRow } from "@/components/TimelineRow";
import {
  CATEGORY_LABELS,
  corroborationLabel,
  statusLabel,
  useLang,
  useStrings,
} from "@/i18n";
import { getDeviceId } from "@/storage/device";
import { addStatusObservation, loadObservations } from "@/storage/observations";
import { color, radius, size, space, tabularNums } from "@/theme/tokens";

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function shortTime(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleString();
}

function signed(value: number): string {
  return value > 0 ? "+" + String(value) : String(value);
}

/**
 * FR-006 "why ranked here", FR-008 acknowledge / resolve, FR-014 evidence.
 * Order per DESIGN_BRIEF section 3: header, evidence, actions, why ranked,
 * timeline. "How do we know" decides the action, so it comes first.
 */
export default function IncidentDetail() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const t = useStrings();
  const lang = useLang();

  const [loaded, setLoaded] = useState(false);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const observations = await loadObservations();
    const now = nowSeconds();
    const found = compute(observations, now).find((i) => i.key === key) ?? null;
    setIncident(found);
    setEvidence(found ? evidenceOf(found, observations, now) : null);
    setLoaded(true);
  }, [key]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const act = async (action: StatusAction): Promise<void> => {
    if (!incident) return;
    setBusy(true);
    try {
      const deviceId = await getDeviceId();
      await addStatusObservation(action, incident.observationIds, deviceId);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return null;

  if (!incident || !evidence) {
    // The key belongs to a group that was evicted or regrouped (keys are not
    // stable, Snapshot.ts), so say that rather than "no incidents".
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <Notice message={t.incidentChanged} tone="warning" />
        <Link href="/station" style={styles.link}>
          {t.board}
        </Link>
      </ScrollView>
    );
  }

  const b = incident.breakdown;
  const terms: { label: string; value: number }[] = [
    { label: t.scoreBase, value: b.base },
    { label: t.scoreCorroboration, value: b.corroboration },
    { label: t.scorePeople, value: b.people },
    { label: t.scoreUnacknowledged, value: b.unacknowledged },
    { label: t.scoreStaleness, value: b.staleness },
  ];
  const area = areaOf(incident);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      {/* 1. Header */}
      <View style={styles.section}>
        <Text style={styles.h2}>
          {CATEGORY_LABELS[lang][incident.category]}
        </Text>
        {area ? <Text style={styles.muted}>{area}</Text> : null}
        {incident.spatialExtentM > 0 ? (
          <Text style={styles.muted}>
            {t.extent} {incident.spatialExtentM} m
          </Text>
        ) : null}
        <Text style={styles.status}>{statusLabel(incident.status, t)}</Text>
        <FreshnessText evidence={evidence} />
      </View>

      {/* 2. Evidence */}
      <View style={styles.section}>
        <EvidenceLine
          evidence={evidence}
          corroboration={corroborationLabel(incident.corroboration, t)}
        />
        <Text style={styles.muted}>
          {t.firstSeen} {shortTime(evidence.firstSeen)} · {t.lastSeen}{" "}
          {shortTime(evidence.lastSeen)}
        </Text>
      </View>

      {/* 3. Actions: only what is possible now, never a greyed-out button. */}
      <View style={styles.row}>
        {incident.status === "open" ? (
          <Button
            label={t.acknowledge}
            onPress={() => void act("ACK")}
            busy={busy}
            busyLabel={t.saving}
          />
        ) : null}
        {incident.status !== "resolved" ? (
          <Button
            label={t.resolve}
            variant="dangerSecondary"
            onPress={() => void act("RESOLVE")}
            busy={busy}
            busyLabel={t.saving}
          />
        ) : null}
      </View>

      {/* 5. Why ranked here (4, known / not yet reported, lands in R4) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.whyRanked}</Text>
        {terms.map((term) => (
          <View key={term.label} style={styles.termRow}>
            <Text style={styles.line}>{term.label}</Text>
            <Text style={styles.number}>{signed(term.value)}</Text>
          </View>
        ))}
        <View style={styles.termRow}>
          <Text style={styles.total}>{t.scoreTotal}</Text>
          <Text style={styles.total}>{incident.score}</Text>
        </View>
        {incident.score !== b.total ? (
          <Text style={styles.muted}>{t.scoreFloored}</Text>
        ) : null}
      </View>

      {/* 6. Timeline */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.timeline}</Text>
        {evidence.timeline.map((entry) => (
          <TimelineRow key={entry.id} entry={entry} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: space[4],
    gap: space[4],
    paddingBottom: space[7],
  },
  section: { gap: space[1] },
  h2: { fontSize: size.h2, fontWeight: "700", color: color.textPrimary },
  status: { fontSize: size.body, fontWeight: "600", color: color.textPrimary },
  muted: { fontSize: size.caption, color: color.textSecondary },
  line: { fontSize: size.body, color: color.textPrimary },
  number: { fontSize: size.body, color: color.textPrimary, ...tabularNums },
  row: { flexDirection: "row", gap: space[2], flexWrap: "wrap" },
  card: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.borderSubtle,
    borderRadius: radius.card,
    padding: space[3],
    gap: space[1],
  },
  cardTitle: { fontSize: size.body, fontWeight: "700", color: color.textPrimary },
  termRow: { flexDirection: "row", justifyContent: "space-between" },
  total: {
    fontSize: size.h3,
    fontWeight: "700",
    color: color.textPrimary,
    ...tabularNums,
  },
  link: { fontSize: size.body, color: color.accent, paddingVertical: space[2] },
});
