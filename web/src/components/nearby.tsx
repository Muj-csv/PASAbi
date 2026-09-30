/**
 * Bluetooth pass-on UI (D-033), in DESIGN_BRIEF §12:
 * - NearbyRadar: who is in range.
 * - NearbySection: Pass on, radar + Ping.
 * - NearbyReceive: Receive, waiting for pings.
 * - StartupAsk: Bluetooth + Location, asked at every launch until on.
 * The radar shows who is in range, never how far or where (Multipeer gives
 * neither), so every phone sits on the same ring. No sweep, no pulse (§8).
 */
import { useState } from "react";

import { clock } from "../design/format";
import { useT } from "../design/i18n";
import { allowBluetooth, bluetooth, inbox, nearby, openBluetoothSettings, pingAll } from "../nearby";
import { location, requestLocation } from "../permissions";

import { Button, Notice } from "./kit";

const C = 120; // centre of the 240-unit viewBox
const RINGS = [40, 80, 112];
const PEER_RING = 80;

export function NearbyRadar({ peers, live }: { peers: string[]; live: boolean }) {
  const t = useT();
  const n = peers.length;
  return (
    <svg className={live ? "radar" : "radar off"} viewBox="0 0 240 240" role="img" aria-label={t("near.title")}>
      {RINGS.map((r) => (
        <circle key={r} className="ring" cx={C} cy={C} r={r} />
      ))}
      <circle className="me" cx={C} cy={C} r={7}>
        <title>{t("near.me")}</title>
      </circle>
      {live
        ? peers.map((peer, i) => {
            // Evenly spaced, in a stable order: position carries no meaning.
            const a = ((-90 + (i * 360) / n) * Math.PI) / 180;
            return (
              <circle key={peer} className="peer" cx={C + PEER_RING * Math.cos(a)} cy={C + PEER_RING * Math.sin(a)} r={10}>
                <title>#{peer.slice(0, 6).toUpperCase()}</title>
              </circle>
            );
          })
        : null}
    </svg>
  );
}

/** Radar card + the line under it: count, or why Bluetooth isn't running. */
function RadarCard({ webLine }: { webLine: "near.webOnly" | "near.webOnlyRecv" }) {
  const t = useT();
  const s = nearby.use();
  const bt = bluetooth.use();
  const live = s.available && s.running;
  const n = s.peers.length;
  return (
    <>
      <div className="qr-card">
        <NearbyRadar peers={s.peers} live={live} />
        {live ? (
          <>
            <span className="body strong">
              {n === 0 ? t("near.none") : n === 1 ? t("near.inRange.one") : t("near.inRange", { n })}
            </span>
            <span className="caption ink2">{t("near.range")}</span>
          </>
        ) : null}
      </div>
      {!s.available ? (
        <p className="body">{t(webLine)}</p>
      ) : !s.running ? (
        <Notice
          message={bt === "unauthorized" ? t("start.btDenied") : t("near.off")}
          detail={bt === "unauthorized" ? undefined : t("bt.hint")}
          action={
            bt === "unauthorized" ? (
              <Button variant="secondary" small label={t("start.openSettings")} onClick={() => void openBluetoothSettings()} />
            ) : (
              // Asks iOS again, which shows its own "Turn On Bluetooth"
              // alert; its Settings button goes straight to Bluetooth.
              <Button variant="secondary" small label={t("near.turnOn")} onClick={() => void allowBluetooth()} />
            )
          }
        />
      ) : null}
    </>
  );
}

type PingState = { kind: "idle" } | { kind: "busy" } | { kind: "done"; n: number } | { kind: "failed" };

/**
 * Pass on by Bluetooth: one tap passes to every phone in range. Where
 * Bluetooth exists (native app) this is the screen's main action, above the
 * QR; in the browser it sits under the QR and explains why it's off.
 */
