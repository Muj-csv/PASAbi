/**
 * Adapters: engine output → component props. The ONLY file that knows both the engine and the UI.
 *
 * ⚠ The input types below are written from PRD v0.5.2 §12–13, not from your code.
 *   Replace them with imports from packages/core (Incident, Evidence, Gaps, Coverage) and fix
 *   field names here — the components never need to change.
 */
import type { LedgerRowProps } from './components/LedgerRow';
import type { CoverageLevel, SlipStamp } from './components/Blocks';
import type { Category } from './pictograms';
import type { Freshness, StampInk } from './theme';
import { CopyKey, Lang, t as translate } from './copy';

// ---- Engine shapes (from the PRD — adjust to packages/core) --------------------------------

export type Timestamp = number | string; // epoch ms or ISO string

export interface EngineIncident {
  key: string;
  category: Category;
  observationIds: string[];
  independentReporters: number;
  peopleAffected: number | null;
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  areaText?: string | null;
  spatialExtentM?: number;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  score: number;
  /** PRD: "a visible breakdown". Shape assumed; map your real one in whyLines(). */
  breakdown: { key: string; points: number }[];
}

export interface EngineEvidence {
  reportCount: number;
  sourceCount: number;
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  latestAgeSeconds: number;
  freshness: Freshness; // 'fresh' | 'aging' | 'stale' (BR-011)
}

export interface EngineCoverage {
  area: string | null; // null / '' → "No area named"
  lastObservationAt: Timestamp | null;
  distinctDevices: number;
  level: 'high' | 'limited' | 'stale' | 'none';
}

/** Local-only flags on an OWN observation (BR-015 / BR-016). Never synced. */
export interface OwnFlags {
  passed_on: boolean;
  reached_station: boolean;
  uploaded: boolean;
}

/** What changed since "Mark seen" (FR-007). Your engine may already compute this. */
export type Change = 'new' | 'corroborated' | 'escalated' | 'reopened' | 'resolved';

// ---- Formatting ------------------------------------------------------------------------------

/** 24-hour clock, device local time: "14:19". Station shows clock time first (DESIGN_BRIEF §9). */
export function clock(ts: Timestamp): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Residents see relative time: "8 min ago" / "2 h ago". */
export function ago(ts: Timestamp, now: number, lang: Lang): string {
  const mins = Math.max(0, Math.round((now - new Date(ts).getTime()) / 60000));
  if (lang === 'fil') return mins < 60 ? `${mins} min na` : `${Math.floor(mins / 60)} oras na`;
  return mins < 60 ? `${mins} min ago` : `${Math.floor(mins / 60)} h ago`;
}

