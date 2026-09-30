/**
 * R4 Pass on (FR-013, ADR-008): hand this phone's reports to another phone
 * by cycling QR frames, most urgent first, a page ("batch") at a time.
 * Stamps land ONLY from a scanned receipt (BR-015): nothing is marked
 * passed on just because a code was shown.
 */
import { useEffect, useMemo, useRef, useState } from "react";

import { bundlePages, decodeReceipt, encodeBundle, QR_FRAME_INTERVAL_MS } from "@pasabi/core";

import { BackBar, Button, ModeBand, Notice, TabBar } from "../components/kit";
import { NearbySection } from "../components/nearby";
import { nearby } from "../nearby";
import { QrCode, QrScanner, useWakeLock, type CameraState } from "../components/qr";
import { useT } from "../design/i18n";
import { navigate } from "../router";
import { uuid4 } from "../storage/device";
import { markPassedOn, nowSeconds, observations } from "../storage/observations";
import { recordReceipt } from "../storage/qrReceipts";
import { station } from "../storage/station";

const TIPS = ["err.cantRead", "err.cantRead.2", "err.cantRead.3"] as const;

export function PassOn() {
  const t = useT();
  const isStation = station.use().enabled;
  /** Bluetooth exists (native app): it leads, QR follows. One primary each way. */
  const btFirst = nearby.use().available;
  // Pages come from what the phone held when the screen opened, so a batch
  // never reshuffles under the camera of the phone reading it.
  const [pages] = useState(() => bundlePages(observations.get(), nowSeconds(), new Set()));
  const [pageIndex, setPageIndex] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [mode, setMode] = useState<"show" | "scan">("show");
  const [done, setDone] = useState<{ n: number; station: boolean } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [camera, setCamera] = useState<CameraState>("starting");
  const [cameraKey, setCameraKey] = useState(0);
  const tip = useRef(0);
  /** bundleId → the observation IDs that page carried, to match receipts. */
  const sent = useRef(new Map<string, string[]>());

  const bundle = useMemo(() => {
    const page = pages[pageIndex];
    if (!page || page.length === 0) return null;
    const bundleId = uuid4().replace(/-/g, "").slice(0, 8);
    return { bundleId, ids: page.map((o) => o.id), frames: encodeBundle(page, bundleId) };
  }, [pages, pageIndex]);

  useEffect(() => {
    if (bundle) sent.current.set(bundle.bundleId, bundle.ids);
  }, [bundle]);

  const frames = bundle?.frames.length ?? 0;
  useEffect(() => {
    if (!playing || mode !== "show" || frames < 2) return;
    const id = setInterval(() => setFrameIndex((i) => (i + 1) % frames), QR_FRAME_INTERVAL_MS);
    return () => clearInterval(id);
  }, [playing, mode, frames]);

  useWakeLock(mode === "show" && bundle !== null && done === null);

  const onReceipt = async (text: string) => {
    const receipt = decodeReceipt(text);
    if (!receipt) return; // not a receipt (e.g. a frame): keep looking
    const ids = sent.current.get(receipt.bundleId);
    if (!ids) {
      setMessage(t("pass.wrongReceipt"));
      return;
    }
    await recordReceipt(receipt.deviceId, ids);
    await markPassedOn(ids, receipt.role);
    setDone({ n: ids.length, station: receipt.role === "station" });
  };

  const home = isStation ? "/station" : "/";
  const coral = !isStation;

  if (done) {
    return (
      <main className={coral ? "screen coral" : "screen"}>
        <ModeBand />
        <div className="pad stack gap3" style={{ paddingTop: 48 }}>
          <p className="display num">{t("pass.done", { n: done.n })}</p>
          {done.station ? <p className="heading">{t("pass.doneStation")}</p> : null}
        </div>
        <div className="spacer" />
        <div className="pinned">
          <Button onCoral={coral} label={t("action.done")} onClick={() => navigate(home, { replace: true })} />
        </div>
        {isStation ? <TabBar /> : null}
      </main>
    );
  }

  return (
    <main className={coral ? "screen coral" : "screen"}>
      <ModeBand />
      {isStation ? null : <BackBar label={t("nav.back")} fallback="/" resident />}
      <div className="pad stack gap4" style={{ paddingTop: 16, paddingBottom: 24 }}>
        <h1 className="title">{t("pass.title")}</h1>

        {/* Where Bluetooth exists (native app), Ping is how you pass on;
            the QR stays below as the fallback (2026-09-30). */}
        {mode === "show" && btFirst ? <NearbySection onCoral={coral} primary /> : null}

        {mode === "scan" ? (
          <>
            <p className="body">{t("pass.scanReceiptHint")}</p>
            {camera === "denied" ? (
              <Notice
                message={t("err.camera")}
                detail={t("err.cameraHint")}
                action={
                  <Button variant="secondary" small label={t("err.tryAgain")} onClick={() => setCameraKey((k) => k + 1)} />
                }
              />
            ) : (
              <QrScanner
                key={cameraKey}
                onCode={(text) => void onReceipt(text)}
                onState={setCamera}
                onIdle={() => setMessage(t(TIPS[tip.current++ % TIPS.length]))}
              />
            )}
            {message ? (
              <p className="body bold" role="status">
                {message}
              </p>
            ) : null}
            <Button
              variant="quiet"
              resident={coral}
              label={t("nav.cancel")}
              onClick={() => {
                setMode("show");
                setMessage(null);
              }}
            />
          </>
        ) : bundle === null ? (
          <p className="heading">{t("pass.empty")}</p>
        ) : (
          <>
            <p className="body">{t("pass.hint")}</p>
            <div className="qr-card">
              <QrCode value={bundle.frames[frameIndex % frames]} label={t("pass.title")} />
              <span className="caption ink2 num">
                {t(bundle.ids.length === 1 ? "pass.batch.one" : "pass.batch", {
                  i: pageIndex + 1,
                  n: pages.length,
                  count: bundle.ids.length,
                })}
              </span>
            </div>
            <div className="row gap2">
              {frames > 1 ? (
                <Button
                  variant="secondary"
                  onCoral={coral}
                  small
                  label={playing ? t("pass.pause") : t("pass.resume")}
                  onClick={() => setPlaying(!playing)}
                />
              ) : null}
              {pages.length > 1 ? (
                <Button
                  variant="secondary"
                  onCoral={coral}
                  small
                  label={t("pass.next")}
                  onClick={() => {
                    setPageIndex((i) => (i + 1) % pages.length);
                    setFrameIndex(0);
                  }}
                />
              ) : null}
            </div>
          </>
        )}

        {/* In the browser, Bluetooth sits under the QR and says why it's off. */}
        {mode === "show" && !btFirst ? <NearbySection onCoral={coral} primary={false} /> : null}
      </div>

      <div className="spacer" />
      {mode === "show" && bundle !== null ? (
        <div className="pinned stack gap2">
          <Button
            variant={btFirst ? "secondary" : "primary"}
            onCoral={coral}
            label={t("pass.scanReceipt")}
            onClick={() => {
              setMessage(null);
              setMode("scan");
            }}
          />
          <p className="caption">{t("pass.swap")}</p>
        </div>
      ) : null}
      {isStation ? <TabBar /> : null}
    </main>
  );
}
