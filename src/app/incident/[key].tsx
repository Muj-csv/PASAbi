import { Link, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  compute,
  evidenceOf,
  gapsFor,
  type Evidence,
  type Gaps,
  type Incident,
  type StatusAction,
} from "@pasabi/core";

import { Button } from "@/components/Button";
import { EvidenceLine } from "@/components/EvidenceLine";
import { FreshnessText } from "@/components/FreshnessText";
import { areaOf } from "@/components/IncidentCard";
import { KnownUnknownList } from "@/components/KnownUnknownList";
import { Notice } from "@/components/Notice";
import { Pictogram } from "@/components/pictograms";
import { Stamp } from "@/components/Stamp";
import { StatusBand } from "@/components/StatusBand";
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
 * Order per DESIGN_BRIEF section 12: header, evidence, actions, known /
 * not yet reported, why ranked, timeline. "How do we know" decides the
 * action, so it comes first, and the score is never a headline.
 */
export default function IncidentDetail() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const t = useStrings();
  const lang = useLang();

  const [loaded, setLoaded] = useState(false);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [gaps, setGaps] = useState<Gaps | null>(null);
  const [busy, setBusy] = useState(false);
  const [justAcked, setJustAcked] = useState(false);

  const reload = useCallback(async () => {
    const observations = await loadObservations();
    const now = nowSeconds();
    const incidents = compute(observations, now);
    const found = incidents.find((i) => i.key === key) ?? null;
    setIncident(found);
    setEvidence(found ? evidenceOf(found, observations, now) : null);
    // ARCHITECTURE 3a: gaps for the incident being viewed only.
    setGaps(found ? gapsFor(found, incidents, observations) : null);
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
      if (action === "ACK") setJustAcked(true);
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
      <View style={styles.page}>
        <StatusBand mode="station" label={t.board} />
        <ScrollView contentContainerStyle={styles.form}>
          <Notice message={t.incidentChanged} tone="warning" />
          <Link href="/station" style={styles.link}>
            {t.board}
          </Link>
        </ScrollView>
      </View>
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
  const resolved = incident.status === "resolved";

  return (
    <View style={styles.page}>
      <StatusBand mode="station" label={t.board} />
      <ScrollView contentContainerStyle={styles.form}>
        {/* 1. Header */}
        <View style={styles.section}>
          <View style={styles.headRow}>
            <Pictogram category={incident.category} size={30} color={color.ink} />
            <Text style={styles.h2}>{CATEGORY_LABELS[lang][incident.category]}</Text>
          </View>
          {area ? <Text style={styles.muted}>{area}</Text> : null}
          {incident.spatialExtentM > 0 ? (
            <Text style={styles.muted}>
              {t.extent} {incident.spatialExtentM} m
            </Text>
          ) : null}
          <Text style={styles.status}>{statusLabel(incident.status, t)}</Text>
          {incident.status === "acknowledged" ? (
            <Stamp
              label={t.statusAcknowledged}
              ink="coralInk"
              seed={incident.key}
              justEarned={justAcked}
              large
            />
          ) : null}
          {resolved ? (
            <Stamp label={t.statusResolved} ink="faded" seed={incident.key} large />
          ) : null}
          <FreshnessText evidence={evidence} />
        </View>

        {/* 2. Evidence */}
        <View style={styles.section}>
          <EvidenceLine
            evidence={evidence}
            people={incident.peopleAffected}
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
              variant="secondary"
              onPress={() => void act("RESOLVE")}
              busy={busy}
              busyLabel={t.saving}
            />
          ) : null}
        </View>

        {/* 4. Known / not yet reported (BR-013) */}
        {gaps ? (
          <View style={styles.card}>
            <KnownUnknownList gaps={gaps} />
          </View>
        ) : null}

        {/* 5. Why ranked here */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.paper },
  form: {
    padding: space[4],
    gap: space[4],
    paddingBottom: space[7],
  },
  section: { gap: space[1] },
  headRow: { flexDirection: "row", alignItems: "center", gap: space[2] },
  h2: { fontSize: size.title.fontSize, fontWeight: "700", color: color.ink },
  status: { fontSize: size.body, fontWeight: "600", color: color.ink2 },
  muted: { fontSize: size.caption, color: color.ink2 },
  line: { fontSize: size.body, color: color.ink },
  number: { fontSize: size.body, color: color.ink, ...tabularNums },
  row: { flexDirection: "row", gap: space[2], flexWrap: "wrap" },
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.control,
    padding: space[3],
    gap: space[1],
  },
  cardTitle: { fontSize: size.body, fontWeight: "700", color: color.ink },
  termRow: { flexDirection: "row", justifyContent: "space-between" },
  total: {
    fontSize: size.heading.fontSize,
    fontWeight: "700",
    color: color.ink,
    ...tabularNums,
  },
  link: { fontSize: size.body, color: color.ballpen, paddingVertical: space[2] },
});
