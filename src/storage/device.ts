import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const DEVICE_ID_KEY = "pasabi.device_id.v1";

let cached: string | null = null;

/**
 * NFR-007: a random per-install value. No account, no name, nothing that
 * identifies a person. BR-004 counts distinct device IDs, so this is what
 * corroboration is measured in.
 *
 * ponytail: a plain random UUID, not the ARCHITECTURE section 6 keypair.
 * Signing is supporting scope; swap this for the hash of a Keystore public
 * key when signatures land, and device IDs change with it.
 */
export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) {
    cached = stored;
    return stored;
  }
  const fresh = Crypto.randomUUID().toLowerCase();
  await AsyncStorage.setItem(DEVICE_ID_KEY, fresh);
  cached = fresh;
  return fresh;
}

export function newObservationId(): string {
  return Crypto.randomUUID().toLowerCase();
}
