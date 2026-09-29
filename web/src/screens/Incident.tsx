/**
 * S2 Incident, the locked anchor (SCREENS.md): how we know this, how fresh
 * it is, what we haven't heard, and the operator's actions. Also the
 * responder's read-only detail (W1), fed from uploaded observations.
 */
import { useMemo, useState } from "react";

import {
  compute,
  evidenceOf,
  gapsFor,
  sourceLabel,
  type Observation,
  type TimelineEntry,
} from "@pasabi/core";

import { EvidenceCounts, FactList, GapList, LogEntry, WhyFirst } from "../components/incident";
import { BackBar, Button, ModeBand, Notice, Stamp, StatusBand, UndoBar } from "../components/kit";
import { ago, clock, FRESH_GLYPH, FRESH_WORD, ordinal, placeOf, whyLines } from "../design/format";
import { useT, type T } from "../design/i18n";
import { Pictogram } from "../design/pictograms";
import { navigate } from "../router";
import { deviceIdSync } from "../storage/device";
import { addStatusObservation } from "../storage/observations";

function logLines(timeline: TimelineEntry[], me: string, t: T) {
  const seen = new Set<string>();
  return timeline.map((e) => {
    const src = `#${e.source.toUpperCase()}`;
    if (e.type === "REPORT") {
      const again = seen.has(e.source);
      seen.add(e.source);
      const detail = [e.people ? t("slip.people", { n: e.people }) : null, e.note ?? null].filter(Boolean).join(" · ");
      return {
        id: e.id,
        time: clock(e.created_at),
        what: again ? t("log.reportedAgain", { src }) : t("log.reported", { src }),
        detail: detail || undefined,
        operator: false,
      };
    }
    const here = e.source === me;
    const what =
      e.action === "ACK"
        ? here ? t("log.acked") : t("log.ackedBy", { src })
        : here ? t("log.resolved") : t("log.resolvedBy", { src });
    return { id: e.id, time: clock(e.created_at), what, detail: undefined, operator: true };
  });
}

