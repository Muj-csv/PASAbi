import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  CATEGORIES,
  changesSince,
  compute,
  fromServerRow,
  SAFE_CHECKIN,
  safeCheckinCounts,
  snapshotOf,
  wasUploadedBefore,
  type Category,
  type Incident,
  type IncidentChange,
  type Observation,
  type ServerObservationRow,
} from "@pasabi/core";

import { CATEGORY_LABELS, plural, useLang, useStrings } from "@/i18n";
import { fetchObservations, isConfigured } from "@/storage/uplink";

/**
 * FR-010 responder dashboard.
 *
 * The ADR-006 dividend: there is no second engine here. This is the same
 * compute() the phones run, over rows read back from Postgres, so the
 * dashboard cannot drift from a station board by construction.
 *
 * ponytail: no Leaflet map. It is item 2 on the IMPLEMENTATION_PLAN cut
 * list, it needs a web-only module plus CSS that would not bundle for
 * native, and the ranked list with "since last sync" is what a responder
 * actually reads. Add it if Phase 5 has room.
 */

const LAST_VISIT_KEY = "pasabi.dashboard.lastVisit";

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/** Web-only, and the dashboard is a web surface. Never throws. */
function readLastVisit(): number | null {
  try {
    const raw = globalThis.localStorage?.getItem(LAST_VISIT_KEY);
    if (!raw) return null;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeLastVisit(seconds: number): void {
  try {
    globalThis.localStorage?.setItem(LAST_VISIT_KEY, String(seconds));
  } catch {
    // A viewer with storage blocked still gets the board, just no diff.
  }
}

export default function Dashboard() {
  const t = useStrings();
  const lang = useLang();

  const [rows, setRows] = useState<ServerObservationRow[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [changes, setChanges] = useState<Map<string, IncidentChange[]>>(
    new Map(),
  );
  const [filter, setFilter] = useState<Category | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [lastVisit, setLastVisit] = useState<number | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const fetched = await fetchObservations();
      const now = nowSeconds();
      const observations: Observation[] = fetched.map(fromServerRow);
      const current = compute(observations, now);

      // FR-007: rebuild the picture as it stood when this viewer last looked,
      // from the rows the server had already seen by then.
      const cutoff = readLastVisit();
      const past =
        cutoff === null
          ? null
          : snapshotOf(
              compute(
                fetched
                  .filter((r) => wasUploadedBefore(r, cutoff))
                  .map(fromServerRow),
                now,
              ),
              cutoff,
            );

      setRows(fetched);
      setIncidents(current);
      setChanges(changesSince(past, current));
      setLastVisit(cutoff);
      setStatus("ready");

      // Stamp the visit only after a SUCCESSFUL load, so a failed fetch
      // cannot silently consume the diff window and leave a responder
      // thinking nothing changed.
      writeLastVisit(now);
    } catch {
      setStatus("error");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const observations = rows.map(fromServerRow);
  const safe = safeCheckinCounts(observations);
  const shown =
    filter === null ? incidents : incidents.filter((i) => i.category === filter);
  const changed = incidents.filter((i) => changes.has(i.key));

  if (!isConfigured()) {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.h1}>{t.dashboard}</Text>
        <Text style={styles.warn}>{t.notConfigured}</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.h1}>{t.dashboard}</Text>
      <Text style={styles.muted}>{t.dashboardIntro}</Text>

      <View style={styles.row}>
        <Pressable style={styles.primary} onPress={() => void load()}>
          <Text style={styles.primaryText}>{t.refresh}</Text>
        </Pressable>
        <Text style={styles.muted}>
          {plural(incidents.length, t.incidentOne, t.incidentMany)} ·{" "}
          {plural(observations.length, t.observationOne, t.observationMany)}
        </Text>
      </View>

      {status === "loading" ? (
        <Text style={styles.muted}>{t.loading}</Text>
      ) : null}
      {status === "error" ? <Text style={styles.warn}>{t.loadError}</Text> : null}

      <View style={styles.sinceCard}>
        <Text style={styles.cardTitle}>{t.sinceLastSync}</Text>
        {lastVisit === null || changed.length === 0 ? (
          <Text style={styles.muted}>{t.nothingChanged}</Text>
        ) : (
          changed.map((incident) => (
            <Text key={incident.key} style={styles.line}>
              {CATEGORY_LABELS[lang][incident.category]} ·{" "}
              {(changes.get(incident.key) ?? []).join(", ")}
            </Text>
          ))
        )}
      </View>

      <View style={styles.row}>
        <Pressable
          style={[styles.chip, filter === null && styles.chipOn]}
          onPress={() => setFilter(null)}
        >
          <Text style={styles.chipText}>{t.filterAll}</Text>
        </Pressable>
        {CATEGORIES.filter((c) => c !== SAFE_CHECKIN).map((c) => (
          <Pressable
            key={c}
            style={[styles.chip, filter === c && styles.chipOn]}
            onPress={() => setFilter(c)}
          >
            <Text style={styles.chipText}>{CATEGORY_LABELS[lang][c]}</Text>
          </Pressable>
        ))}
      </View>

      {shown.length === 0 && status === "ready" ? (
        <Text style={styles.muted}>{t.noIncidents}</Text>
      ) : null}

      {shown.map((incident) => (
        <View
          key={incident.key}
          style={[styles.card, incident.status === "resolved" && styles.faded]}
        >
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>
              {CATEGORY_LABELS[lang][incident.category]}
            </Text>
            <Text style={styles.score}>{incident.score}</Text>
          </View>
          <Text style={styles.line}>
            {plural(
              incident.independentReporters,
              t.reporterOne,
              t.reporterMany,
            )}
            {incident.peopleAffected > 0
              ? " · " + t.scorePeople + " " + String(incident.peopleAffected)
              : ""}
            {incident.spatialExtentM > 0
              ? " · " + t.extent + " " + String(incident.spatialExtentM) + " m"
              : ""}
          </Text>
          <Text style={styles.muted}>
            {incident.areaText ??
              (incident.centroid
                ? incident.centroid.lat.toFixed(4) +
                  ", " +
                  incident.centroid.lon.toFixed(4)
                : "")}
          </Text>
          <Text style={styles.breakdown}>
            {t.scoreBase} {incident.breakdown.base} · {t.scoreCorroboration}{" "}
            {incident.breakdown.corroboration} · {t.scorePeople}{" "}
            {incident.breakdown.people} · {t.scoreStaleness}{" "}
            {incident.breakdown.staleness}
          </Text>
        </View>
      ))}

      {Object.keys(safe).length > 0 ? (
        <View style={styles.safeCard}>
          <Text style={styles.cardTitle}>{t.safePanel}</Text>
          {Object.entries(safe)
            .sort((a, b) => (a[0] < b[0] ? -1 : 1))
            .map(([area, count]) => (
              <Text key={area} style={styles.line}>
                {area}: {count}
              </Text>
            ))}
        </View>
      ) : null}

      {/* PRD section 12, stated on the dashboard rather than buried in docs. */}
      <Text style={styles.caveat}>{t.corroborationCaveat}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12, paddingBottom: 48, maxWidth: 900 },
  h1: { fontSize: 22, fontWeight: "700" },
  muted: { fontSize: 13, color: "#5a6673" },
  warn: { fontSize: 14, color: "#b3261e", fontWeight: "600" },
  line: { fontSize: 14 },
  breakdown: { fontSize: 12, color: "#5a6673" },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap", alignItems: "center" },
  primary: {
    backgroundColor: "#1566c0",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  primaryText: { color: "#ffffff", fontWeight: "700" },
  chip: {
    borderWidth: 1,
    borderColor: "#c3cad2",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipOn: { borderColor: "#1566c0", backgroundColor: "#e8f1fc" },
  chipText: { fontSize: 13 },
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
  cardTitle: { fontSize: 16, fontWeight: "700" },
  score: { fontSize: 20, fontWeight: "700", color: "#0f4c92" },
  sinceCard: {
    borderWidth: 1,
    borderColor: "#cfd9e6",
    backgroundColor: "#f4f7fb",
    borderRadius: 10,
    padding: 12,
    gap: 3,
  },
  safeCard: {
    borderWidth: 1,
    borderColor: "#cfe3d4",
    backgroundColor: "#f2f8f4",
    borderRadius: 10,
    padding: 12,
    gap: 3,
  },
  caveat: { fontSize: 12, color: "#5a6673", marginTop: 8, fontStyle: "italic" },
});
