// P1 (spec §10): measure real transfers instead of guessing. Every QR send
// and receive, Bluetooth ping and Bluetooth batch received is logged on the
// phone that did it. Local only: never synced, never uploaded; exported by
// hand (copy / download) for docs/FIELD_TEST.md. Times are epoch ms.

import { uuid4 } from "./device";
import { kvGet, kvSet, live } from "./kv";

export type TransferKind = "qr-send" | "qr-receive" | "bt-ping" | "bt-receive";

export interface TransferEntry {
  id: string;
  kind: TransferKind;
  startedAt: number;
  endedAt: number;
  /** Finished as intended: receipt scanned, bundle complete, a peer reached. */
  completed: boolean;
  /** Observations sent / received / new to this phone. */
  sent: number;
  received: number;
  added: number;
  /** QR: frames in the bundle, and frames caught before giving up. */
  frames?: number;
  framesSeen?: number;
  /** Bluetooth ping: phones in range, and phones that finished. */
  peers?: number;
  peersReached?: number;
}

const KEY = "transfers.v1";
/** ponytail: a ring of the last 500; a field day is well under that. */
const MAX = 500;

export const transferLog = live<TransferEntry[]>([]);

let queue: Promise<unknown> = Promise.resolve();

export async function restoreTransferLog(): Promise<void> {
  const stored = await kvGet<TransferEntry[]>(KEY);
  transferLog.set(Array.isArray(stored) ? stored : []);
}

/** Appends one entry. Never throws into the transfer it measures. */
export function logTransfer(entry: Omit<TransferEntry, "id">): Promise<void> {
  const next = queue.then(async () => {
    const list = [...transferLog.get(), { ...entry, id: uuid4() }].slice(-MAX);
    transferLog.set(list);
    await kvSet(KEY, list);
  });
  queue = next.catch(() => undefined);
  return queue.then(() => undefined);
}

export async function clearTransferLog(): Promise<void> {
  transferLog.set([]);
  await kvSet(KEY, []);
}

export interface KindSummary {
  total: number;
  completed: number;
  /** Median duration of completed transfers, ms; null when none completed. */
  medianMs: number | null;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

/** Spec §10.3: reliability (completed / total) and time, per transport. */
export function summarize(entries: TransferEntry[]): KindSummary & { byKind: Partial<Record<TransferKind, KindSummary>> } {
  const one = (list: TransferEntry[]): KindSummary => ({
    total: list.length,
    completed: list.filter((e) => e.completed).length,
    medianMs: median(list.filter((e) => e.completed).map((e) => e.endedAt - e.startedAt)),
  });
  const byKind: Partial<Record<TransferKind, KindSummary>> = {};
  for (const kind of ["qr-send", "qr-receive", "bt-ping", "bt-receive"] as const) {
    const list = entries.filter((e) => e.kind === kind);
    if (list.length > 0) byKind[kind] = one(list);
  }
  return { ...one(entries), byKind };
}
