/**
 * R6 My reports: Mine (own slips, newest first, with stamps) | Carrying
 * (other phones' reports, read-only, no stamps). Delete is local only and
 * the one screen with a modal confirm (FR-011), then 5 s to undo.
 */
import { useEffect, useRef, useState } from "react";

import { BackBar, Button, SlipCard, slipStamps, StatusBand, UndoBar } from "../components/kit";
import { clock } from "../design/format";
import { useT } from "../design/i18n";
import { Pictogram } from "../design/pictograms";
import { deleteOwnObservation, observations } from "../storage/observations";

import { slipTitle } from "./Home";

export function Mine() {
  const t = useT();
  const held = observations.use();
  const [tab, setTab] = useState<"mine" | "carrying">("mine");
  const [confirming, setConfirming] = useState<string | null>(null);
  // Hidden while the undo window is open; deleted for real on commit.
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (confirming) dialog.current?.showModal();
    else dialog.current?.close();
  }, [confirming]);

  const reports = held
    .filter((o) => o.type === "REPORT" && o.id !== pendingDelete)
    .sort((a, b) => b.created_at - a.created_at);
  const mine = reports.filter((o) => o.own);
  const carrying = reports.filter((o) => !o.own);

  return (
    <main className="screen">
      <StatusBand mode="resident" />
      <BackBar label={t("nav.back")} fallback="/" resident />
      <div className="pad stack gap4" style={{ paddingTop: 16, paddingBottom: 96 }}>
        <h1 className="title">{t("mine.title")}</h1>
        <div className="segmented">
          <button aria-pressed={tab === "mine"} onClick={() => setTab("mine")}>
            {t("mine.tab")}
          </button>
          <button aria-pressed={tab === "carrying"} onClick={() => setTab("carrying")}>
            {t("carrying.tab")}
          </button>
        </div>

        {tab === "mine" ? (
          mine.length === 0 ? (
            <p className="body ink2">{t("mine.empty")}</p>
          ) : (
            mine.map((o) => (
              <SlipCard
                key={o.id}
                id={o.id}
                time={clock(o.created_at)}
                title={slipTitle(o, t)}
                stamps={slipStamps(o, t)}
                to={`/slip/${o.id}`}
                // ponytail: a visible Delete instead of swipe-to-reveal;
                // swipes are undiscoverable and fiddly on the web.
                footer={
                  <div style={{ alignSelf: "flex-end" }}>
                    <Button variant="quiet" resident small label={t("delete.yes")} onClick={() => setConfirming(o.id)} />
                  </div>
                }
              />
            ))
          )
        ) : carrying.length === 0 ? (
          <p className="body ink2">{t("carrying.empty")}</p>
        ) : (
          <div>
            {carrying.map((o) => (
              <div key={o.id} className="gap-line body">
                {o.category ? <Pictogram category={o.category} size={20} /> : <span />}
                <span>{slipTitle(o, t)}</span>
                <span className="small ink2 num">{clock(o.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <dialog ref={dialog} className="confirm" onClose={() => setConfirming(null)}>
        <div className="stack gap4">
          <h2 className="heading">{t("delete.q")}</h2>
          <p className="body">{t("delete.body")}</p>
          <button
            className="btn primary on-coral"
            onClick={() => {
              setPendingDelete(confirming);
              setConfirming(null);
            }}
          >
            {t("delete.yes")}
          </button>
          <Button variant="quiet" resident label={t("delete.no")} onClick={() => setConfirming(null)} />
        </div>
      </dialog>

      {pendingDelete ? (
        <UndoBar
          key={pendingDelete}
          message={t("undo.deleted")}
          onUndo={() => setPendingDelete(null)}
          onCommit={() => {
            // `id` is this bar's own item. A second Delete inside the window
            // swaps the bar, which commits this one; don't clear the new one.
            const id = pendingDelete;
            setPendingDelete((current) => (current === id ? null : current));
            void deleteOwnObservation(id);
          }}
        />
      ) : null}
    </main>
  );
}
