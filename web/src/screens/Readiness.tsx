/**
 * P7 readiness check (spec §11.1): before a disaster, can this station work
 * with no network? Each line is a fact this phone can check now, in words,
 * with what to do when it isn't ready. Reads state; changes nothing.
 */
import { useMemo } from "react";

import { BundleAssembler, encodeBundle, type Observation } from "@pasabi/core";

import { BackBar, ModeBand } from "../components/kit";
import { clock } from "../design/format";
import { useT } from "../design/i18n";
import { Icon } from "../design/pictograms";
import { offlineReady } from "../hooks";
import { location } from "../permissions";
import { persisted } from "./Settings";
import { station, expectedAreas } from "../storage/station";
import { lastUpload } from "../storage/uplink";

/** The QR engine round-trips a sample here, offline, with no camera. */
function qrSelfTest(): boolean {
  const sample: Observation = {
    id: "00000000-0000-4000-8000-000000000001",
    type: "REPORT",
    category: "FLOOD",
    area_text: "Self-test",
    created_at: 1790000000,
    device_id: "00000000-0000-4000-8000-000000000002",
  };
  const a = new BundleAssembler();
  let ok = false;
  for (const f of encodeBundle([sample], "selftest")) ok = a.accept(f).kind === "complete";
  return ok;
}

export function Readiness() {
  const t = useT();
  const ready = offlineReady.use();
  const kept = persisted.use();
  const loc = location.use();
  const s = station.use();
  const areas = expectedAreas.use();
  const uploaded = lastUpload.use();
  const qr = useMemo(() => qrSelfTest(), []);

  const rows: { label: string; ok: boolean; detail: string }[] = [
    { label: t("ready.offline"), ok: ready, detail: ready ? t("start.on") : t("ready.offlineFix") },
    { label: t("ready.storage"), ok: kept, detail: kept ? t("settings.storage.kept") : t("settings.storage.risk") },
    { label: t("ready.name"), ok: !!s.name, detail: s.name ?? t("ready.nameFix") },
    { label: t("station.expected"), ok: areas.length > 0, detail: areas.length > 0 ? areas.join(" · ") : t("ready.areasFix") },
    { label: t("start.loc"), ok: loc === "granted", detail: loc === "granted" ? t("start.on") : t("start.locWhy") },
    { label: t("ready.qr"), ok: qr, detail: qr ? t("ready.qrOk") : t("ready.qrFail") },
    { label: t("station.lastUpload"), ok: uploaded !== null, detail: uploaded ? clock(uploaded) : t("station.never") },
  ];
  const notReady = rows.filter((r) => !r.ok).length;

  return (
    <main className="screen">
      <ModeBand />
      <BackBar label={t("tab.station")} fallback="/station/status" />
      <div className="pad stack gap3" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <h1 className="title">{t("ready.title")}</h1>
        <p className="body strong">{notReady === 0 ? t("ready.allSet") : t("ready.toDo", { n: notReady })}</p>
        {rows.map((r) => (
          <div key={r.label} className="row gap3 ruled" style={{ alignItems: "flex-start", paddingBottom: 12 }}>
            <Icon name={r.ok ? "check" : "dash"} size={20} />
            <div className="stack">
              <span className="body strong">{r.label}</span>
              <span className={r.ok ? "small ink2" : "small"}>{r.detail}</span>
            </div>
          </div>
        ))}
        <p className="caption ink2">{t("ready.note")}</p>
      </div>
    </main>
  );
}
