/**
 * R5 Receive (FR-013): collect another phone's frames in any order, apply
 * the page through receiveObservations() (the one ingest path, R0), then
 * show a one-frame receipt for the sender to scan back. Nothing is applied
 * until the batch is complete (BundleAssembler).
 */
import { useRef, useState } from "react";

import { BundleAssembler, encodeReceipt } from "@pasabi/core";

import { BackBar, Button, ModeBand, Notice, TabBar } from "../components/kit";
import { QrCode, QrScanner, useWakeLock, type CameraState } from "../components/qr";
import { useT } from "../design/i18n";
import { deviceIdSync } from "../storage/device";
import { receiveObservations } from "../storage/observations";
import { station } from "../storage/station";

const TIPS = ["err.cantRead", "err.cantRead.2", "err.cantRead.3"] as const;

type Done = { bundleId: string; received: number; added: number };

export function Receive() {
  const t = useT();
  const isStation = station.use().enabled;
  const assembler = useRef(new BundleAssembler());
  const applying = useRef(false);
  const tip = useRef(0);
  const [progress, setProgress] = useState({ received: 0, total: 0 });
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [camera, setCamera] = useState<CameraState>("starting");
  const [cameraKey, setCameraKey] = useState(0);

  useWakeLock(showReceipt);

  const onCode = async (text: string) => {
    if (done !== null || applying.current) return;
    const before = assembler.current.received;
    const result = assembler.current.accept(text);
    if (result.kind === "progress") {
      setProgress({ received: result.received, total: result.total });
      setMessage(null);
    } else if (result.kind === "wrong-bundle") {
      setMessage(t("recv.wrongBatch"));
    } else if (result.kind === "invalid") {
      // Every frame arrived but did not decode: the assembler reset itself.
      if (before > 0 && assembler.current.received === 0) {
        setProgress({ received: 0, total: 0 });
        setMessage(t("err.cantRead"));
      }
    } else {
      applying.current = true;
      try {
        const added = await receiveObservations(result.observations);
        setDone({ bundleId: result.bundleId, received: result.observations.length, added });
      } finally {
        applying.current = false;
      }
    }
  };

  const reset = () => {
    assembler.current.reset();
    setProgress({ received: 0, total: 0 });
    setMessage(null);
    setDone(null);
    setShowReceipt(false);
  };

  const back = isStation ? null : <BackBar label={t("nav.back")} fallback="/" resident />;

  if (done) {
    return (
      <main className="screen">
        <ModeBand />
        {back}
        <div className="pad stack gap4" style={{ paddingTop: 24, paddingBottom: 24 }}>
          <div>
            <p className="display num">{t("recv.got", { n: done.received })}</p>
            <p className="heading">{t("recv.new", { m: done.added })}</p>
          </div>
          {showReceipt ? (
            <div className="qr-card" style={{ border: "1px solid var(--rule)" }}>
              <QrCode
                value={encodeReceipt({
                  bundleId: done.bundleId,
                  role: isStation ? "station" : "resident",
                  deviceId: deviceIdSync(),
                })}
                label={t("recv.showReceipt")}
              />
              <span className="body">{t("recv.receiptHint")}</span>
            </div>
          ) : (
            <Button label={t("recv.showReceipt")} onClick={() => setShowReceipt(true)} />
          )}
          <div>
            <Button variant="quiet" resident={!isStation} label={t("recv.again")} onClick={reset} />
          </div>
          <p className="caption ink2">{t("pass.swap")}</p>
        </div>
        {isStation ? <TabBar /> : null}
      </main>
    );
  }

  const pct = progress.total > 0 ? Math.round((progress.received / progress.total) * 100) : 0;

  return (
    <main className="screen">
      <ModeBand />
      {back}
      <div className="pad stack gap4" style={{ paddingTop: 16, paddingBottom: 24 }}>
        <h1 className="title">{t("recv.title")}</h1>
        <p className="body">{t("recv.aim")}</p>
        {camera === "denied" ? (
          <Notice
            message={t("err.camera")}
            detail={t("err.cameraHint")}
            action={<Button variant="secondary" small label={t("err.tryAgain")} onClick={() => setCameraKey((k) => k + 1)} />}
          />
        ) : (
          <QrScanner
            key={cameraKey}
            onCode={(text) => void onCode(text)}
            onState={setCamera}
            onIdle={() => setMessage(t(TIPS[tip.current++ % TIPS.length]))}
          />
        )}
        {progress.total > 0 ? (
          <div className="stack gap2">
            <div
              className="progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-valuenow={progress.received}
            >
              <div style={{ width: `${pct}%` }} />
            </div>
            <span className="caption num">{t("recv.progress", { i: progress.received, n: progress.total })}</span>
          </div>
        ) : null}
        {message ? (
          <p className="body bold" role="status">
            {message}
          </p>
        ) : null}
        <p className="caption ink2">{t("pass.swap")}</p>
      </div>
      {isStation ? <TabBar /> : null}
    </main>
  );
}