/** "2nd" (en) / "2" (fil, used as "ika-2"). */
export function ordinal(n: number, lang: Lang): string {
  if (lang === 'fil') return String(n);
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export function placeOf(i: Pick<EngineIncident, 'areaText'>, lang: Lang): string {
  return i.areaText?.trim() || translate('cov.unnamed', lang);
}

// ---- Ledger ----------------------------------------------------------------------------------

const MARK: Record<Change, CopyKey | null> = {
  new: 'mark.new',
  corroborated: 'mark.phone',
  escalated: 'mark.people',
  reopened: 'mark.reopened',
  resolved: null, // shown by the RESOLVED stamp instead
};

/**
 * Engine incidents (already sorted by the engine: open by score, resolved last) → LedgerRow props.
 * Rank counts OPEN incidents only.
 */
export function toLedgerRows(
  incidents: EngineIncident[],
  evidence: Record<string, EngineEvidence>,
  changes: Record<string, Change | undefined>,
  lang: Lang,
  onOpen: (key: string) => void,
  ackTimes: Record<string, Timestamp | undefined> = {},
): LedgerRowProps[] {
  let rank = 0;
  return incidents.map((inc) => {
    const ev = evidence[inc.key];
    const resolved = inc.status === 'RESOLVED';
    if (!resolved) rank += 1;
    const change = changes[inc.key];
    const markKey = change ? MARK[change] : null;
    let stamp: LedgerRowProps['stamp'] = null;
    if (resolved) stamp = { label: translate('stamp.resolved', lang), ink: 'faded' };
    else if (inc.status === 'ACKNOWLEDGED') {
      const at = ackTimes[inc.key];
      stamp = { label: at ? translate('stamp.ack', lang, { time: clock(at) }) : translate('stamp.acknowledged', lang), ink: 'coral' };
    }
    return {
      id: inc.key,
      rank: resolved ? null : rank,
      category: inc.category,
      place: placeOf(inc, lang),
      phones: ev?.sourceCount ?? inc.independentReporters,
      reports: ev?.reportCount ?? inc.observationIds.length,
      people: inc.peopleAffected,
      lastHeard: clock(ev?.lastSeen ?? inc.lastSeen),
      freshness: ev?.freshness ?? 'fresh',
      changeMark: markKey ? translate(markKey, lang) : null,
      stamp,
      resolved,
      onPress: () => onOpen(inc.key),
    };
  });
}

// ---- Incident detail -------------------------------------------------------------------------

/** Map your breakdown keys to words. Unknown keys fall back to the key itself — fix them. */
export function whyLines(inc: EngineIncident, lang: Lang): { label: string; points: number }[] {
  const words: Record<string, (p: number) => string> = {
    category: () => translate(`cat.${inc.category}` as CopyKey, lang),
    corroboration: () => {
      const more = inc.independentReporters - 1;
      return lang === 'fil' ? `${more} pang phone` : `${more} more ${more === 1 ? 'phone' : 'phones'}`;
    },
    people: () => translate('ev.people', lang, { n: inc.peopleAffected ?? 0 }),
    unacknowledged: () => (lang === 'fil' ? 'Hindi pa natatanggap' : 'Not acknowledged'),
    age: () => (lang === 'fil' ? 'Tanda ng huling ulat' : 'Age of latest report'),
  };
  return inc.breakdown.map((b) => ({ label: (words[b.key] ?? (() => b.key))(b.points), points: b.points }));
}

// ---- Coverage --------------------------------------------------------------------------------

const COVERAGE_ORDER: CoverageLevel[] = ['none', 'stale', 'limited', 'high'];

/** Worst first, then by area name. */
export function toCoverageRows(rows: EngineCoverage[], lang: Lang): { area: string; level: CoverageLevel; label: string }[] {
  return [...rows]
    .sort((a, b) => COVERAGE_ORDER.indexOf(a.level) - COVERAGE_ORDER.indexOf(b.level) || (a.area ?? '').localeCompare(b.area ?? ''))
    .map((r) => ({
      area: r.area?.trim() || translate('cov.unnamed', lang),
      level: r.level,
      label:
        r.level === 'high'
          ? translate('cov.high', lang)
          : r.level === 'limited'
            ? translate('cov.limited', lang)
            : r.level === 'stale' && r.lastObservationAt != null
              ? translate('cov.stale', lang, { time: clock(r.lastObservationAt) })
              : translate('cov.none', lang),
    }));
}

// ---- Slip stamps (BR-015) --------------------------------------------------------------------

/**
 * Stamp row for an own report. Earned only from flags the phone holds; pending ones render as outlines.
 * `previous` = flags from the last render, so a newly-true flag gets the press animation + haptic.
 */
export function slipStamps(flags: OwnFlags, lang: Lang, previous?: OwnFlags): SlipStamp[] {
  const s = (key: CopyKey, ink: StampInk, earned: boolean, was?: boolean): SlipStamp => ({
    label: translate(key, lang),
    ink,
    earned,
    justEarned: earned && previous !== undefined && !was,
  });
  return [
    s('stamp.saved', 'black', true, true),
    s('stamp.passed', 'ballpen', flags.passed_on, previous?.passed_on),
    s('stamp.station', 'coral', flags.reached_station, previous?.reached_station),
    s('stamp.uploaded', 'coralSolid', flags.uploaded, previous?.uploaded),
  ];
}

/** The one status sentence under the slip — the strongest stage the phone can prove. */
export function slipStatus(flags: OwnFlags, lang: Lang): string {
  if (flags.uploaded) return translate('slip.status.uploaded', lang);
  if (flags.reached_station) return translate('slip.status.station', lang);
  if (flags.passed_on) return translate('slip.status.passed', lang);
  return translate('slip.status.saved', lang);
}
