import {
  CAPACITY_RESIDENT,
  CAPACITY_STATION,
  type StationSnapshot,
} from "@pasabi/core";

import { getDeviceId } from "./device";
import { kvGet, kvSet, live } from "./kv";
import { setStoreCapacity } from "./observations";

const STATION_KEY = "station.v1";
const SNAPSHOT_KEY = "snapshot.v1";
const EXPECTED_KEY = "expected.v1";

export interface StationSettings {
  enabled: boolean;
  pinHash: string | null;
  /** Asked for on first unlock (team decision, 2026-09-29). */
  name: string | null;
}

const OFF: StationSettings = { enabled: false, pinHash: null, name: null };

export const station = live<StationSettings>(OFF);
export const snapshot = live<StationSnapshot | null>(null);
export const expectedAreas = live<string[]>([]);

/**
 * The PIN hides a UI mode on a shared phone; it does not protect the data,
 * which is readable from My reports anyway. Salted with the device ID so
 * one lookup table cannot cover every install. Real access control is the
 * deferred responder auth (plan §30).
 */
async function hashPin(pin: string): Promise<string> {
  const salt = await getDeviceId();
  const bytes = new TextEncoder().encode(salt + ":" + pin);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function save(next: StationSettings): Promise<void> {
  await kvSet(STATION_KEY, next);
  setStoreCapacity(next.enabled ? CAPACITY_STATION : CAPACITY_RESIDENT);
  station.set(next);
}

/** Boot: restore mode (and store capacity) before the first write. */
export async function restoreStation(): Promise<void> {
  const stored = await kvGet<Partial<StationSettings>>(STATION_KEY);
  const settings: StationSettings = {
    enabled: stored?.enabled === true,
    pinHash: typeof stored?.pinHash === "string" ? stored.pinHash : null,
    name: typeof stored?.name === "string" ? stored.name : null,
  };
  setStoreCapacity(settings.enabled ? CAPACITY_STATION : CAPACITY_RESIDENT);
  station.set(settings);
  snapshot.set((await kvGet<StationSnapshot>(SNAPSHOT_KEY)) ?? null);
  const areas = await kvGet<string[]>(EXPECTED_KEY);
  expectedAreas.set(Array.isArray(areas) ? areas.filter((a) => typeof a === "string") : []);
}

/** First use sets the PIN and the name; after that the same PIN unlocks. */
export async function enableStation(pin: string, name?: string): Promise<boolean> {
  const current = station.get();
  const hash = await hashPin(pin);
  if (current.pinHash !== null && current.pinHash !== hash) return false;
  await save({
    enabled: true,
    pinHash: hash,
    name: name?.trim() || current.name,
  });
  return true;
}

export async function disableStation(): Promise<void> {
  await save({ ...station.get(), enabled: false });
}

/** FR-007: "Mark seen" starts change tracking from this moment. */
export async function saveSnapshot(next: StationSnapshot): Promise<void> {
  await kvSet(SNAPSHOT_KEY, next);
  snapshot.set(next);
}

/** FR-017: puroks this station expects to hear from. Local, never shared. */
export async function saveExpectedAreas(areas: string[]): Promise<void> {
  await kvSet(EXPECTED_KEY, areas);
  expectedAreas.set(areas);
}
