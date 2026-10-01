/**
 * StartupAsk (DESIGN_BRIEF §12): location, asked at every launch until on
 * (team decision, 2026-09-30). "Allow" raises the browser's prompt; nothing
 * is switched on by the app. "Not now" hides the sheet until next launch.
 */
import { useState } from "react";

import { useT } from "../design/i18n";
import { location, requestLocation } from "../permissions";

import { Button } from "./kit";

export function StartupAsk() {
  const t = useT();
  const loc = location.use();
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (dismissed || (loc !== "prompt" && loc !== "denied")) return null;

  const allow = async () => {
    setBusy(true);
    try {
      await requestLocation();
    } finally {
      setBusy(false);
    }
  };

  // After a refusal the browser never asks again, so only "Continue" is left.
  const canAsk = loc === "prompt";

  return (
    <div className="scrim">
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="start-title">
        <h2 id="start-title" className="heading">
          {t("start.title")}
        </h2>
        <p className="body">{t("start.body")}</p>
        <dl className="facts body" style={{ margin: 0, padding: 0, border: 0 }}>
          <dt>{t("start.loc")}</dt>
          <dd>{canAsk ? t("start.locWhy") : t("start.locDenied")}</dd>
        </dl>
        {canAsk ? <Button label={t("start.allow")} disabled={busy} onClick={() => void allow()} /> : null}
        <div>
          <Button
            variant="quiet"
            resident
            label={canAsk ? t("start.later") : t("start.continue")}
            onClick={() => setDismissed(true)}
          />
        </div>
      </div>
    </div>
  );
}
