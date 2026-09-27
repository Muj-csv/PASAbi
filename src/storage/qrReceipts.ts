import AsyncStorage from "@react-native-async-storage/async-storage";

import { rememberReceipt, type AckMemory } from "@pasabi/core";

import { loadObservations } from "./observations";

/**
 * D-025 sender-side memory: receiver device ID -> observation IDs it has
 * acknowledged by receipt, so the next QR exchange with the same phone skips
 * them. Local only, kept outside the observation blob, never sent.
 */
const ACKED_KEY = "pasabi.qr.acked.v1";

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

async function loadMemory(): Promise<AckMemory> {
  const raw = await AsyncStorage.getItem(ACKED_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const memory: AckMemory = {};
    for (const [id, entry] of Object.entries(parsed)) {
      const e = entry as { ids?: unknown; at?: unknown };
      if (Array.isArray(e.ids) && typeof e.at === "number") {
        memory[id] = { ids: e.ids.filter((x) => typeof x === "string"), at: e.at };
      }
    }
    return memory;
  } catch {
    // Losing this only costs rescanning duplicates; never block a transfer.
    return {};
  }
}

export async function ackedBy(receiverId: string): Promise<Set<string>> {
  return new Set((await loadMemory())[receiverId]?.ids ?? []);
}

export async function recordReceipt(
  receiverId: string,
  ackedIds: string[],
): Promise<void> {
  const held = new Set((await loadObservations()).map((o) => o.id));
  const next = rememberReceipt(
    await loadMemory(),
    receiverId,
    ackedIds,
    held,
    nowSeconds(),
  );
  await AsyncStorage.setItem(ACKED_KEY, JSON.stringify(next));
}
