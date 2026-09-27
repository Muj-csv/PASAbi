import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  CATEGORIES,
  changesSince,
  compute,
  evidenceOf,
  fromServerRow,
  gapsFor,
  SAFE_CHECKIN,
  safeCheckinCounts,
  snapshotOf,
  wasUploadedBefore,
  type Category,
  type Evidence,
  type Incident,
  type IncidentChange,
  type Observation,
  type SafeCheckinCounts,
} from "@pasabi/core";

import { Button } from "@/components/Button";
import { IncidentCard } from "@/components/IncidentCard";
import { KnownUnknownList } from "@/components/KnownUnknownList";
import { Notice } from "@/components/Notice";
import {
  CATEGORY_LABELS,
  changeLabel,
  plural,
  useLang,
  useStrings,
} from "@/i18n";
import { fetchObservations, isConfigured } from "@/storage/uplink";
import {
  color,
  radius,
  size,
  space,
  tabularNums,
  TOUCH_TARGET,
} from "@/theme/tokens";

/**
 * FR-010 responder dashboard.
 *
 * The ADR-006 dividend: there is no second engine here. This is the same
 * compute() and evidenceOf() the phones run, over rows read back from
 * Postgres, and the same IncidentCard, so the dashboard cannot drift from a
 * station board by construction.
 *
 * ponytail: no Leaflet map (deferred, PRD section 8), and no two-column
 * layout at >= 768 px yet (DESIGN_BRIEF section 3). The ranked list with
 * evidence and "since last visit" is what a responder reads first.
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

  const [observations, setObservations] = useState<Observation[]>([]);
  const [observationCount, setObservationCount] = useState(0);
  /** The one card whose known / not-yet-reported list is open. */
  const [gapsOpen, setGapsOpen] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [evidence, setEvidence] = useState<Map<string, Evidence>>(new Map());
  const [safe, setSafe] = useState<SafeCheckinCounts>({});
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
      const observations = fetched.map(fromServerRow);
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

      setObservations(observations);
      setObservationCount(observations.length);
      setIncidents(current);
      setEvidence(
        new Map(current.map((i) => [i.key, evidenceOf(i, observations, now)])),
      );
      setSafe(safeCheckinCounts(observations));
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
      if (isConfigured()) void load();
    }, [load]),
  );

  if (!isConfigured()) {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.h2}>{t.dashboard}</Text>
        <Notice message={t.dashNotConnected} detail={t.dashDevDetail} />
      </ScrollView>
    );
  }

  const shown =
    filter === null ? incidents : incidents.filter((i) => i.category === filter);
  const changed = incidents.filter((i) => changes.has(i.key));
  const safeAreas = Object.entries(safe).sort((a, b) =>
    a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0,
  );

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.h2}>{t.dashboard}</Text>
      <Text style={styles.muted}>{t.dashboardIntro}</Text>

      <View style={styles.row}>
        <Button label={t.refresh} onPress={() => void load()} />
        <Text style={styles.count}>
          {plural(incidents.length, t.incidentOne, t.incidentMany)} ·{" "}
          {plural(observationCount, t.observationOne, t.observationMany)}
        </Text>
      </View>

      {status === "loading" ? (
        <Text style={styles.muted}>{t.loading}</Text>
      ) : null}
      {status === "error" ? <Notice message={t.loadError} tone="error" /> : null}
      {status === "ready" && observationCount === 0 ? (
        <Notice message={t.dashEmpty} />
      ) : null}

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{t.sinceLastSync}</Text>
        {lastVisit === null || changed.length === 0 ? (
          <Text style={styles.muted}>{t.nothingChanged}</Text>
        ) : (
          changed.map((incident) => (
            <Text key={incident.key} style={styles.line}>
              {CATEGORY_LABELS[lang][incident.category]} ·{" "}
              {(changes.get(incident.key) ?? [])
                .map((flag) => changeLabel(flag, t))
                .join(", ")}
            </Text>
          ))
        )}
      </View>

      <View style={styles.row}>
        <Pressable
          style={[styles.chip, filter === null && styles.chipOn]}
          onPress={() => setFilter(null)}
          accessibilityRole="button"
          accessibilityState={{ selected: filter === null }}
        >
          <Text style={styles.chipText}>{t.filterAll}</Text>
        </Pressable>
        {CATEGORIES.filter((c) => c !== SAFE_CHECKIN).map((c) => (
          <Pressable
            key={c}
            style={[styles.chip, filter === c && styles.chipOn]}
            onPress={() => setFilter(c)}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === c }}
          >
            <Text style={styles.chipText}>{CATEGORY_LABELS[lang][c]}</Text>
          </Pressable>
        ))}
      </View>

      {shown.length === 0 && status === "ready" && observationCount > 0 ? (
        <Text style={styles.muted}>{t.noIncidents}</Text>
      ) : null}

      {shown.map((incident) => {
        const e = evidence.get(incident.key);
        if (!e) return null;
        const b = incident.breakdown;
        return (
          <IncidentCard
            key={incident.key}
            incident={incident}
            evidence={e}
            flags={changes.get(incident.key) ?? []}
          >
            <Text style={styles.breakdown}>
              {t.scoreBase} {b.base} · {t.scoreCorroboration} {b.corroboration}{" "}
              · {t.scorePeople} {b.people} · {t.scoreUnacknowledged}{" "}
              {b.unacknowledged} · {t.scoreStaleness} {b.staleness}
            </Text>
            {/* FR-016, computed only for the card that is opened (ARCHITECTURE 3a). */}
            <View style={styles.row}>
              <Button
                label={gapsOpen === incident.key ? t.gapsHide : t.gapsShow}
                variant="secondary"
                onPress={() =>
                  setGapsOpen((k) => (k === incident.key ? null : incident.key))
                }
              />
            </View>
            {gapsOpen === incident.key ? (
              <KnownUnknownList
                gaps={gapsFor(incident, incidents, observations)}
              />
            ) : null}
          </IncidentCard>
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

      {/* PRD section 14, stated on the dashboard rather than buried in docs. */}
      <Text style={styles.caveat}>{t.corroborationCaveat}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: space[4],
    gap: space[3],
    paddingBottom: space[7],
    maxWidth: 900,
  },
  h2: { fontSize: size.h2, fontWeight: "700", color: color.textPrimary },
  muted: { fontSize: size.caption, color: color.textSecondary },
  count: { fontSize: size.caption, color: color.textSecondary, ...tabularNums },
  line: { fontSize: size.body, color: color.textPrimary },
  breakdown: {
    fontSize: size.caption,
    color: color.textSecondary,
    ...tabularNums,
  },
  row: {
    flexDirection: "row",
    gap: space[2],
    flexWrap: "wrap",
    alignItems: "center",
  },
  chip: {
    minHeight: TOUCH_TARGET,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 999,
    paddingHorizontal: space[3],
    backgroundColor: color.surface,
  },
  chipOn: { borderColor: color.accent, backgroundColor: color.surfaceHover },
  chipText: { fontSize: size.caption, color: color.textPrimary },
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
  caveat: {
    fontSize: size.caption,
    color: color.textSecondary,
    marginTop: space[2],
    fontStyle: "italic",
  },
});
