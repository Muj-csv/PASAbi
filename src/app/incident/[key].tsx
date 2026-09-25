import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  compute,
  type Incident,
  type Observation,
  type StatusAction,
} from "@pasabi/core";

import { CATEGORY_LABELS, useLang, useStrings } from "@/i18n";
import { getDeviceId } from "@/storage/device";
import { addStatusObservation, loadObservations } from "@/storage/observations";

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function shortTime(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleString();
}

function signed(value: number): string {
  return value > 0 ? "+" + String(value) : String(value);
}

/** FR-006 "why ranked here" and FR-008 acknowledge / resolve. */
export default function IncidentDetail() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const t = useStrings();
  const lang = useLang();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [members, setMembers] = useState<Observation[]>([]);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const observations = await loadObservations();
    const found =
      compute(observations, nowSeconds()).find((i) => i.key === key) ?? null;
    setIncident(found);
    setMembers(
      found
        ? observations.filter((o) => found.observationIds.includes(o.id))
        : [],
    );
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

  if (!incident) {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.muted}>{t.noIncidents}</Text>
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

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.h1}>{CATEGORY_LABELS[lang][incident.category]}</Text>
      <Text style={styles.muted}>
        {t.firstSeen} {shortTime(incident.firstSeen)} · {t.lastSeen}{" "}
        {shortTime(incident.lastSeen)}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.whyRanked}</Text>
        {terms.map((term) => (
          <View key={term.label} style={styles.termRow}>
            <Text style={styles.line}>{term.label}</Text>
            <Text style={styles.termValue}>{signed(term.value)}</Text>
          </View>
        ))}
        <View style={styles.termRow}>
          <Text style={styles.total}>{t.scoreTotal}</Text>
          <Text style={styles.total}>{incident.score}</Text>
        </View>
        {incident.score !== b.total ? (
          <Text style={styles.hint}>{t.scoreFloored}</Text>
        ) : null}
      </View>

      <View style={styles.row}>
        <Pressable
          style={[styles.primary, busy && styles.primaryOff]}
          disabled={busy || incident.status !== "open"}
          onPress={() => void act("ACK")}
        >
          <Text style={styles.primaryText}>{t.acknowledge}</Text>
        </Pressable>
        <Pressable
          style={[styles.danger, busy && styles.primaryOff]}
          disabled={busy || incident.status === "resolved"}
          onPress={() => void act("RESOLVE")}
        >
          <Text style={styles.primaryText}>{t.resolve}</Text>
        </Pressable>
      </View>

      <Text style={styles.cardTitle}>{t.observationsInIncident}</Text>
      {members
        .slice()
        .sort((a, o) => o.created_at - a.created_at)
        .map((o) => (
          <View key={o.id} style={styles.card}>
            <Text style={styles.line}>{shortTime(o.created_at)}</Text>
            {o.note ? <Text style={styles.line}>{o.note}</Text> : null}
            {o.area_text ? (
              <Text style={styles.muted}>{o.area_text}</Text>
            ) : null}
            {typeof o.people === "number" ? (
              <Text style={styles.muted}>
                {t.peopleAffectedShort}: {o.people}
              </Text>
            ) : null}
            <Text style={styles.muted}>{o.own ? t.mine : t.carried}</Text>
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12, paddingBottom: 48 },
  h1: { fontSize: 22, fontWeight: "700" },
  muted: { fontSize: 13, color: "#5a6673" },
  hint: { fontSize: 12, color: "#8a6d1f" },
  line: { fontSize: 15 },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  card: {
    borderWidth: 1,
    borderColor: "#d8dde3",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  termRow: { flexDirection: "row", justifyContent: "space-between" },
  termValue: { fontSize: 15 },
  total: { fontSize: 17, fontWeight: "700" },
  primary: {
    backgroundColor: "#1566c0",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  primaryOff: { opacity: 0.5 },
  danger: {
    backgroundColor: "#1c6b3c",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  primaryText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
});
