import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import {
  compute,
  evidenceOf,
  type Evidence,
  type Incident,
  type Observation,
} from "@pasabi/core";

import { live } from "./storage/kv";
import { nowSeconds } from "./storage/observations";

function onlineSubscribe(l: () => void) {
  window.addEventListener("online", l);
  window.addEventListener("offline", l);
  return () => {
    window.removeEventListener("online", l);
    window.removeEventListener("offline", l);
  };
}

/** Connection words in the band are always from here; never a modal. */
export function useOnline(): boolean {
  return useSyncExternalStore(onlineSubscribe, () => navigator.onLine);
}

/**
 * Plan §23A.5: say "ready offline" only once the service worker has the
 * shell cached. main.tsx sets this from registerSW's onOfflineReady, or
 * straight away when a service worker already controls the page.
 */
export const offlineReady = live(false);

/** Epoch seconds, ticking every 30 s so freshness and "min ago" move. */
export function useNow(): number {
  const [now, setNow] = useState(nowSeconds);
  useEffect(() => {
    const id = setInterval(() => setNow(nowSeconds()), 30000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * The derived picture (ADR-002): incidents are computed from observations on
 * this phone, never stored or sent. Evidence per incident, keyed by key.
 */
export function usePicture(held: Observation[], now: number) {
  return useMemo(() => {
    const incidents: Incident[] = compute(held, now);
    const evidence = new Map<string, Evidence>(
      incidents.map((i) => [i.key, evidenceOf(i, held, now)]),
    );
    return { incidents, evidence };
  }, [held, now]);
}
