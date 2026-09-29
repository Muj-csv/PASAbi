/**
 * LedgerRow, the anchor component (S1, W1), with EvidenceLine and
 * FreshnessMark. A row answers what · where · how many phones · last heard
 * without a tap. Radius 0, hairline below; changed rows are ballpen-tint;
 * the whole row's ink follows freshness (never a warning hue).
 */
import type { Evidence, Incident, IncidentChange } from "@pasabi/core";

import { changeMark, clock, evidenceText, FRESH_GLYPH, FRESH_WORD, placeOf } from "../design/format";
import { useT } from "../design/i18n";
import { Pictogram } from "../design/pictograms";
import { Link } from "../router";

import { Stamp, type StampInk } from "./kit";

export function EvidenceLine({ phones, reports, people }: { phones: number; reports: number; people?: number }) {
  const t = useT();
  const [p, r] = evidenceText(t, phones, reports);
  return (
    <span className="small num sub">
      <b className="strong">{p}</b> · {r}
      {people ? ` · ${t("ev.people", { n: people })}` : ""}
    </span>
  );
}

export function LedgerRow({
  incident,
  evidence,
  rank,
  changes,
  stamp,
  to,
}: {
  incident: Incident;
  evidence: Evidence;
  /** 1-based rank among open incidents; null when resolved. */
  rank: number | null;
  changes?: IncidentChange[];
  stamp?: { label: string; ink: StampInk } | null;
  to: string;
}) {
  const t = useT();
  const f = evidence.freshness;
  const resolved = incident.status === "resolved";
  const mark = resolved ? null : changeMark(changes, t);
  return (
    <Link to={to} className={`ledger-row fresh-${f}${mark ? " changed" : ""}`}>
      <span className={f === "stale" || resolved ? "rank dim" : "rank"}>
        {rank === null ? "—" : String(rank).padStart(2, "0")}
      </span>

      <span className="stack gap1" style={{ minWidth: 0 }}>
        {/* Pictogram and category never split; the place may wrap below. */}
        <span className="what">
          <span className="cat">
            <Pictogram category={incident.category} size={22} />
            <span className="heading">{t.cat(incident.category)}</span>
          </span>
          <span className="body sub">{placeOf(incident, t)}</span>
        </span>
        <EvidenceLine
          phones={evidence.sourceCount}
          reports={evidence.reportCount}
          people={incident.peopleAffected || undefined}
        />
        {f === "stale" && !resolved ? <span className="caption sub">{t("old.note")}</span> : null}
        {/* Stamps sit in the content column so they never squeeze the time. */}
        {stamp ? <Stamp seed={incident.key} label={stamp.label} ink={stamp.ink} /> : null}
      </span>

      <span className="right">
        <span className="stack" style={{ alignItems: "flex-end" }}>
          <span className="small num strong" style={{ whiteSpace: "nowrap" }}>
            {FRESH_GLYPH[f]} {clock(evidence.lastSeen)}
          </span>
          {f === "fresh" ? null : <span className="caption">{t(FRESH_WORD[f])}</span>}
        </span>
        {mark ? <span className="change-mark">{mark}</span> : null}
      </span>
    </Link>
  );
}

/** ACK / RESOLVED stamp for a ledger row, from the incident's own timeline. */
export function rowStamp(incident: Incident, evidence: Evidence, t: ReturnType<typeof useT>) {
  if (incident.status === "resolved") return { label: t("stamp.resolved"), ink: "faded" as const };
  if (incident.status === "acknowledged") {
    const ack = [...evidence.timeline].reverse().find((e) => e.action === "ACK");
    return {
      label: ack ? t("stamp.ack", { time: clock(ack.created_at) }) : t("stamp.acknowledged"),
      ink: "coral" as const,
    };
  }
  return null;
}
