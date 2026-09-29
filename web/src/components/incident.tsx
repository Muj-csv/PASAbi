/**
 * Incident-detail components (S2, W1): EvidenceCounts · FactList · WhyFirst ·
 * GapList · LogEntry. The score lives behind "Why 2nd?", never as a headline.
 */
import { useState } from "react";

import type { Category } from "@pasabi/core";

import { evidenceText } from "../design/format";
import { useT } from "../design/i18n";
import { Link } from "../router";

/** Two numbers, never merged (BR-012). */
export function EvidenceCounts({ phones, reports }: { phones: number; reports: number }) {
  const t = useT();
  return (
    <div>
      <div className="counts">
        <div>
          <div className="display num">{phones}</div>
          <div className="small">{t(phones === 1 ? "inc.phone" : "inc.phones")}</div>
        </div>
        <div>
          <div className="display num">{reports}</div>
          <div className="small">{t(reports === 1 ? "inc.report" : "inc.reports")}</div>
        </div>
      </div>
      <p className="caption ink2 pad" style={{ paddingTop: 8 }}>
        {t.caveats.counts}
      </p>
    </div>
  );
}

export function FactList({ rows }: { rows: { label: string; value: string; strong?: boolean }[] }) {
  return (
    <dl className="facts body" style={{ margin: 0 }}>
      {rows.map((r) => (
        <div key={r.label} style={{ display: "contents" }}>
          <dt>{r.label}</dt>
          <dd className={r.strong ? "strong" : undefined}>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function WhyFirst({
  ordinal,
  lines,
  total,
}: {
  ordinal: string;
  lines: { label: string; points: number }[];
  total: number;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const fmt = (n: number) => (n > 0 ? `+${n}` : String(n));
  return (
    <div className="pad ruled" style={{ paddingTop: 8, paddingBottom: 16 }}>
      <button className="why-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>{t("why.title", { ordinal })}</span>
        <span className="heading" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <div>
          {lines.map((l) => (
            <div key={l.label} className="why-line">
              <span>{l.label}</span>
              <b className="num">{fmt(l.points)}</b>
            </div>
          ))}
          <div className="why-line strong" style={{ borderBottom: 0 }}>
            <span>{t("why.total")}</span>
            <span className="num">{total}</span>
          </div>
          <p className="caption ink2">{t.caveats.why}</p>
        </div>
      ) : null}
    </div>
  );
}

/** Known / haven't heard (BR-013). Never ✓/✕, one caveat. */
export function GapList({
  nearby,
  unheard,
}: {
  nearby: { category: Category; phones: number; time: string; to: string }[];
  unheard: Category[];
}) {
  const t = useT();
  return (
    <div className="pad" style={{ paddingTop: 24 }}>
      {nearby.length > 0 ? (
        <>
          <h2 className="heading" style={{ marginBottom: 8 }}>
            {t("gap.nearby")}
          </h2>
          {nearby.map((n) => (
            <Link key={n.category} to={n.to} className="gap-line body" style={{ textDecoration: "none" }}>
              <b aria-hidden="true">●</b>
              <span>
                {t.cat(n.category)} · {evidenceText(t, n.phones, 0)[0]}
              </span>
              <span className="small ink2 num">{n.time}</span>
            </Link>
          ))}
        </>
      ) : null}
      {unheard.length > 0 ? (
        <>
          <h2 className="heading" style={{ marginTop: nearby.length > 0 ? 24 : 0, marginBottom: 4 }}>
            {t("gap.unheard")}
          </h2>
          <p className="caption ink2" style={{ paddingBottom: 8 }}>
            {t.caveats.noReport}
          </p>
          {unheard.map((k) => (
            <div key={k} className="gap-line body ink2">
              <b aria-hidden="true">?</b>
              <span>{t.cat(k)}</span>
              <span />
            </div>
          ))}
        </>
      ) : null}
    </div>
  );
}

/** One line of the incident log. Operator actions are written in coral-ink. */
export function LogEntry({
  time,
  what,
  detail,
  operator = false,
}: {
  time: string;
  what: string;
  detail?: string;
  operator?: boolean;
}) {
  return (
    <div className={operator ? "log operator" : "log"}>
      <span className="time">{time}</span>
      <div className="stack">
        <span className="body">{what}</span>
        {detail ? <span className="caption ink2">{detail}</span> : null}
      </div>
    </div>
  );
}
