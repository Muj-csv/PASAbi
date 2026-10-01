/**
 * W1 Responder view (FR-010), single column (D-029). No second engine:
 * the same compute() / evidenceOf() the phones run, over rows read back
 * from the database, and the same ledger components. Read-only.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  changesSince,
  compute,
  coverageByArea,
  fromServerRow,
  snapshotOf,
  wasUploadedBefore,
  type Category,
  type IncidentChange,
  type Observation,
} from "@pasabi/core";

import { Button, Notice, StatusBand } from "../components/kit";
import { clock } from "../design/format";
import { useT } from "../design/i18n";
import { useNow, usePicture } from "../hooks";
import { kvGet, kvSet, live } from "../storage/kv";
import { nowSeconds } from "../storage/observations";
import { fetchObservations, isConfigured } from "../storage/uplink";

import { IncidentDetail } from "./Incident";
import { PassportView } from "./Passport";
import { CoverageSection, LedgerHeader, LedgerList } from "./Ledger";

const LAST_VISIT_KEY = "responder.lastVisit.v1";

interface Loaded {
  observations: Observation[];
  loadedAt: number;
  changes: Map<string, IncidentChange[]>;
}

/** Kept for the detail route, so opening an incident doesn't refetch. */
const data = live<Loaded | null>(null);

async function load(): Promise<void> {
  const rows = await fetchObservations();
  const now = nowSeconds();
  const obs = rows.map(fromServerRow);
  const cutoff = (await kvGet<number>(LAST_VISIT_KEY)) ?? null;
  const past =
    cutoff === null
      ? null
      : snapshotOf(compute(rows.filter((r) => wasUploadedBefore(r, cutoff)).map(fromServerRow), now), cutoff);
  data.set({ observations: obs, loadedAt: now, changes: changesSince(past, compute(obs, now)) });
  await kvSet(LAST_VISIT_KEY, now);
}

export function Responder() {
  const t = useT();
  const loaded = data.use();
  const now = useNow();
  const [status, setStatus] = useState<"loading" | "ready" | "error">(loaded ? "ready" : "loading");
  const [filter, setFilter] = useState<Category | null>(null);

  const refresh = useCallback(() => {
    setStatus("loading");
    load().then(
      () => setStatus("ready"),
      () => setStatus("error"),
    );
  }, []);

  useEffect(() => {
    if (isConfigured() && !data.get()) {
      load().then(
        () => setStatus("ready"),
        () => setStatus("error"),
      );
    }
  }, []);

  const held = useMemo(() => loaded?.observations ?? [], [loaded]);
  const { incidents, evidence } = usePicture(held, now);
  const coverage = useMemo(() => coverageByArea(held, now), [held, now]);

  const band = (
    <StatusBand
      mode="responder"
      label={loaded ? t("band.responder", { time: clock(loaded.loadedAt) }) : t("band.responder.never")}
    />
  );

  if (!isConfigured()) {
    return (
      <main className="screen">
        {band}
        <div className="pad" style={{ paddingTop: 24 }}>
          <Notice message={t("station.notConnected")} detail="VITE_SUPABASE_URL · VITE_SUPABASE_ANON_KEY" />
        </div>
      </main>
    );
  }

  const changes = loaded?.changes ?? new Map<string, IncidentChange[]>();
  const count = (c: IncidentChange) => [...changes.values()].filter((l) => l.includes(c)).length;
  const since = [
    count("new") ? t("resp.new", { n: count("new") }) : null,
    count("newly_corroborated") ? t("resp.more", { n: count("newly_corroborated") }) : null,
    count("escalated") ? t("resp.up", { n: count("escalated") }) : null,
    count("resolved") ? t("resp.resolved", { n: count("resolved") }) : null,
  ].filter(Boolean);

  const open = incidents.filter((i) => i.status !== "resolved");
  const shown = filter ? incidents.filter((i) => i.category === filter) : incidents;
  const categories = [...new Set(incidents.map((i) => i.category))];

  return (
    <main className="screen">
      {band}
      {status === "error" ? (
        <div className="pad" style={{ paddingTop: 16 }}>
          <Notice message={t("resp.error")} action={<Button variant="secondary" small label={t("err.tryAgain")} onClick={refresh} />} />
        </div>
      ) : null}
      {status === "loading" && !loaded ? <p className="pad body ink2" style={{ paddingTop: 24 }}>{t("resp.loading")}</p> : null}

      {loaded ? (
        <>
          <LedgerHeader
            open={open.length}
            resolved={incidents.length - open.length}
            lastUpdate={null}
            allOld={open.length > 0 && open.every((i) => evidence.get(i.key)?.freshness === "stale")}
          />
          <div className="pad stack gap1" style={{ paddingTop: 12 }}>
            <span className="caption ink2">{t("resp.since")}</span>
            <span className="small strong" style={{ color: "var(--ballpen)" }}>
              {since.length > 0 ? since.join(" · ") : t("resp.nothing")}
            </span>
          </div>
          {categories.length > 1 ? (
            <div className="filter-chips">
              <button aria-pressed={filter === null} onClick={() => setFilter(null)}>
                {t("resp.all")}
              </button>
              {categories.map((c) => (
                <button key={c} aria-pressed={filter === c} onClick={() => setFilter(c)}>
                  {t.cat(c)}
                </button>
              ))}
            </div>
          ) : null}
          {held.length === 0 ? (
            <p className="pad body ink2" style={{ paddingTop: 24 }}>{t("resp.empty")}</p>
          ) : (
            <LedgerList incidents={shown} evidence={evidence} changes={changes} base="/responder/incident/" />
          )}
          <CoverageSection coverage={coverage} />
          <div className="pad" style={{ paddingTop: 24, paddingBottom: 48 }}>
            <Button variant="secondary" label={t("resp.refresh")} onClick={refresh} disabled={status === "loading"} />
          </div>
        </>
      ) : null}
    </main>
  );
}

export function ResponderIncident({ incidentKey }: { incidentKey: string }) {
  const loaded = data.use();
  const now = useNow();
  useEffect(() => {
    if (!loaded && isConfigured()) void load();
  }, [loaded]);
  return <IncidentDetail incidentKey={incidentKey} held={loaded?.observations ?? []} now={now} readOnly />;
}

export function ResponderPassport({ incidentKey }: { incidentKey: string }) {
  const loaded = data.use();
  const now = useNow();
  useEffect(() => {
    if (!loaded && isConfigured()) void load();
  }, [loaded]);
  return <PassportView incidentKey={incidentKey} held={loaded?.observations ?? []} now={now} responder />;
}
