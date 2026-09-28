import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  changesSince,
  compute,
  coverageByArea,
  evidenceOf,
  EXPECTED_AREAS_MAX,
  normalizeArea,
  safeCheckinCounts,
  snapshotOf,
  type AreaCoverage,
  type Evidence,
  type Incident,
  type IncidentChange,
  type SafeCheckinCounts,
} from "@pasabi/core";

import { Button } from "@/components/Button";
import { CoverageRow } from "@/components/CoverageRow";
import { IncidentCard } from "@/components/IncidentCard";
import { StatusBand } from "@/components/StatusBand";
import { fill, plural, useStrings } from "@/i18n";
import { loadObservations } from "@/storage/observations";
import {
  disableStation,
  enableStation,
  loadExpectedAreas,
  loadSnapshot,
  loadStation,
  saveExpectedAreas,
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
  const [coverage, setCoverage] = useState<AreaCoverage[]>([]);
  const [now, setNow] = useState(nowSeconds());
  const [expected, setExpected] = useState<string[]>([]);
  const [newArea, setNewArea] = useState("");
  const [expectedNote, setExpectedNote] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const stored = await loadObservations();
    const now = nowSeconds();
    const current = compute(stored, now);
    const snapshot = await loadSnapshot();
    const expectedAreas = await loadExpectedAreas();

    setNow(now);
    setExpected(expectedAreas);
    // FR-017: every observation type counts; silence in an expected purok
    // shows as "no reports", never as safe.
    setCoverage(coverageByArea(stored, now, expectedAreas));
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

  const addExpected = async (): Promise<void> => {
    const area = newArea.trim();
    if (!area) return;
    if (expected.some((a) => normalizeArea(a) === normalizeArea(area))) {
      setNewArea("");
      return;
    }
    if (expected.length >= EXPECTED_AREAS_MAX) {
      setExpectedNote(t.expectedFull);
      return;
    }
    await saveExpectedAreas([...expected, area]);
    setNewArea("");
    setExpectedNote(null);
    await reload();
  };

  const removeExpected = async (area: string): Promise<void> => {
    await saveExpectedAreas(expected.filter((a) => a !== area));
    setExpectedNote(null);
    await reload();
  };

  const markSeen = async (): Promise<void> => {
    await saveSnapshot(snapshotOf(incidents, nowSeconds()));
    await reload();
  };

  if (!unlocked) {
    return (
      <View style={styles.page}>
        <StatusBand mode="station" label={t.stationMode} />
        <ScrollView contentContainerStyle={styles.form}>
          <Text style={styles.muted}>{t.stationLocked}</Text>
          <TextInput
            value={pin}
            onChangeText={(v) => {
              setPin(v.replace(/[^0-9]/g, "").slice(0, 8));
              setPinError(null);
            }}
            keyboardType="number-pad"
            secureTextEntry
            style={styles.pinInput}
            accessibilityLabel={t.stationLocked}
          />
          <Text style={styles.hint}>{t.stationPinHint}</Text>
          {pinError ? <Text style={styles.error}>{pinError}</Text> : null}
          <Button label={t.stationUnlock} onPress={() => void unlock()} />
          <Link href="/" style={styles.link}>
            {t.newObservation}
          </Link>
        </ScrollView>
      </View>
    );
  }

  const staleCount = [...evidence.values()].filter(
    (e) => e.freshness === "stale",
  ).length;
  const thinCount = coverage.filter((c) => c.level !== "high").length;
  const safeAreas = Object.entries(safe).sort((a, b) =>
    a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0,
  );

  return (
    <View style={styles.page}>
      <StatusBand mode="station" label={t.board} />
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.summary}>
          {plural(incidents.length, t.incidentOne, t.incidentMany)}
          {staleCount > 0 ? " · " + fill(t.staleCount, { n: staleCount }) : ""}
          {thinCount === 1
            ? " · " + t.thinCoverageOne
            : thinCount > 1
              ? " · " + fill(t.thinCoverageMany, { n: thinCount })
              : ""}
        </Text>
        <Text style={styles.muted}>
          {seenAt === null ? t.seenNever : t.seenAt + " " + shortTime(seenAt)}
        </Text>

        <View style={styles.row}>
          <Button label={t.markSeen} variant="secondary" onPress={() => void markSeen()} />
          <Button label={t.stationExit} variant="quiet" onPress={() => void leave()} />
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

        <View style={styles.ledger}>
          {incidents.map((incident, index) => {
            const e = evidence.get(incident.key);
            if (!e) return null;
            return (
              <IncidentCard
                key={incident.key}
                incident={incident}
                evidence={e}
                flags={changes.get(incident.key) ?? []}
                rank={index + 1}
                onPress={() =>
                  router.push({
                    pathname: "/incident/[key]",
                    params: { key: incident.key },
                  })
                }
              />
            );
          })}
        </View>

        {/* FR-017, after the incidents: the operator's first question is
            what to act on; the second is where the picture is thin. */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{t.coverageHeading}</Text>
          {coverage.length === 0 ? (
            <Text style={styles.muted}>{t.coverageEmpty}</Text>
          ) : (
            coverage.map((row) => (
              <CoverageRow key={row.area ?? " "} row={row} now={now} />
            ))
          )}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{t.expectedHeading}</Text>
          <Text style={styles.muted}>{t.expectedHint}</Text>
          <View style={styles.row}>
            <TextInput
              value={newArea}
              onChangeText={setNewArea}
              onSubmitEditing={() => void addExpected()}
              placeholder="Purok 5"
              placeholderTextColor={color.ink2}
              style={[styles.input, styles.areaInput]}
              accessibilityLabel={t.expectedHeading}
            />
            <Button label={t.addArea} variant="secondary" onPress={() => void addExpected()} />
          </View>
          {expectedNote ? <Text style={styles.hint}>{expectedNote}</Text> : null}
          <View style={styles.row}>
            {expected.map((area) => (
              <Button
                key={area}
                label={fill(t.removeArea, { area })}
                variant="quiet"
                onPress={() => void removeExpected(area)}
              />
            ))}
          </View>
        </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.paper },
  form: {
    padding: space[4],
    gap: space[3],
    paddingBottom: space[7],
  },
  summary: {
    fontSize: size.body,
    fontWeight: "600",
    color: color.ink,
    ...tabularNums,
  },
  muted: { fontSize: size.caption, color: color.ink2 },
  hint: { fontSize: size.caption, color: color.ink2 },
  error: { fontSize: size.body, color: color.ink, fontWeight: "700" },
  row: { flexDirection: "row", gap: space[2], flexWrap: "wrap" },
  ledger: { marginHorizontal: -space[4] },
  input: {
    borderWidth: 1,
    borderColor: color.ink,
    borderRadius: radius.control,
    backgroundColor: color.paper,
    padding: space[3],
    fontSize: size.body,
    color: color.ink,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: color.ink,
    borderRadius: radius.control,
    backgroundColor: color.paper,
    padding: space[3],
    fontSize: size.h3,
    letterSpacing: 6,
    color: color.ink,
  },
  areaInput: {
    flexGrow: 1,
    flexBasis: 160,
    fontSize: size.body,
    letterSpacing: 0,
  },
  panel: {
    gap: space[1],
    paddingTop: space[3],
    borderTopWidth: 1,
    borderTopColor: color.rule,
  },
  panelTitle: {
    fontSize: size.body,
    fontWeight: "700",
    color: color.ink,
  },
  // No colour for "safe": plain ink, per the forbidden list (BR-017).
  safeLine: { fontSize: size.body, color: color.ink, ...tabularNums },
  link: { fontSize: size.body, color: color.ballpen, paddingVertical: space[2] },
});