export function NearbySection({ onCoral, primary }: { onCoral: boolean; primary: boolean }) {
  const t = useT();
  const s = nearby.use();
  const [ping, setPing] = useState<PingState>({ kind: "idle" });
  const live = s.available && s.running;

  const doPing = async () => {
    setPing({ kind: "busy" });
    const r = await pingAll();
    setPing(r.reached > 0 ? { kind: "done", n: r.reached } : { kind: "failed" });
  };

  return (
    <section className="stack gap3" aria-labelledby="near-title">
      <h2 id="near-title" className="heading">
        {t("near.title")}
      </h2>
      <RadarCard webLine="near.webOnly" />
      <Button
        variant={primary ? "primary" : "secondary"}
        onCoral={onCoral}
        label={ping.kind === "busy" ? t("near.pinging") : t("near.ping")}
        disabled={!live || s.peers.length === 0 || ping.kind === "busy"}
        onClick={() => void doPing()}
      />
      {ping.kind === "done" ? (
        <p className="body strong" role="status">
          {ping.n === 1 ? t("near.done.one") : t("near.done", { n: ping.n })}
        </p>
      ) : null}
      {ping.kind === "failed" ? (
        <p className="body bold" role="status">
          {t("near.failed")}
        </p>
      ) : null}
    </section>
  );
}

/**
 * Receive by Bluetooth. Listening needs no tap: while PASAbi is open with
 * Bluetooth on, any nearby phone's ping lands here through the one ingest
 * path. This shows that it is waiting, and what the last ping brought.
 */
export function NearbyReceive() {
  const t = useT();
  const s = nearby.use();
  const last = inbox.use();
  const live = s.available && s.running;
  return (
    <section className="stack gap3" aria-labelledby="near-recv-title">
      <h2 id="near-recv-title" className="heading">
        {t("near.title")}
      </h2>
      <RadarCard webLine="near.webOnlyRecv" />
      {live ? (
        <p className="body strong" role="status">
          {last
            ? t("near.gotFrom", { n: last.received, m: last.added, time: clock(last.at) })
            : t("near.waiting")}
        </p>
      ) : null}
    </section>
  );
}

/**
 * Asked at every launch until both are on (team decision, 2026-09-30).
 * - Bluetooth (native app): "Allow" asks iOS, which shows its permission
 *   prompt, or its own "Turn On Bluetooth" alert when it is off.
 * - Location (everywhere): "Allow" raises the location prompt.
 * Nothing is switched on by the app (CLAUDE.md); it only asks. "Not now"
 * hides the sheet until the next launch.
 */
export function StartupAsk() {
  const t = useT();
  const s = nearby.use();
  const bt = bluetooth.use();
  const loc = location.use();
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  const btNeeded = s.available && bt !== "on" && bt !== "unsupported";
  const locNeeded = loc === "prompt" || loc === "denied";
  if (dismissed || (!btNeeded && !locNeeded) || bt === "unknown" || loc === "unknown") return null;

  const allow = async () => {
    setBusy(true);
    try {
      if (btNeeded) await allowBluetooth();
      if (loc === "prompt") await requestLocation();
    } finally {
      setBusy(false);
    }
  };

  const btStatus = !s.available
    ? t("start.webBt")
    : bt === "on"
      ? t("start.on")
      : bt === "unauthorized"
        ? t("start.btDenied")
        : bt === "off"
          ? t("start.btOff")
          : t("start.btWhy");
  const locStatus =
    loc === "granted"
      ? t("start.on")
      : loc === "denied"
        ? t("start.locDenied")
        : loc === "unavailable"
          ? t("start.locNone")
          : t("start.locWhy");
  // Only offer "Allow" when a tap can still change something. After a
  // refusal iOS never asks again, so that case gets Open Settings instead.
  const canAsk = (btNeeded && bt !== "unauthorized") || loc === "prompt";

  return (
    <div className="scrim">
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="start-title">
        <h2 id="start-title" className="heading">
          {t("start.title")}
        </h2>
        <p className="body">{t("start.body")}</p>
        <dl className="facts body" style={{ margin: 0, padding: 0, border: 0 }}>
          <dt>{t("start.bt")}</dt>
          <dd>{btStatus}</dd>
          <dt>{t("start.loc")}</dt>
          <dd>{locStatus}</dd>
        </dl>
        {canAsk ? <Button label={t("start.allow")} disabled={busy} onClick={() => void allow()} /> : null}
        {s.available && bt === "unauthorized" ? (
          <Button variant="secondary" label={t("start.openSettings")} onClick={() => void openBluetoothSettings()} />
        ) : null}
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
