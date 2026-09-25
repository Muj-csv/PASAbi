import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  changesSince,
  compute,
  safeCheckinCounts,
  snapshotOf,
  type Incident,
  type IncidentChange,
  type SafeCheckinCounts,
} from "@pasabi/core";

import { CATEGORY_LABELS, plural, useLang, useStrings } from "@/i18n";
import { loadObservations } from "@/storage/observations";
import {
  disableStation,
  enableStation,
  loadSnapshot,
  loadStation,
  saveSnapshot,
} from "@/storage/station";

type Strings = ReturnType<typeof useStrings>;

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function shortTime(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleString();
}

function flagLabel(flag: IncidentChange, t: Strings): string {
  if (flag === "new") return t.changeNew;
  if (flag === "escalated") return t.changeEscalated;
  if (flag === "newly_corroborated") return t.changeCorroborated;
  return t.changeResolved;
}

function flagColor(flag: IncidentChange): { backgroundColor: string } {
  if (flag === "new") return { backgroundColor: "#1566c0" };
  if (flag === "escalated") return { backgroundColor: "#b3261e" };
  if (flag === "newly_corroborated") return { backgroundColor: "#8a6d1f" };
  return { backgroundColor: "#1c6b3c" };
}

function corroborationLabel(incident: Incident, t: Strings): string {
  if (incident.corroboration === "strongly_corroborated") {
    return t.stronglyCorroborated;
  }
  if (incident.corroboration === "corroborated") return t.corroborated;
  return t.single;
}

function statusLabel(incident: Incident, t: Strings): string {
  if (incident.status === "resolved") return t.statusResolved;
  if (incident.status === "acknowledged") return t.statusAcknowledged;
  return t.statusOpen;
}

