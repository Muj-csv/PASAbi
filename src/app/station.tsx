import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  changesSince,
  compute,
  evidenceOf,
  safeCheckinCounts,
  snapshotOf,
  type Evidence,
  type Incident,
  type IncidentChange,
  type SafeCheckinCounts,
} from "@pasabi/core";

import { Button } from "@/components/Button";
import { IncidentCard } from "@/components/IncidentCard";
import { fill, plural, useStrings } from "@/i18n";
import { loadObservations } from "@/storage/observations";
import {
  disableStation,
  enableStation,
  loadSnapshot,
  loadStation,
  saveSnapshot,
} from "@/storage/station";
import { color, radius, size, space, tabularNums } from "@/theme/tokens";

const PIN_MIN = 4;

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function shortTime(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleString();
}

/** FR-006 to FR-008, FR-014: the board a barangay operator works from. */
export default function Station() {
  const t = useStrings();
  const router = useRouter();

  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [evidence, setEvidence] = useState<Map<string, Evidence>>(new Map());
  const [safe, setSafe] = useState<SafeCheckinCounts>({});
  const [changes, setChanges] = useState<Map<string, IncidentChange[]>>(
    new Map(),
  );
  const [seenAt, setSeenAt] = useState<number | null>(null);

  const reload = useCallback(async () => {
    const stored = await loadObservations();
    const now = nowSeconds();
    const current = compute(stored, now);
    const snapshot = await loadSnapshot();

    setIncidents(current);
    // ponytail: evidenceOf scans every observation per incident, O(n x m)
    // per reload. Trivial at field sizes; index statuses by ref if a full
    // 3,000-observation station board ever feels slow.
    setEvidence(
      new Map(current.map((i) => [i.key, evidenceOf(i, stored, now)])),
    );
    setSafe(safeCheckinCounts(stored));
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
    // Say what is wrong instead of greying the button out (DESIGN_BRIEF 8).
    if (pin.length < PIN_MIN) {
      setPinError(t.pinTooShort);
      return;
    }
    const ok = await enableStation(pin);
    setPinError(ok ? null : t.stationWrongPin);
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
        <Text style={styles.h2}>{t.stationMode}</Text>
        <Text style={styles.muted}>{t.stationLocked}</Text>
        <TextInput
          value={pin}
          onChangeText={(v) => {
            setPin(v.replace(/[^0-9]/g, "").slice(0, 8));
            setPinError(null);
          }}
          keyboardType="number-pad"
          secureTextEntry
          style={styles.input}
          accessibilityLabel={t.stationLocked}
        />
        <Text style={styles.hint}>{t.stationPinHint}</Text>
        {pinError ? <Text style={styles.error}>{pinError}</Text> : null}
        <Button label={t.stationUnlock} onPress={() => void unlock()} />
        <Link href="/" style={styles.link}>
          {t.newObservation}
        </Link>
      </ScrollView>
    );
  }

  const staleCount = [...evidence.values()].filter(
    (e) => e.freshness === "stale",
  ).length;
  const safeAreas = Object.entries(safe).sort((a, b) =>
    a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0,
  );

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.h2}>{t.board}</Text>
      <Text style={styles.summary}>
        {plural(incidents.length, t.incidentOne, t.incidentMany)}
        {staleCount > 0 ? " · " + fill(t.staleCount, { n: staleCount }) : ""}
      </Text>
      <Text style={styles.muted}>
        {seenAt === null ? t.seenNever : t.seenAt + " " + shortTime(seenAt)}
      </Text>

      <View style={styles.row}>
        <Button label={t.markSeen} onPress={() => void markSeen()} />
        <Button
          label={t.stationExit}
          variant="secondary"
          onPress={() => void leave()}
        />
      </View>
      <View style={styles.row}>
        <Button
          label={t.scanTitle}
          variant="secondary"
          onPress={() => router.push("/scan")}
        />
        <Button
          label={t.shareTitle}
          variant="secondary"
          onPress={() => router.push("/share")}
        />
      </View>

      {incidents.length === 0 ? (
        <Text style={styles.muted}>{t.noIncidents}</Text>
      ) : null}

      {incidents.map((incident) => {
        const e = evidence.get(incident.key);
        if (!e) return null;
        return (
          <IncidentCard
            key={incident.key}
            incident={incident}
            evidence={e}
            flags={changes.get(incident.key) ?? []}
            onPress={() =>
              router.push({
                pathname: "/incident/[key]",
                params: { key: incident.key },
              })
            }
          />
        );
      })}

      {safeAreas.length > 0 ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{t.safePanel}</Text>
          {safeAreas.map(([area, count]) => (
            <Text key={area} style={styles.safeLine}>
              {area}: {count}
            </Text>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: space[4],
    gap: space[3],
    paddingBottom: space[7],
  },
  h2: { fontSize: size.h2, fontWeight: "700", color: color.textPrimary },
  summary: {
    fontSize: size.body,
    fontWeight: "600",
    color: color.textPrimary,
    ...tabularNums,
  },
  muted: { fontSize: size.caption, color: color.textSecondary },
  hint: { fontSize: size.caption, color: color.warning },
  error: { fontSize: size.body, color: color.danger, fontWeight: "600" },
  row: { flexDirection: "row", gap: space[2], flexWrap: "wrap" },
  input: {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.control,
    backgroundColor: color.surface,
    padding: space[3],
    fontSize: size.h3,
    letterSpacing: 6,
    color: color.textPrimary,
  },
  panel: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.borderSubtle,
    borderRadius: radius.card,
    padding: space[3],
    gap: space[1],
  },
  panelTitle: {
    fontSize: size.body,
    fontWeight: "700",
    color: color.textPrimary,
  },
  // Green is reserved for resolved and explicit safe check-ins (BR-017).
  safeLine: { fontSize: size.body, color: color.success, ...tabularNums },
  link: { fontSize: size.body, color: color.accent, paddingVertical: space[2] },
});
