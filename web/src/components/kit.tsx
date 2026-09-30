/**
 * The DESIGN_BRIEF §12 kit, ported from docs/design/code (React Native) to
 * DOM + tokens.css: StatusBand, Button, ActionBlock, CountWidget, Stamp,
 * SlipCard, CoverageRow, UndoBar, TabBar, BackBar, Notice.
 * Build no other components without adding them to the brief first.
 */
import { useEffect, useRef, type ReactNode } from "react";

import type { AreaCoverage, Observation } from "@pasabi/core";

import { coverageLabel, clock } from "../design/format";
import { setLang, useT, type T } from "../design/i18n";
import { Icon, type UiIcon } from "../design/pictograms";
import { offlineReady, useOnline } from "../hooks";
import { goBack, Link, usePath } from "../router";
import { observations, storeCapacity } from "../storage/observations";
import { station } from "../storage/station";
import { lastUpload } from "../storage/uplink";

// ------------------------------------------------------------ StatusBand

/**
 * Top of every screen. Station: ballpen fill with the station name.
 * Resident: surface fill with the connection first. Connection is always
 * words next to a hollow (offline) or filled (online) dot, never a modal.
 */
export function StatusBand({
  mode,
  label,
  showLang = false,
}: {
  mode: "resident" | "station" | "responder";
  /** Filled bands only: the mode label. */
  label?: string;
  /** Resident Home: the EN · FIL toggle. */
  showLang?: boolean;
}) {
  const t = useT();
  const online = useOnline();
  const ready = offlineReady.use();
  const held = observations.use().length;
  const uploadedAt = lastUpload.use();
  const nearlyFull = held >= storeCapacity() * 0.9;

  let connection: string;
  if (mode === "station") {
    connection = !online
      ? t("band.offline.station")
      : uploadedAt
        ? t("band.online.station", { time: clock(uploadedAt) })
        : t("band.online");
  } else if (mode === "resident") {
    connection = !online ? t("band.offline") : ready ? t("band.online.ready") : t("band.online");
  } else {
    connection = online ? t("band.online") : t("band.offline.station");
  }
  if (nearlyFull && mode !== "responder") connection += " " + t("band.storage");

  const conn = (
    <span className="row gap2" role="status">
      <span className={online ? "dot on" : "dot"} aria-hidden="true" />
      <span>{connection}</span>
    </span>
  );

  if (mode !== "resident") {
    return (
      <header className="band filled">
        <b>{label}</b>
        {conn}
      </header>
    );
  }
  return (
    <header className="band">
      {conn}
      {showLang ? (
        <button
          className="lang"
          onClick={() => void setLang(t.lang === "en" ? "fil" : "en")}
          aria-label={`${t("settings.language")}: ${t.lang === "en" ? "Filipino" : "English"}`}
        >
          <span className={t.lang === "en" ? "" : "off"}>EN</span> ·{" "}
          <span className={t.lang === "fil" ? "" : "off"}>FIL</span>
        </button>
      ) : null}
    </header>
  );
}

/** The band for the current mode: station band while station mode is on. */
export function ModeBand({ showLang = false }: { showLang?: boolean }) {
  const t = useT();
  const s = station.use();
  if (s.enabled) {
    return <StatusBand mode="station" label={t("band.station", { name: s.name ?? t("station.title") })} />;
  }
  return <StatusBand mode="resident" showLang={showLang} />;
}

// ------------------------------------------------------------ Button

