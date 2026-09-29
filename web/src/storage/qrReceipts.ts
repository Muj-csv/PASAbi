import { rememberReceipt, type AckMemory } from "@pasabi/core";

import { kvGet, kvSet } from "./kv";
import { nowSeconds, observations } from "./observations";

/**
 * D-025 sender-side memory: receiver device ID -> observation IDs it
 * acknowledged, so the next exchange with that phone skips them. Local only.
 */
const ACKED_KEY = "qr.acked.v1";

async function loadMemory(): Promise<AckMemory> {
  const stored = await kvGet<AckMemory>(ACKED_KEY);
  // Losing this only costs resending duplicates; never block a transfer.
  return stored && typeof stored === "object" ? stored : {};
}

export async function ackedBy(receiverId: string): Promise<Set<string>> {
  return new Set((await loadMemory())[receiverId]?.ids ?? []);
}

export async function recordReceipt(receiverId: string, ackedIds: string[]): Promise<void> {
  const held = new Set(observations.get().map((o) => o.id));
  const next = rememberReceipt(await loadMemory(), receiverId, ackedIds, held, nowSeconds());
  await kvSet(ACKED_KEY, next);
}
