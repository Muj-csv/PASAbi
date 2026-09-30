// Engine output → display text. Components take plain strings; the formatting
// rules live here (design kit adapters.ts, matched to packages/core).

import {
  CATEGORY_BASE,
  RATE_LIMIT_WINDOW_SECONDS,
  type AreaCoverage,
  type Freshness,
  type Incident,
  type IncidentChange,
  type Observation,
} from "@pasabi/core";

import type { CopyKey, Lang } from "./copy";
import type { T } from "./i18n";

/** 24-hour clock from epoch seconds: "14:19". Stations read clock time first. */
export function clock(epochSeconds: number): string {
  const d = new Date(epochSeconds * 1000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Residents read relative time: "8 min ago" / "2 h ago". */
export function ago(epochSeconds: number, now: number, lang: Lang): string {
  const mins = Math.max(0, Math.round((now - epochSeconds) / 60));
  if (lang === "fil") return mins < 60 ? `${mins} min na` : `${Math.floor(mins / 60)} oras na`;
  return mins < 60 ? `${mins} min ago` : `${Math.floor(mins / 60)} h ago`;
}

/** "2nd" in English; "2" in Filipino, where the copy wraps it as "ika-2". */
export function ordinal(n: number, lang: Lang): string {
  if (lang === "fil") return String(n);
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export function placeOf(i: Pick<Incident, "areaText">, t: T): string {
  return i.areaText?.trim() || t("cov.unnamed");
}

export function evidenceText(t: T, phones: number, reports: number): [string, string] {
  return [
    phones === 1 ? t("ev.phone") : t("ev.phones", { n: phones }),
    reports === 1 ? t("ev.report") : t("ev.reports", { n: reports }),
  ];
}

/** "1 person" / "3 people". Never "1 people". */
export function peopleText(t: T, n: number): string {
  return n === 1 ? t("ev.person") : t("ev.people", { n });
}

export const FRESH_WORD: Record<Freshness, CopyKey> = {
  fresh: "fresh.fresh",
  aging: "fresh.aging",
  stale: "fresh.stale",
};

export const FRESH_GLYPH: Record<Freshness, string> = { fresh: "●", aging: "◐", stale: "○" };

/**
 * FR-007 change marks. The engine names what changed; the words stay honest
 * about it ("More phones" rather than a guessed "+1 phone"). A resolved
 * incident shows its RESOLVED stamp instead of a mark.
 */
export function changeMark(changes: IncidentChange[] | undefined, t: T): string | null {
  if (!changes || changes.length === 0) return null;
  if (changes.includes("new")) return t("mark.new");
  if (changes.includes("newly_corroborated")) return t("mark.phones");
  if (changes.includes("escalated")) return t("mark.up");
  return null;
}

export function coverageLabel(c: AreaCoverage, t: T): string {
  if (c.level === "high") return t("cov.high");
  if (c.level === "limited") return t("cov.limited");
  if (c.level === "stale" && c.lastObservationAt != null) {
    return t("cov.stale", { time: clock(c.lastObservationAt) });
  }
  return t("cov.none");
}

/** "Why 2nd?" rows, one per ScoreBreakdown term (BR-005). Sum = total. */
export function whyLines(i: Incident, t: T): { label: string; points: number }[] {
  const b = i.breakdown;
  const more = i.independentReporters - 1;
  return [
    { label: t.cat(i.category), points: b.base },
    {
      label: more <= 0 ? t("why.noMore") : more === 1 ? t("why.more.one") : t("why.more", { n: more }),
      points: b.corroboration,
    },
    {
      label: i.peopleAffected > 0 ? peopleText(t, i.peopleAffected) : t("why.noPeople"),
      points: b.people,
    },
    { label: b.unacknowledged > 0 ? t("why.unacked") : t("why.acked"), points: b.unacknowledged },
    { label: t("why.age"), points: b.staleness },
  ];
}

/** BR-010: when this phone's oldest report in the hour window ages out. */
export function retryAt(held: Observation[], deviceId: string, now: number): number {
  const inWindow = held
    .filter((o) => o.type === "REPORT" && o.device_id === deviceId && o.created_at > now - RATE_LIMIT_WINDOW_SECONDS)
    .map((o) => o.created_at);
  return (inWindow.length > 0 ? Math.min(...inWindow) : now) + RATE_LIMIT_WINDOW_SECONDS;
}

const TOP_BASE = Math.max(...Object.values(CATEGORY_BASE));

/**
 * Home "N urgent": reports this phone holds in open incidents of the
 * highest-weighted categories in rules.ts (life first). Derived from the
 * rules, not a new threshold.
 */
export function urgentCount(held: Observation[], incidents: Incident[]): number {
  const urgentIds = new Set(
    incidents
      .filter((i) => i.status !== "resolved" && CATEGORY_BASE[i.category] === TOP_BASE)
      .flatMap((i) => i.observationIds),
  );
  return held.filter((o) => urgentIds.has(o.id)).length;
}
