/**
 * Bluetooth pass-on UI (D-033): NearbyRadar, NearbySection (radar + Ping,
 * under the QR on Pass on) and BluetoothAsk (the start-up question).
 * Added to DESIGN_BRIEF §12 first. The radar is honest about what the radio
 * knows: who is in range, not how far or in which direction, so every phone
 * sits on the same ring. No pulsing, no sweep (DESIGN_BRIEF §8).
 */
import { useState } from "react";

import { useT } from "../design/i18n";
import { answerNearbyAsk, nearby, nearbyAsked, pingAll, startNearby } from "../nearby";

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

type PingState = { kind: "idle" } | { kind: "busy" } | { kind: "done"; n: number } | { kind: "failed" };

/** Under the QR on Pass on: who is in range, and one tap to pass to all of them. */
export function NearbySection({ onCoral }: { onCoral: boolean }) {
  const t = useT();
  const s = nearby.use();
  const [ping, setPing] = useState<PingState>({ kind: "idle" });
  const live = s.available && s.running;
  const count = s.peers.length;

  const doPing = async () => {
    setPing({ kind: "busy" });
    const r = await pingAll();
    setPing(r.reached > 0 ? { kind: "done", n: r.reached } : { kind: "failed" });
  };

  const caption = !live
    ? null
    : count === 0
      ? t("near.none")
      : count === 1
        ? t("near.inRange.one")
        : t("near.inRange", { n: count });

  return (
    <section className="stack gap3" aria-labelledby="near-title">
      <h2 id="near-title" className="heading">
        {t("near.title")}
      </h2>
      <div className="qr-card">
        <NearbyRadar peers={s.peers} live={live} />
        {caption ? <span className="body strong">{caption}</span> : null}
        {live ? <span className="caption ink2">{t("near.range")}</span> : null}
      </div>

      {!s.available ? (
        <p className="body">{t("near.webOnly")}</p>
      ) : !s.running ? (
        <Notice
          message={t("near.off")}
          detail={t("bt.hint")}
          action={<Button variant="secondary" small label={t("near.turnOn")} onClick={() => void startNearby()} />}
        />
      ) : null}

      <Button
        variant="secondary"
        onCoral={onCoral}
        label={ping.kind === "busy" ? t("near.pinging") : t("near.ping")}
        disabled={!live || count === 0 || ping.kind === "busy"}
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
 * Asked once, as the app starts, inside the native app only. "Allow" starts
 * the radio, which is what makes iOS show its own Bluetooth / Local Network
 * prompts. PASAbi never switches Bluetooth on itself (CLAUDE.md); it asks.
 */
export function BluetoothAsk() {
  const t = useT();
  const s = nearby.use();
  const asked = nearbyAsked.use();
  if (!s.available || asked) return null;
  return (
    <div className="scrim">
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="bt-title">
        <h2 id="bt-title" className="heading">
          {t("bt.title")}
        </h2>
        <p className="body">{t("bt.body")}</p>
        <p className="caption ink2">{t("bt.hint")}</p>
        <Button label={t("bt.allow")} onClick={() => void answerNearbyAsk(true)} />
        <div>
          <Button variant="quiet" resident label={t("bt.later")} onClick={() => void answerNearbyAsk(false)} />
        </div>
      </div>
    </div>
  );
}
