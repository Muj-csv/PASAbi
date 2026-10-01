/**
 * Incident Passport (P2, spec §3, D-035/D-040): one incident as a document
 * that reads on its own, prints to PDF, exports JSON / CSV, and shows as QR.
 * The QR carries only the supporting observations: the phone that scans it
 * rebuilds the incident with its own engine (ADR-002). Works offline.
 */
import { useEffect, useMemo, useState } from "react";

import {
  coarsePassport,
  encodeBundle,
  EXPORTERS,
  passportOf,
  QR_FRAME_INTERVAL_MS,
  QR_MAX_OBSERVATIONS,
  sourceLabel,
  type IncidentPassport,
  type Observation,
} from "@pasabi/core";

import { FactList, LogEntry } from "../components/incident";
import { BackBar, Button, ModeBand, Notice, StatusBand } from "../components/kit";
import { QrCode } from "../components/qr";
import { clock, evidenceText, FRESH_WORD, peopleText } from "../design/format";
import type { CopyKey } from "../design/copy";
import { useT, type T } from "../design/i18n";
import { deviceIdSync, uuid4 } from "../storage/device";

import { logLines } from "./Incident";

const iso = (s: string) => Math.floor(Date.parse(s) / 1000);

function download(p: IncidentPassport, kind: "json" | "csv") {
  const ex = EXPORTERS[kind];
  const url = URL.createObjectURL(new Blob([ex.render(p)], { type: ex.mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `pasabi-passport-${p.incidentId.slice(0, 8)}.${ex.extension}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The supporting observations as QR, a batch at a time (same frames as Pass on). */
function PassportQr({ evidence, t }: { evidence: Observation[]; t: T }) {
  const batches = useMemo(() => {
    const out: string[][] = [];
    for (let i = 0; i < evidence.length; i += QR_MAX_OBSERVATIONS) {
      out.push(encodeBundle(evidence.slice(i, i + QR_MAX_OBSERVATIONS), uuid4().replace(/-/g, "").slice(0, 8)));
    }
    return out;
  }, [evidence]);
  const [batch, setBatch] = useState(0);
  const [frame, setFrame] = useState(0);
  const frames = batches[batch] ?? [];
  useEffect(() => {
    if (frames.length < 2) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % frames.length), QR_FRAME_INTERVAL_MS);
    return () => clearInterval(id);
  }, [frames.length]);
  if (frames.length === 0) return null;
  const count = Math.min(QR_MAX_OBSERVATIONS, evidence.length - batch * QR_MAX_OBSERVATIONS);
  return (
    <div className="qr-card" style={{ border: "1px solid var(--rule)" }}>
      <QrCode value={frames[frame % frames.length]} label={t("pp.title")} />
      <span className="caption ink2 num">
        {t(count === 1 ? "pass.batch.one" : "pass.batch", { i: batch + 1, n: batches.length, count })}
      </span>
      <span className="caption">{t("pp.qrHint")}</span>
      {batches.length > 1 ? (
        <Button
          variant="secondary"
          small
          label={t("pass.next")}
          onClick={() => {
            setBatch((b) => (b + 1) % batches.length);
            setFrame(0);
          }}
        />
      ) : null}
    </div>
  );
}

export function PassportView({
  incidentKey,
  held,
  now,
  responder,
}: {
  incidentKey: string;
  held: Observation[];
  now: number;
  responder: boolean;
}) {
  const t = useT();
  const [showQr, setShowQr] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [exact, setExact] = useState(false);
  const p = useMemo(() => passportOf(incidentKey, held, now), [incidentKey, held, now]);
  const back = (responder ? "/responder/incident/" : "/station/incident/") + incidentKey;
  const band = responder ? <StatusBand mode="responder" label={t("band.responder.never")} /> : <ModeBand />;

  if (!p) {
    return (
      <main className="screen">
        {band}
        <BackBar label={t("inc.back")} fallback={back} />
        <div className="pad" style={{ paddingTop: 24 }}>
          <Notice message={t("inc.gone")} />
        </div>
      </main>
    );
  }

  const [phones, reports] = evidenceText(t, p.independentSourceCount, p.reportCount);
  const status =
    p.currentStatus === "resolved"
      ? t("stamp.resolved")
      : p.currentStatus === "acknowledged"
        ? t("inc.status.acked")
        : t("inc.status.open");
  const fresh = t(FRESH_WORD[p.freshness.state]);
  const me = responder ? "" : sourceLabel(deviceIdSync());
  const log = logLines(p.evidenceTimeline.map((e) => ({ ...e, created_at: iso(e.at) })), me, t);

  const copy = () =>
    navigator.clipboard
      ?.writeText(EXPORTERS.json.render(exact ? p : coarsePassport(p)))
      .then(() => setNote(t("field.copied")))
      .catch(() => setNote(t("field.copyFailed"))) ?? setNote(t("field.copyFailed"));

  return (
    <main className="screen">
      {band}
      <div className="no-print">
        <BackBar label={t("inc.back")} fallback={back} />
      </div>
      <div className="pad stack gap2" style={{ paddingTop: 24, paddingBottom: 8 }}>
        <h1 className="title">{t("pp.title")}</h1>
        <p className="caption ink2 num">
          {t("pp.generated", { time: clock(iso(p.generatedAt)) })} · #{p.incidentId.slice(0, 8).toUpperCase()}
        </p>
      </div>

      <FactList
        rows={[
          { label: t("pp.what"), value: t.cat(p.category), strong: true },
          { label: t("pp.where"), value: p.location.areaText ?? t("cov.unnamed") },
          { label: t("pp.status"), value: status },
          { label: t("pp.evidence"), value: `${phones} · ${reports}` },
          {
            label: t("pp.seen"),
            value: t("pp.seenValue", { first: clock(iso(p.firstObservedAt)), last: clock(iso(p.lastObservedAt)) }),
          },
          { label: t("fact.freshness"), value: fresh.charAt(0).toUpperCase() + fresh.slice(1) },
          {
            label: t("fact.people"),
            value: p.affectedPeople.upTo === null ? t("fact.people.none") : t("fact.people.value", { n: peopleText(t, p.affectedPeople.upTo) }),
          },
          ...(p.spatialExtent.metres > 0 ? [{ label: t("fact.spread"), value: t("fact.spread.value", { m: p.spatialExtent.metres }) }] : []),
        ]}
      />

      <section className="pad stack gap2" style={{ paddingTop: 24 }}>
        <h2 className="heading">{t("pp.uncertain")}</h2>
        {p.uncertainty.length === 0 ? (
          <p className="body ink2">{t("pp.uncNone")}</p>
        ) : (
          <ul className="stack gap1 body" style={{ margin: 0, paddingLeft: 20 }}>
            {p.uncertainty.map((u) => (
              <li key={u}>{t(`pp.unc.${u}` as CopyKey)}</li>
            ))}
          </ul>
        )}
        {p.unknowns.notYetReportedNearby.length > 0 ? (
          <>
            <h2 className="heading" style={{ marginTop: 16 }}>
              {t("gap.unheard")}
            </h2>
            <p className="body ink2">{p.unknowns.notYetReportedNearby.map((c) => t.cat(c)).join(" · ")}</p>
          </>
        ) : null}
      </section>

      <section className="pad stack gap2" style={{ paddingTop: 24 }}>
        <h2 className="heading">{t("pp.caveatsTitle")}</h2>
        <ul className="stack gap1 body" style={{ margin: 0, paddingLeft: 20 }}>
          <li>{t.caveats.counts}</li>
          <li>{t("pp.cav.checked")}</li>
          <li>{t.caveats.noReport}</li>
        </ul>
      </section>

      <section className="pad" style={{ paddingTop: 24 }}>
        <h2 className="heading" style={{ marginBottom: 8 }}>
          {t("pp.log")}
        </h2>
        {log.map((l) => (
          <LogEntry key={l.id} time={l.time} what={l.what} detail={l.detail} operator={l.operator} />
        ))}
      </section>

      <section className="pad stack gap3 no-print" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <h2 className="heading">{t("pp.share")}</h2>
        <Button variant="secondary" label={showQr ? t("pp.hideQr") : t("pp.showQr")} onClick={() => setShowQr(!showQr)} />
        {showQr ? <PassportQr evidence={p.supportingEvidence} t={t} /> : null}
        <label className="row gap2 body">
          <input type="checkbox" checked={exact} onChange={(e) => setExact(e.target.checked)} />
          {t("pp.exact")}
        </label>
        <p className="caption ink2">{exact ? t("pp.exactNote") : t("pp.coarseNote")}</p>
        <div className="row gap2 wrap">
          <div>
            <Button variant="secondary" small label={t("pp.json")} onClick={() => download(exact ? p : coarsePassport(p), "json")} />
          </div>
          <div>
            <Button variant="secondary" small label={t("pp.csv")} onClick={() => download(exact ? p : coarsePassport(p), "csv")} />
          </div>
          <div>
            <Button variant="secondary" small label={t("pp.copy")} onClick={() => void copy()} />
          </div>
          <div>
            <Button variant="secondary" small label={t("pp.print")} onClick={() => window.print()} />
          </div>
        </div>
        {note ? (
          <p className="caption" role="status">
            {note}
          </p>
        ) : null}
      </section>
    </main>
  );
}
