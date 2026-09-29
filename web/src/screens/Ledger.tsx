/**
 * S1 Ledger, the locked anchor (SCREENS.md): what needs attention now,
 * where, how we know and how fresh it is. One ranked list; changes are
 * margin marks, not a separate section; coverage is one strip.
 * Small header clock (team decision, 2026-09-29, DESIGN_COUNCIL #2).
 */
import { useMemo } from "react";

import { changesSince, coverageByArea, snapshotOf, type Evidence, type Incident } from "@pasabi/core";

import { Button, CoverageRow, ModeBand, TabBar } from "../components/kit";
import { LedgerRow, rowStamp } from "../components/ledger";
import { clock } from "../design/format";
import { useT } from "../design/i18n";
import { useNow, usePicture } from "../hooks";
import { observations } from "../storage/observations";
import { expectedAreas, saveSnapshot, snapshot } from "../storage/station";

export function Ledger() {
  const held = observations.use();
  const now = useNow();
  const { incidents, evidence } = usePicture(held, now);
  const snap = snapshot.use();
  const expected = expectedAreas.use();
  const changes = useMemo(() => changesSince(snap, incidents), [snap, incidents]);
  const coverage = useMemo(() => coverageByArea(held, now, expected), [held, now, expected]);

  const open = incidents.filter((i) => i.status !== "resolved");
  const resolved = incidents.length - open.length;
  const allOld = open.length > 0 && open.every((i) => evidence.get(i.key)?.freshness === "stale");
  const lastUpdate = held.reduce((m, o) => Math.max(m, o.received_at ?? o.created_at), 0);

  return (
    <main className="screen">
      <ModeBand />
      <LedgerHeader
        open={open.length}
        resolved={resolved}
        lastUpdate={lastUpdate || null}
        allOld={allOld}
        onMarkSeen={() => void saveSnapshot(snapshotOf(incidents, now))}
      />
      <LedgerList incidents={incidents} evidence={evidence} changes={changes} base="/station/incident/" />
      <CoverageSection coverage={coverage} />
      <div style={{ height: 24 }} />
      <TabBar />
    </main>
  );
}

export function LedgerHeader({
  open,
  resolved,
  lastUpdate,
  allOld,
  onMarkSeen,
}: {
  open: number;
  resolved: number;
  lastUpdate: number | null;
  allOld: boolean;
  onMarkSeen?: () => void;
}) {
  const t = useT();
  return (
    <>
      <div className="pad stack gap1" style={{ paddingTop: 24, paddingBottom: 16 }}>
        <h1 className="title">{t("ledger.title")}</h1>
        <p className="caption ink2 num">
          {t("ledger.counts", { open, resolved })}
          {lastUpdate ? ` · ${t("ledger.lastUpdate", { time: clock(lastUpdate) })}` : ""}
        </p>
        {allOld ? <p className="caption bold">{t("ledger.allOld")}</p> : null}
      </div>
      <div className="pad row between ruled" style={{ paddingBottom: 12 }}>
        <span className="caption ink2">{t("ledger.sort")}</span>
        {onMarkSeen ? (
          <div>
            <Button variant="secondary" small label={t("ledger.markSeen")} onClick={onMarkSeen} />
          </div>
        ) : null}
      </div>
    </>
  );
}

export function LedgerList({
  incidents,
  evidence,
  changes,
  base,
}: {
  incidents: Incident[];
  evidence: Map<string, Evidence>;
  changes: Map<string, import("@pasabi/core").IncidentChange[]>;
  base: string;
}) {
  const t = useT();
  if (incidents.length === 0) {
    return <p className="pad body ink2" style={{ paddingTop: 24, paddingBottom: 24 }}>{t("ledger.empty")}</p>;
  }
  // Rank counts open incidents only; resolved rows show "—" (engine sorts them last).
  const ranks = new Map<string, number>();
  for (const i of incidents) if (i.status !== "resolved") ranks.set(i.key, ranks.size + 1);
  return (
    <div>
      {incidents.map((i) => {
        const ev = evidence.get(i.key);
        if (!ev) return null;
        return (
          <LedgerRow
            key={i.key}
            incident={i}
            evidence={ev}
            rank={ranks.get(i.key) ?? null}
            changes={changes.get(i.key)}
            stamp={rowStamp(i, ev, t)}
            to={base + i.key}
          />
        );
      })}
    </div>
  );
}

export function CoverageSection({ coverage }: { coverage: ReturnType<typeof coverageByArea> }) {
  const t = useT();
  return (
    <>
      <div className="section">
        <h2 className="heading">{t("cov.title")}</h2>
        <p className="caption ink2">{t.caveats.coverage}</p>
      </div>
      {coverage.map((c) => (
        <CoverageRow key={c.area ?? "unnamed"} c={c} />
      ))}
    </>
  );
}
