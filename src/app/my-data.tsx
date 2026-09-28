import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  compute,
  propagationFor,
  type Incident,
  type Observation,
  type Propagation,
} from "@pasabi/core";

import { Button } from "@/components/Button";
import { StatusBand } from "@/components/StatusBand";
import { StatusSteps } from "@/components/StatusSteps";
import { CATEGORY_LABELS, plural, useLang, useStrings } from "@/i18n";
import { deleteOwnObservation, loadObservations } from "@/storage/observations";
import { uploadPending } from "@/storage/uplink";
import { color, radius, size, space, tabularNums } from "@/theme/tokens";

function when(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleString();
}

/**
 * FR-011: everything this phone carries, and delete for what it created.
 * FR-015: each own observation shows what this phone knows about where it
 * went (BR-015), and nothing more.
 */
export default function MyData() {
  const t = useStrings();
  const lang = useLang();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [status, setStatus] = useState<Map<string, Propagation>>(new Map());
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const stored = await loadObservations();
    const current = compute(stored, Math.floor(Date.now() / 1000));
    setObservations(stored);
    setIncidents(current);
    setStatus(propagationFor(stored, current));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const upload = async (): Promise<void> => {
    setUploading(true);
    try {
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
    } finally {
      setUploading(false);
    }
  };

  // Confirmation is inline, not Alert.alert: React Native Web has no Alert,
  // so a dialog-based delete silently did nothing on the web build.
  const remove = async (id: string): Promise<void> => {
    setConfirming(null);
    await deleteOwnObservation(id);
    await reload();
  };

  const sorted = [...observations].sort((a, b) => b.created_at - a.created_at);

  return (
    <View style={styles.page}>
      <StatusBand mode="resident" label={t.bandResident} />
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.summary}>
          {t.carrying}{" "}
          {plural(observations.length, t.observationOne, t.observationMany)} ·{" "}
          {plural(incidents.length, t.incidentOne, t.incidentMany)}
        </Text>

        <Button
          label={t.uploadNow}
          onPress={() => void upload()}
          busy={uploading}
          busyLabel={t.saving}
        />
        {uploadNote ? <Text style={styles.muted}>{uploadNote}</Text> : null}

        <View style={styles.links}>
          <Link href="/" style={styles.link}>
            {t.newObservation}
          </Link>
          <Link href="/dashboard" style={styles.link}>
            {t.dashboard}
          </Link>
        </View>

        {sorted.length === 0 ? (
          <Text style={styles.muted}>{t.empty}</Text>
        ) : null}

        {sorted.map((o) => {
          const own = status.get(o.id);
          return (
            <View key={o.id} style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>
                  {o.category
                    ? CATEGORY_LABELS[lang][o.category]
                    : o.action === "RESOLVE"
                      ? t.statusResolved
                      : o.action === "ACK"
                        ? t.statusAcknowledged
                        : o.type}
                </Text>
                <Text style={own ? styles.mine : styles.carried}>
                  {own ? t.mine : t.carried}
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

              {own ? <StatusSteps status={own} seed={o.id} footer={false} /> : null}

              {own && confirming !== o.id ? (
                <View style={styles.row}>
                  <Button
                    label={t.deleteAction}
                    variant="ink"
                    onPress={() => setConfirming(o.id)}
                  />
                </View>
              ) : null}
              {own && confirming === o.id ? (
                <View style={styles.confirm}>
                  <Text style={styles.note}>{t.deleteNote}</Text>
                  <View style={styles.row}>
                    <Button
                      label={t.deleteAction}
                      variant="ink"
                      onPress={() => void remove(o.id)}
                    />
                    <Button
                      label={t.cancel}
                      variant="quiet"
                      onPress={() => setConfirming(null)}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}

        {/* BR-015 footer, once for the whole list rather than on every card. */}
        {status.size > 0 ? (
          <Text style={styles.muted}>{t.stepFooter}</Text>
        ) : null}
        <Text style={styles.muted}>{t.deleteNote}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.paper },
  form: { padding: space[4], gap: space[3], paddingBottom: space[7] },
  summary: {
    fontSize: size.title.fontSize,
    fontWeight: "700",
    color: color.ink,
    ...tabularNums,
  },
  links: { flexDirection: "row", flexWrap: "wrap", gap: space[4] },
  link: { fontSize: size.body, color: color.ballpen, paddingVertical: space[2] },
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.control,
    padding: space[3],
    gap: space[2],
  },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: size.body, fontWeight: "700", color: color.ink },
  mine: { fontSize: size.caption, fontWeight: "700", color: color.ballpen },
  carried: { fontSize: size.caption, color: color.ink2 },
  note: { fontSize: size.body, color: color.ink },
  muted: { fontSize: size.caption, color: color.ink2 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  confirm: { gap: space[2] },
});