export function IncidentDetail({
  incidentKey,
  held,
  now,
  readOnly,
}: {
  incidentKey: string;
  held: Observation[];
  now: number;
  /** Responder view: responders read; stations act (SCREENS.md W1). */
  readOnly: boolean;
}) {
  const t = useT();
  const [justAcked, setJustAcked] = useState(false);
  const [resolving, setResolving] = useState(false);
  const back = readOnly ? "/responder" : "/station";

  const view = useMemo(() => {
    const incidents = compute(held, now);
    const incident = incidents.find((i) => i.key === incidentKey);
    if (!incident) return null;
    const open = incidents.filter((i) => i.status !== "resolved");
    return {
      incident,
      incidents,
      evidence: evidenceOf(incident, held, now),
      gaps: gapsFor(incident, incidents, held),
      rank: open.findIndex((i) => i.key === incidentKey) + 1,
      openCount: open.length,
    };
  }, [held, now, incidentKey]);

  const band = readOnly ? <StatusBand mode="responder" label={t("band.responder.never")} /> : <ModeBand />;

  if (!view) {
    // Keys follow the smallest member ID, so a new report can re-key an incident.
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

  const { incident: i, evidence: ev, gaps } = view;
  const me = readOnly ? "" : sourceLabel(deviceIdSync());
  const lastAck = [...ev.timeline].reverse().find((e) => e.action === "ACK");
  const lastResolve = [...ev.timeline].reverse().find((e) => e.action === "RESOLVE");
  const acked = i.status === "acknowledged";
  const resolved = i.status === "resolved";

  const statusLine = resolved
    ? t("inc.status.resolved", { time: lastResolve ? clock(lastResolve.created_at) : "" })
    : acked
      ? t("inc.status.acked")
      : t("inc.status.open");

  const freshWord = t(FRESH_WORD[ev.freshness]);
  const facts = [
    {
      label: t("fact.lastHeard"),
      value: `${FRESH_GLYPH[ev.freshness]} ${clock(ev.lastSeen)} · ${ago(ev.lastSeen, now, t.lang)}`,
      strong: true,
    },
    { label: t("fact.firstHeard"), value: clock(ev.firstSeen) },
    { label: t("fact.freshness"), value: freshWord.charAt(0).toUpperCase() + freshWord.slice(1) },
    {
      label: t("fact.people"),
      value: gaps.peopleUnknown ? t("fact.people.none") : t("fact.people.value", { n: i.peopleAffected }),
    },
    ...(i.spatialExtentM > 0
      ? [{ label: t("fact.spread"), value: t("fact.spread.value", { m: i.spatialExtentM }) }]
      : []),
  ];

  const nearby = gaps.known.map((k) => {
    const related = view.incidents.find((x) => x.key === k.key);
    return {
      category: k.category,
      phones: k.sourceCount,
      time: related ? clock(related.lastSeen) : "",
      to: (readOnly ? "/responder/incident/" : "/station/incident/") + k.key,
    };
  });

  const act = async () => {
    await addStatusObservation("ACK", i.observationIds, deviceIdSync());
    setJustAcked(true);
  };

  return (
    <main className="screen">
      {band}
      <BackBar
        label={t("inc.back")}
        fallback={back}
        right={
          view.rank > 0 ? (
            <span className="caption ink2">{t("inc.rank", { ordinal: ordinal(view.rank, t.lang), n: view.openCount })}</span>
          ) : undefined
        }
      />

      <div className="pad stack gap2" style={{ paddingTop: 24, paddingBottom: 16 }}>
        <div className="row gap3 wrap" style={{ alignItems: "baseline" }}>
          <span className="row gap3">
            <Pictogram category={i.category} size={32} />
            <h1 className="title">{t.cat(i.category)}</h1>
          </span>
          <span className="body ink2">{placeOf(i, t)}</span>
        </div>
        <p className="small ink2">{statusLine}</p>
        {acked && lastAck ? (
          <div style={{ paddingTop: 4 }}>
            <Stamp
              large
              seed={i.key + ":ack"}
              ink="coral"
              label={t("stamp.acknowledgedAt", { time: clock(lastAck.created_at) })}
              justEarned={justAcked}
            />
          </div>
        ) : null}
      </div>

      <EvidenceCounts phones={ev.sourceCount} reports={ev.reportCount} />
      <FactList rows={facts} />
      {resolved ? null : (
        <WhyFirst ordinal={ordinal(view.rank, t.lang)} lines={whyLines(i, t)} total={i.breakdown.total} />
      )}
      <GapList nearby={nearby} unheard={gaps.unknown} />

      <div className="pad" style={{ paddingTop: 32, paddingBottom: 24 }}>
        <h2 className="heading" style={{ marginBottom: 8 }}>
          {t("log.title")}
        </h2>
        {logLines(ev.timeline, me, t).map((l) => (
          <LogEntry key={l.id} time={l.time} what={l.what} detail={l.detail} operator={l.operator} />
        ))}
      </div>

      {readOnly || resolved ? null : (
        <div className="pinned action-bar" style={{ bottom: 0 }}>
          <Button
            label={acked ? t("stamp.acknowledged") : t("action.ack")}
            disabled={acked}
            onClick={() => void act()}
          />
          <Button variant="secondary" label={t("action.resolve")} disabled={resolving} onClick={() => setResolving(true)} />
        </div>
      )}

      {resolving ? (
        <UndoBar
          message={t("undo.resolved")}
          onUndo={() => setResolving(false)}
          onCommit={() => {
            // Created only after the undo window: observations are immutable.
            void addStatusObservation("RESOLVE", i.observationIds, deviceIdSync()).then(() =>
              navigate("/station", { replace: true }),
            );
          }}
        />
      ) : null}
    </main>
  );
}
