/**
 * S4 Station: what this station holds, upload when there is internet
 * (FR-009), the expected areas that feed coverage (FR-017, moved here from
 * the cut S3), and leaving station mode.
 */
import { useState, type FormEvent } from "react";

import { EXPECTED_AREAS_MAX, normalizeArea } from "@pasabi/core";

import { FactList } from "../components/incident";
import { Button, CountWidget, ModeBand, Notice, TabBar } from "../components/kit";
import { clock } from "../design/format";
import { useT } from "../design/i18n";
import { useOnline } from "../hooks";
import { navigate } from "../router";
import { observations, storeCapacity } from "../storage/observations";
import { disableStation, expectedAreas, saveExpectedAreas, station } from "../storage/station";
import { isConfigured, lastUpload, uploadPending } from "../storage/uplink";

type UploadState = { kind: "idle" } | { kind: "busy" } | { kind: "done"; n: number } | { kind: "failed"; detail: string };

export function StationStatus() {
  const t = useT();
  const held = observations.use();
  const s = station.use();
  const uploadedAt = lastUpload.use();
  const expected = expectedAreas.use();
  const online = useOnline();
  const [upload, setUpload] = useState<UploadState>({ kind: "idle" });
  const [area, setArea] = useState("");
  const [areaNote, setAreaNote] = useState<string | null>(null);

  const doUpload = async () => {
    setUpload({ kind: "busy" });
    try {
      const r = await uploadPending();
      setUpload(r.error ? { kind: "failed", detail: r.error } : { kind: "done", n: r.uploaded });
    } catch (e) {
      setUpload({ kind: "failed", detail: e instanceof Error ? e.message : String(e) });
    }
  };

  const addArea = async (e: FormEvent) => {
    e.preventDefault();
    const a = area.trim();
    if (!a) return;
    if (expected.some((x) => normalizeArea(x) === normalizeArea(a))) {
      setArea("");
      return;
    }
    if (expected.length >= EXPECTED_AREAS_MAX) {
      setAreaNote(t("station.expected.full"));
      return;
    }
    await saveExpectedAreas([...expected, a]);
    setArea("");
    setAreaNote(null);
  };

  return (
    <main className="screen">
      <ModeBand />
      <div className="pad stack gap5" style={{ paddingTop: 24, paddingBottom: 32 }}>
        <h1 className="title">{t("station.title")}</h1>
        <CountWidget
          count={held.filter((o) => o.type === "REPORT").length}
          label={t("station.held")}
          side={t("station.storage", {
            n: held.length.toLocaleString("en"),
            max: storeCapacity().toLocaleString("en"),
          })}
        />
      </div>
      <FactList
        rows={[
          { label: t("station.lastUpload"), value: uploadedAt ? clock(uploadedAt) : t("station.never") },
          { label: t("station.connection"), value: online ? t("band.online") : t("band.offline.station") },
          { label: t("station.name"), value: s.name ?? "" },
        ]}
      />

      <div className="pad stack gap3" style={{ paddingTop: 24 }}>
        {!isConfigured() ? (
          <Notice message={t("station.notConnected")} detail="VITE_SUPABASE_URL · VITE_SUPABASE_ANON_KEY" />
        ) : (
          <>
            <Button
              label={t("station.upload")}
              disabled={!online || upload.kind === "busy"}
              onClick={() => void doUpload()}
            />
            {!online ? <p className="caption ink2">{t("station.needsNet")}</p> : null}
            {upload.kind === "done" ? (
              <p className="body strong" role="status">
                {t("station.uploaded", { n: upload.n })}
              </p>
            ) : null}
            {upload.kind === "failed" ? (
              <Notice
                message={t("station.uploadFailed")}
                detail={upload.detail}
                action={<Button variant="secondary" small label={t("station.retry")} onClick={() => void doUpload()} />}
              />
            ) : null}
          </>
        )}
      </div>

      <section className="pad stack gap3" style={{ paddingTop: 32 }}>
        <h2 className="heading">{t("station.expected")}</h2>
        <p className="caption ink2">{t("station.expected.hint")}</p>
        <form className="row gap2" onSubmit={(e) => void addArea(e)}>
          <input
            className="input"
            value={area}
            maxLength={60}
            placeholder={t("station.expected.ph")}
            aria-label={t("station.expected")}
            onChange={(e) => setArea(e.target.value)}
          />
          <div style={{ flex: "none" }}>
            <Button type="submit" variant="secondary" small label={t("station.expected.add")} />
          </div>
        </form>
        {areaNote ? <p className="caption bold">{areaNote}</p> : null}
        <div>
          {expected.map((a) => (
            <div key={a} className="row between ruled" style={{ minHeight: 44 }}>
              <span className="body">{a}</span>
              <button
                className="back-link"
                aria-label={t("station.expected.remove", { area: a })}
                onClick={() => void saveExpectedAreas(expected.filter((x) => x !== a))}
              >
                −
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="pad" style={{ paddingTop: 32, paddingBottom: 32 }}>
        <Button
          variant="quiet"
          label={t("station.leave")}
          onClick={() => void disableStation().then(() => navigate("/", { replace: true }))}
        />
      </div>
      <div className="spacer" />
      <TabBar />
    </main>
  );
}
