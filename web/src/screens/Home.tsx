/**
 * R1 Home (SCREENS.md): say what's on this phone, and put Report under the
 * thumb. Actions live in the bottom half. R8 "I'm safe" opens as a sheet.
 * No map, no feed, no incident list, no score (SCREENS.md "Do not").
 */
import { useState } from "react";

import { canCreate, SAFE_CHECKIN, type Observation } from "@pasabi/core";

import { ActionBlock, Button, CountWidget, SlipCard, slipStamps, Stamp, StatusBand } from "../components/kit";
import { clock, retryAt, urgentCount } from "../design/format";
import { useT, type T } from "../design/i18n";
import { useNow, usePicture } from "../hooks";
import { Link } from "../router";
import { deviceIdSync } from "../storage/device";
import { createReport, observations } from "../storage/observations";

export function slipTitle(o: Observation, t: T): string {
  const cat = o.category ? t.cat(o.category) : "";
  return o.area_text ? `${cat} · ${o.area_text}` : cat;
}

export function Home() {
  const t = useT();
  const held = observations.use();
  const now = useNow();
  const { incidents } = usePicture(held, now);
  const me = deviceIdSync();
  const [safeOpen, setSafeOpen] = useState(false);

  const reports = held.filter((o) => o.type === "REPORT");
  const last = reports
    .filter((o) => o.own && o.category !== SAFE_CHECKIN)
    .sort((a, b) => b.created_at - a.created_at)[0];

  // BR-010: six own reports per hour. Say when the window reopens.
  const limited = !canCreate(held, me, now);
  const reopensAt = limited ? retryAt(held, me, now) : null;
  const urgent = urgentCount(reports, incidents);

  return (
    <main className="screen">
      <StatusBand mode="resident" showLang />
      <div className="pad stack gap3" style={{ paddingTop: 16 }}>
        <div className="row between">
          <span className="wordmark">PASAbi</span>
          <span className="row gap4 small">
            <Link to="/mine">{t("home.mine")}</Link>
            <Link to="/settings">{t("home.settings")}</Link>
          </span>
        </div>
        <CountWidget
          count={reports.length}
          label={reports.length === 0 ? t("home.countEmpty") : t("home.count")}
          side={urgent > 0 ? t("home.urgent", { n: urgent }) : undefined}
        />
        {last ? (
          <SlipCard
            id={last.id}
            eyebrow={t("home.last")}
            time={clock(last.created_at)}
            title={slipTitle(last, t)}
            stamps={slipStamps(last, t)}
            to={`/slip/${last.id}`}
          />
        ) : null}
      </div>

      <div className="spacer" />

      <div className="pad stack gap2" style={{ paddingBottom: 32 }}>
        <div>
          <Button variant="quiet" resident label={t("action.safe")} onClick={() => setSafeOpen(true)} disabled={limited} />
        </div>
        <div className="row gap2">
          <ActionBlock tone="ballpen" icon="passOn" label={t("action.passOn")} to="/pass" />
          <ActionBlock tone="ink" icon="receive" label={t("action.receive")} to="/receive" />
        </div>
        <ActionBlock
          tone="coral"
          icon="report"
          label={t("action.report")}
          sub={reopensAt ? t("home.rateLimit", { time: clock(reopensAt) }) : t("action.report.sub")}
          to="/report"
          disabled={limited}
        />
      </div>

      {safeOpen ? <SafeSheet onClose={() => setSafeOpen(false)} /> : null}
    </main>
  );
}

/** R8: one step. Area text is required for a check-in (BR-006, R-7). */
function SafeSheet({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [area, setArea] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const checkIn = async () => {
    if (!area.trim() || busy) return;
    setBusy(true);
    try {
      setSavedId(await createReport({ category: SAFE_CHECKIN, area_text: area }, deviceIdSync()));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="safe-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="safe-title" className="heading">
          {t("safe.title")}
        </h2>
        {savedId ? (
          <>
            <div className="slip">
              <span className="heading">
                {t.cat(SAFE_CHECKIN)} · {area.trim()}
              </span>
              <Stamp seed={savedId} label={t("stamp.saved")} ink="black" justEarned />
              <span className="small ink2">{t("slip.status.saved")}</span>
            </div>
            <Button label={t("action.done")} onClick={onClose} />
          </>
        ) : (
          <form
            className="stack gap4"
            onSubmit={(e) => {
              e.preventDefault();
              void checkIn();
            }}
          >
            <label className="field">
              <span className="body strong">{t("report.landmark")}</span>
              <input className="input" value={area} onChange={(e) => setArea(e.target.value)} autoFocus maxLength={80} />
            </label>
            <Button type="submit" label={t("safe.go")} disabled={!area.trim() || busy} />
            <Button variant="quiet" resident label={t("nav.cancel")} onClick={onClose} />
          </form>
        )}
      </div>
    </div>
  );
}
