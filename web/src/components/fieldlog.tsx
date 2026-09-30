/**
 * P1 field-test log (spec §10): summary + export of this phone's transfer
 * log, on Settings and the Station screen. Local only; export is by hand.
 * Added to DESIGN_BRIEF §12 (TransferLogSection).
 */
import { useState } from "react";

import { useT } from "../design/i18n";
import { deviceIdSync } from "../storage/device";
import { clearTransferLog, summarize, transferLog } from "../storage/transferLog";

import { Button } from "./kit";

export function TransferLogSection() {
  const t = useT();
  const log = transferLog.use();
  const s = summarize(log);
  const [note, setNote] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);

  const json = () =>
    JSON.stringify(
      // Pseudonymous: the same 6-character label the incident log shows.
      { exportedAt: new Date().toISOString(), phone: deviceIdSync().slice(0, 6), summary: s, entries: log },
      null,
      2,
    );

  const copy = () =>
    navigator.clipboard
      ?.writeText(json())
      .then(() => setNote(t("field.copied")))
      .catch(() => setNote(t("field.copyFailed"))) ?? setNote(t("field.copyFailed"));

  const download = () => {
    const url = URL.createObjectURL(new Blob([json()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `pasabi-transfers-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const clear = () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    setNote(null);
    void clearTransferLog();
  };

  return (
    <section className="stack gap3">
      <h2 className="heading">{t("field.title")}</h2>
      <p className="caption ink2">{t("field.hint")}</p>
      {log.length === 0 ? (
        <p className="body ink2">{t("field.none")}</p>
      ) : (
        <>
          <p className="body num">{t("field.finished", { done: s.completed, total: s.total })}</p>
          {s.medianMs !== null ? (
            <p className="body num">{t("field.median", { s: Math.round(s.medianMs / 1000) })}</p>
          ) : null}
          <div className="row gap2 wrap">
            <div>
              <Button variant="secondary" small label={t("field.copy")} onClick={() => void copy()} />
            </div>
            <div>
              <Button variant="secondary" small label={t("field.download")} onClick={download} />
            </div>
            <div>
              <Button variant="quiet" small label={armed ? t("field.clearConfirm") : t("field.clear")} onClick={clear} />
            </div>
          </div>
          {note ? (
            <p className="caption" role="status">
              {note}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
