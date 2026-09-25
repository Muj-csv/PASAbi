import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { compute, type Incident, type Observation } from "@pasabi/core";

import { CATEGORY_LABELS, plural, useLang, useStrings } from "@/i18n";
import { deleteOwnObservation, loadObservations } from "@/storage/observations";
import { uploadPending } from "@/storage/uplink";

function when(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleString();
}

/** FR-011: everything this phone carries, and delete for what it created. */
export default function MyData() {
  const t = useStrings();
  const lang = useLang();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [uploadNote, setUploadNote] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const stored = await loadObservations();
    setObservations(stored);
    setIncidents(compute(stored, Math.floor(Date.now() / 1000)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const remove = (id: string): void => {
    Alert.alert(t.deleteAction, t.deleteNote, [
      { text: t.back, style: "cancel" },
      {
        text: t.deleteAction,
        style: "destructive",
        onPress: () => {
          void deleteOwnObservation(id).then(reload);
        },
      },
    ]);
  };

  const sorted = [...observations].sort((a, b) => b.created_at - a.created_at);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.summary}>
        {t.carrying}{" "}
        {plural(observations.length, t.observationOne, t.observationMany)} ·{" "}
        {plural(incidents.length, t.incidentOne, t.incidentMany)}
      </Text>

      <Pressable
        style={styles.upload}
        onPress={() => {
          void (async () => {
            const result = await uploadPending();
            setUploadNote(
              !result.attempted
                ? t.uploadOffline
                : result.error !== null
                  ? t.loadError + " " + result.error
                  : String(result.uploaded) +
                    " " +
                    t.uploadedCount +
                    ", " +
                    String(result.pending) +
                    " " +
                    t.pendingCount,
            );
            await reload();
          })();
        }}
      >
        <Text style={styles.uploadText}>{t.uploadNow}</Text>
      </Pressable>
      {uploadNote ? <Text style={styles.muted}>{uploadNote}</Text> : null}

      <Link href="/" style={styles.link}>
        {t.newObservation}
      </Link>

      <Link href="/dashboard" style={styles.link}>
        {t.dashboard}
      </Link>

      {sorted.length === 0 ? (
        <Text style={styles.muted}>{t.empty}</Text>
      ) : null}

      {sorted.map((o) => (
        <View key={o.id} style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>
              {o.category
                ? CATEGORY_LABELS[lang][o.category]
                : (o.action ?? o.type)}
            </Text>
            <Text style={o.own ? styles.badgeMine : styles.badge}>
              {o.own ? t.mine : t.carried}
            </Text>
          </View>
          <Text style={styles.muted}>{when(o.created_at)}</Text>
          {o.note ? <Text style={styles.note}>{o.note}</Text> : null}
          {o.area_text ? (
            <Text style={styles.muted}>{o.area_text}</Text>
          ) : null}
          {typeof o.people === "number" ? (
            <Text style={styles.muted}>
              {t.peopleAffectedShort}: {o.people}
            </Text>
          ) : null}
          {o.own ? (
            <Pressable onPress={() => remove(o.id)} style={styles.delete}>
              <Text style={styles.deleteText}>{t.deleteAction}</Text>
            </Pressable>
          ) : null}
        </View>
      ))}

      <Text style={styles.footnote}>{t.deleteNote}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12, paddingBottom: 48 },
  summary: { fontSize: 18, fontWeight: "700" },
  link: { fontSize: 16, color: "#1566c0", paddingVertical: 4 },
  upload: {
    backgroundColor: "#1566c0",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  uploadText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
  card: {
    borderWidth: 1,
    borderColor: "#d8dde3",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  badge: { fontSize: 12, color: "#5a6673" },
  badgeMine: { fontSize: 12, color: "#1566c0", fontWeight: "700" },
  note: { fontSize: 15 },
  muted: { fontSize: 13, color: "#5a6673" },
  delete: { paddingVertical: 8 },
  deleteText: { color: "#b3261e", fontWeight: "700" },
  footnote: { fontSize: 12, color: "#5a6673", marginTop: 8 },
});
