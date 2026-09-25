import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

import {
  CAPACITY_RESIDENT,
  CAPACITY_STATION,
  type StationSnapshot,
} from "@pasabi/core";

import { getDeviceId } from "./device";
import { setStoreCapacity } from "./observations";

const STATION_KEY = "pasabi.station.v1";
const SNAPSHOT_KEY = "pasabi.snapshot.v1";

export interface StationSettings {
  enabled: boolean;
  pinHash: string | null;
}

const OFF: StationSettings = { enabled: false, pinHash: null };

/**
 * The PIN gates a UI mode on a shared phone. It is NOT protecting the
 * observations: everything on the board is already readable from My data.
 * Hashing it, salted with the per-install device ID so one table cannot
 * cover every deployment, costs three lines and beats storing it in the
 * clear. A four-digit PIN is still brute-forceable by anyone holding the
 * phone, and the design does not pretend otherwise. Real access control is
 * the responder login noted in ARCHITECTURE section 6.
 */
async function hashPin(pin: string): Promise<string> {
  const salt = await getDeviceId();
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    salt + ":" + pin,
  );
}

export async function loadStation(): Promise<StationSettings> {
  const raw = await AsyncStorage.getItem(STATION_KEY);
  if (!raw) return OFF;
  try {
    const parsed = JSON.parse(raw) as Partial<StationSettings>;
    return {
      enabled: parsed.enabled === true,
      pinHash: typeof parsed.pinHash === "string" ? parsed.pinHash : null,
    };
  } catch {
    return OFF;
  }
}

async function save(settings: StationSettings): Promise<void> {
  await AsyncStorage.setItem(STATION_KEY, JSON.stringify(settings));
  // FR-006: a station holds far more than a resident phone.
  setStoreCapacity(settings.enabled ? CAPACITY_STATION : CAPACITY_RESIDENT);
}

/** First use sets the PIN. After that, the same PIN unlocks the board. */
export async function enableStation(pin: string): Promise<boolean> {
  const settings = await loadStation();
  const hash = await hashPin(pin);
  if (settings.pinHash !== null && settings.pinHash !== hash) return false;
  await save({ enabled: true, pinHash: hash });
  return true;
}

export async function disableStation(): Promise<void> {
  const settings = await loadStation();
  await save({ ...settings, enabled: false });
}

/** Called once at startup so capacity matches the stored mode. */
export async function restoreStationMode(): Promise<StationSettings> {
  const settings = await loadStation();
  setStoreCapacity(settings.enabled ? CAPACITY_STATION : CAPACITY_RESIDENT);
  return settings;
}

// ------------------------------------------------------- FR-007 snapshots

export async function loadSnapshot(): Promise<StationSnapshot | null> {
  const raw = await AsyncStorage.getItem(SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StationSnapshot;
  } catch {
    return null;
  }
}

export async function saveSnapshot(snapshot: StationSnapshot): Promise<void> {
  await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
}