export function Button({
  label,
  onClick,
  variant = "primary",
  onCoral = false,
  resident = false,
  small = false,
  disabled = false,
  type = "button",
}: {
  label: string;
  onClick?: () => void;
  /** primary: coral fill · secondary: ballpen outline · quiet: text only */
  variant?: "primary" | "secondary" | "quiet";
  /** On a coral page the primary is ink fill + white text (coral on coral vanishes). */
  onCoral?: boolean;
  /** Resident quiet buttons are underlined ink; station quiet buttons are ballpen. */
  resident?: boolean;
  small?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const cls = ["btn", variant, onCoral && "on-coral", resident && "resident", small && "small"]
    .filter(Boolean)
    .join(" ");
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// ------------------------------------------------------------ Resident blocks

export function ActionBlock({
  label,
  sub,
  icon,
  tone,
  to,
  disabled = false,
}: {
  label: string;
  sub?: string;
  icon: UiIcon;
  /** coral: Report · ballpen: Pass on · ink: Receive */
  tone: "coral" | "ballpen" | "ink";
  to: string;
  disabled?: boolean;
}) {
  const big = tone === "coral";
  const body = (
    <>
      <Icon name={icon} size={big ? 36 : 28} />
      <span className="stack gap1">
        <span className="label">{label}</span>
        {sub ? <span className="block-sub">{sub}</span> : null}
      </span>
    </>
  );
  if (disabled) {
    return (
      <button className={`block ${tone}`} disabled>
        {body}
      </button>
    );
  }
  return (
    <Link to={to} className={`block ${tone}`}>
      {body}
    </Link>
  );
}

export function CountWidget({ count, label, side }: { count: number; label: string; side?: string }) {
  return (
    <div className="count-widget">
      <div>
        <div className="display num">{count}</div>
        <div className="small">{label}</div>
      </div>
      {side ? <b className="small">{side}</b> : null}
    </div>
  );
}

// ------------------------------------------------------------ Stamp

export type StampInk = "black" | "ballpen" | "coral" | "coralSolid" | "faded";

/** Same slip, same tilt, every render: −4°…+3° seeded from the ID. */
function stampRotation(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const deg = (Math.abs(h) % 8) - 4;
  return `${deg === 0 ? -2 : deg}deg`;
}

/**
 * The one expressive gesture (DESIGN_BRIEF §8). Press-in and a buzz only
 * when `justEarned`: the moment the evidence arrived. A pending stage is a
 * dashed outline in sentence case, never a real stamp (BR-015).
 */
export function Stamp({
  label,
  ink,
  seed,
  pending = false,
  justEarned = false,
  large = false,
}: {
  label: string;
  ink: StampInk;
  seed: string;
  pending?: boolean;
  justEarned?: boolean;
  large?: boolean;
}) {
  useEffect(() => {
    // iOS Safari has no vibration API; the animation carries it there.
    if (justEarned) navigator.vibrate?.(20);
  }, [justEarned]);

  if (pending) return <span className={`stamp pending${large ? " large" : ""}`}>{label}</span>;
  const tilt = stampRotation(seed);
  return (
    <span
      className={`stamp ${ink}${large ? " large" : ""}${justEarned ? " pressed" : ""}`}
      style={{ ["--tilt" as string]: tilt, transform: `rotate(${tilt})` }}
    >
      {label}
    </span>
  );
}

export interface SlipStamp {
  label: string;
  ink: StampInk;
  earned: boolean;
  justEarned?: boolean;
}

/** BR-015: earned only from flags the phone holds; the rest are outlines. */
export function slipStamps(o: Observation, t: T, previous?: Observation): SlipStamp[] {
  const s = (label: string, ink: StampInk, earned: boolean, was: boolean | undefined): SlipStamp => ({
    label,
    ink,
    earned,
    justEarned: earned && previous !== undefined && !was,
  });
  return [
    s(t("stamp.saved"), "black", true, true),
    s(t("stamp.passed"), "ballpen", o.passed_on === true, previous?.passed_on),
    s(t("stamp.station"), "coral", o.reached_station === true, previous?.reached_station),
    s(t("stamp.uploaded"), "coralSolid", o.uploaded === true, previous?.uploaded),
  ];
}

/** The strongest stage the phone can prove, and nothing beyond it. */
export function slipStatus(o: Observation, t: T): string {
  if (o.uploaded) return t("slip.status.uploaded");
  if (o.reached_station) return t("slip.status.station");
  if (o.passed_on) return t("slip.status.passed");
  return t("slip.status.saved");
}

export function SlipCard({
  id,
  eyebrow,
  time,
  title,
  detail,
  stamps,
  to,
  footer,
}: {
  id: string;
  eyebrow?: string;
  time: string;
  title: string;
  detail?: string;
  stamps: SlipStamp[];
  to?: string;
  footer?: ReactNode;
}) {
  const body = (
    <>
      <span className="row between caption ink2">
        <span>{eyebrow ?? ""}</span>
        <span className="num">{time}</span>
      </span>
      <span className="heading">{title}</span>
      {detail ? <span className="small ink2">{detail}</span> : null}
      <span className="stamps">
        {stamps.map((s) => (
          <Stamp
            key={s.label}
            seed={`${id}:${s.label}`}
            label={s.label}
            ink={s.ink}
            pending={!s.earned}
            justEarned={s.justEarned}
          />
        ))}
      </span>
    </>
  );
  if (to) {
    return (
      <div className="stack gap2">
        <Link to={to} className="slip">
          {body}
        </Link>
        {footer}
      </div>
    );
  }
  return (
    <div className="slip">
      {body}
      {footer}
    </div>
  );
}

// ------------------------------------------------------------ Coverage

const DOTS = { high: "●●●", limited: "●●○", stale: "○○○", none: "?" } as const;

/** Worst first (the engine sorts). "No reports" is the loudest row. */
export function CoverageRow({ c }: { c: AreaCoverage }) {
  const t = useT();
  return (
    <div className="cov-row">
      <span className="body strong">{c.label ?? c.area ?? t("cov.unnamed")}</span>
      <span className="dots" aria-hidden="true">
        {DOTS[c.level]}
      </span>
      <span className={`chip ${c.level}`}>{coverageLabel(c, t)}</span>
    </div>
  );
}

// ------------------------------------------------------------ UndoBar

/**
 * "Resolved. Undo": commits after 5 s, or at once if the bar goes away
 * (the user navigated off). Only tapping Undo cancels. Leaving the screen
 * must never silently drop an action the screen already announced.
 */
export function UndoBar({
  message,
  onUndo,
  onCommit,
}: {
  message: string;
  onUndo: () => void;
  onCommit: () => void;
}) {
  const t = useT();
  const commit = useRef(onCommit);
  const settled = useRef(false);
  const flush = useRef<number | null>(null);
  useEffect(() => {
    commit.current = onCommit;
  });
  useEffect(() => {
    // Remounted (React StrictMode's dev double-mount): cancel the flush the
    // simulated unmount scheduled, and keep waiting.
    if (flush.current !== null) clearTimeout(flush.current);
    const id = window.setTimeout(() => {
      settled.current = true;
      commit.current();
    }, 5000);
    return () => {
      clearTimeout(id);
      // Deferred a tick so a StrictMode remount can cancel it; a real
      // unmount lets it run.
      if (!settled.current) {
        flush.current = window.setTimeout(() => {
          settled.current = true;
          commit.current();
        }, 0);
      }
    };
  }, []);
  const undo = () => {
    settled.current = true;
    onUndo();
  };
  return (
    <div className="undo-bar" role="status">
      <span>{message}</span>
      <button onClick={undo}>{t("undo")}</button>
    </div>
  );
}

// ------------------------------------------------------------ TabBar

/** Station only: Ledger · Pass on · Receive · Station. Active = ink + coral bar. */
export function TabBar() {
  const t = useT();
  const path = usePath().split("?")[0];
  const tabs: { to: string; icon: UiIcon; label: string; match: (p: string) => boolean }[] = [
    { to: "/station", icon: "ledger", label: t("tab.ledger"), match: (p) => p === "/station" || p.startsWith("/station/incident") },
    { to: "/pass", icon: "passOn", label: t("action.passOn"), match: (p) => p === "/pass" },
    { to: "/receive", icon: "receive", label: t("action.receive"), match: (p) => p === "/receive" },
    { to: "/station/status", icon: "station", label: t("tab.station"), match: (p) => p === "/station/status" },
  ];
  return (
    <nav className="tabs" aria-label={t("station.title")}>
      {tabs.map((tab) => {
        const active = tab.match(path);
        return (
          <Link key={tab.to} to={tab.to} className={active ? "tab active" : "tab"} aria-current={active ? "page" : undefined}>
            <Icon name={tab.icon} />
            <span>{tab.label}</span>
            <span className="bar" aria-hidden="true" />
          </Link>
        );
      })}
    </nav>
  );
}

// ------------------------------------------------------------ BackBar, Notice

export function BackBar({
  label,
  fallback,
  right,
  resident = false,
}: {
  label: string;
  fallback: string;
  right?: ReactNode;
  resident?: boolean;
}) {
  return (
    <div className="back-bar">
      <button className={resident ? "back-link resident" : "back-link"} onClick={() => goBack(fallback)}>
        <Icon name="back" size={20} />
        {label}
      </button>
      {right}
    </div>
  );
}

/** Errors are ink on surface with a pictogram, one sentence, one action (DESIGN_BRIEF §4). */
export function Notice({ message, detail, action }: { message: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="notice" role="status">
      <Icon name="error" />
      <div className="stack gap2 grow">
        <span className="body strong">{message}</span>
        {detail ? <span className="caption ink2">{detail}</span> : null}
        {action}
      </div>
    </div>
  );
}
