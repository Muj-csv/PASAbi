import { useEffect, useMemo, useState } from "react";

import {
  compute,
  evidenceOf,
  type Evidence,
  type Incident,
  type Observation,
} from "@pasabi/core";

import { live } from "./storage/kv";
import { nowSeconds } from "./storage/observations";

/**
 * "Online" means this phone can reach the internet, not merely that it is
 * on a network: a barangay Wi-Fi with a dead uplink makes navigator.onLine
 * true. So a true onLine is confirmed by fetching a tiny file with a
 * throwaway query, which misses the service-worker cache and must really
 * cross the network.
 * ponytail: one probe per 30 s, and on every "online" event; a push-based
 * signal would need a server we don't have.
 */
const reachable = live<boolean>(typeof navigator !== "undefined" ? navigator.onLine : false);

async function probe(): Promise<void> {
  if (!navigator.onLine) {
    reachable.set(false);
    return;
  }
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 5000);
  try {
    const res = await fetch(`/favicon.png?probe=${Date.now()}`, { cache: "no-store", signal: abort.signal });
    reachable.set(res.ok);
  } catch {
    reachable.set(false);
  } finally {
    clearTimeout(timer);
  }
}

let probing = false;

function startProbing(): void {
  if (probing) return;
  probing = true;
  window.addEventListener("online", () => void probe());
  window.addEventListener("offline", () => reachable.set(false));
  setInterval(() => void probe(), 30000);
  void probe();
}

/** Connection words in the band are always from here; never a modal. */
export function useOnline(): boolean {
  useEffect(startProbing, []);
  return reachable.use();
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