/** FR-006 to FR-008: the board a barangay operator actually works from. */
export default function Station() {
  const t = useStrings();
  const lang = useLang();
  const router = useRouter();

  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [safe, setSafe] = useState<SafeCheckinCounts>({});
  const [changes, setChanges] = useState<Map<string, IncidentChange[]>>(
    new Map(),
  );
  const [seenAt, setSeenAt] = useState<number | null>(null);

  const reload = useCallback(async () => {
    const observations = await loadObservations();
    const now = nowSeconds();
    const current = compute(observations, now);
    const snapshot = await loadSnapshot();

    setIncidents(current);
    setSafe(safeCheckinCounts(observations));
    setChanges(changesSince(snapshot, current));
    setSeenAt(snapshot ? snapshot.takenAt : null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const settings = await loadStation();
        setUnlocked(settings.enabled);
        if (settings.enabled) await reload();
      })();
    }, [reload]),
  );

  const unlock = async (): Promise<void> => {
    const ok = await enableStation(pin);
    setPinError(!ok);
    if (ok) {
      setPin("");
      setUnlocked(true);
      await reload();
    }
  };

  const leave = async (): Promise<void> => {
    await disableStation();
    setUnlocked(false);
    router.replace("/");
  };

  const markSeen = async (): Promise<void> => {
    await saveSnapshot(snapshotOf(incidents, nowSeconds()));
    await reload();
  };

  if (!unlocked) {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.h1}>{t.stationMode}</Text>
        <Text style={styles.muted}>{t.stationLocked}</Text>
        <TextInput
          value={pin}
          onChangeText={(v) => {
            setPin(v.replace(/[^0-9]/g, "").slice(0, 8));
            setPinError(false);
          }}
          keyboardType="number-pad"
          secureTextEntry
          style={styles.input}
        />
        <Text style={styles.hint}>{t.stationPinHint}</Text>
        {pinError ? <Text style={styles.error}>{t.stationWrongPin}</Text> : null}
        <Pressable
          style={[styles.primary, pin.length < 4 && styles.primaryOff]}
          disabled={pin.length < 4}
          onPress={() => void unlock()}
        >
          <Text style={styles.primaryText}>{t.stationUnlock}</Text>
        </Pressable>
        <Link href="/" style={styles.link}>
          {t.newObservation}
        </Link>
      </ScrollView>
    );
  }

  const safeAreas = Object.entries(safe).sort((a, b) =>
    a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0,
  );

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.h1}>{t.board}</Text>
      <Text style={styles.muted}>
        {plural(incidents.length, t.incidentOne, t.incidentMany)}
        {seenAt === null ? "" : " · " + t.seenAt + " " + shortTime(seenAt)}
      </Text>
      {seenAt === null ? <Text style={styles.hint}>{t.seenNever}</Text> : null}

      <View style={styles.row}>
        <Pressable style={styles.primary} onPress={() => void markSeen()}>
          <Text style={styles.primaryText}>{t.markSeen}</Text>
        </Pressable>
        <Pressable style={styles.ghost} onPress={() => void leave()}>
          <Text style={styles.ghostText}>{t.stationExit}</Text>
        </Pressable>
      </View>

      {incidents.length === 0 ? (
        <Text style={styles.muted}>{t.noIncidents}</Text>
      ) : null}

      {incidents.map((incident) => {
        const flags = changes.get(incident.key) ?? [];
        return (
          <Pressable
            key={incident.key}
            style={[styles.card, incident.status === "resolved" && styles.faded]}
            onPress={() =>
              router.push({
                pathname: "/incident/[key]",
                params: { key: incident.key },
              })
            }
          >
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>
                {CATEGORY_LABELS[lang][incident.category]}
              </Text>
              <Text style={styles.score}>{incident.score}</Text>
            </View>

            {flags.length > 0 ? (
              <View style={styles.flagRow}>
                {flags.map((flag) => (
                  <Text key={flag} style={[styles.flag, flagColor(flag)]}>
                    {flagLabel(flag, t)}
                  </Text>
                ))}
              </View>
            ) : null}

            <Text style={styles.line}>
              {corroborationLabel(incident, t)} ·{" "}
              {plural(incident.independentReporters, t.reporterOne, t.reporterMany)}
              {incident.peopleAffected > 0
                ? " · " + t.scorePeople + " " + String(incident.peopleAffected)
                : ""}
            </Text>

            <Text style={styles.muted}>
              {incident.areaText ??
                (incident.centroid
                  ? incident.centroid.lat.toFixed(4) +
                    ", " +
                    incident.centroid.lon.toFixed(4)
                  : "")}
              {incident.spatialExtentM > 0
                ? " · " + t.extent + " " + String(incident.spatialExtentM) + " m"
                : ""}
            </Text>

            <Text style={styles.muted}>
              {t.firstSeen} {shortTime(incident.firstSeen)} · {t.lastSeen}{" "}
              {shortTime(incident.lastSeen)}
            </Text>

            <Text style={styles.status}>{statusLabel(incident, t)}</Text>
          </Pressable>
        );
      })}

      {safeAreas.length > 0 ? (
        <View style={styles.safeCard}>
          <Text style={styles.cardTitle}>{t.safePanel}</Text>
          {safeAreas.map(([area, count]) => (
            <Text key={area} style={styles.line}>
              {area}: {count}
            </Text>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12, paddingBottom: 48 },
  h1: { fontSize: 22, fontWeight: "700" },
  muted: { fontSize: 13, color: "#5a6673" },
  hint: { fontSize: 13, color: "#8a6d1f" },
  error: { fontSize: 14, color: "#b3261e", fontWeight: "600" },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  input: {
    borderWidth: 1,
    borderColor: "#c3cad2",
    borderRadius: 8,
    padding: 12,
    fontSize: 20,
    letterSpacing: 6,
  },
  primary: {
    backgroundColor: "#1566c0",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  primaryOff: { backgroundColor: "#9bb4d0" },
  primaryText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  ghost: {
    backgroundColor: "#e8ecf1",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  ghostText: { color: "#333b45", fontWeight: "700" },
  card: {
    borderWidth: 1,
    borderColor: "#d8dde3",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  faded: { opacity: 0.55 },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 17, fontWeight: "700" },
  score: { fontSize: 20, fontWeight: "700", color: "#0f4c92" },
  flagRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  flag: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  line: { fontSize: 14 },
  status: { fontSize: 13, fontWeight: "600", color: "#333b45" },
  safeCard: {
    borderWidth: 1,
    borderColor: "#cfe3d4",
    backgroundColor: "#f2f8f4",
    borderRadius: 10,
    padding: 12,
    gap: 3,
  },
  link: { fontSize: 16, color: "#1566c0", paddingVertical: 8 },
});
