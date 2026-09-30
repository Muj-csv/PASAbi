// The field-test log (P1): what gets measured must be counted right, or the
// numbers in FIELD_TEST.md are fiction.
import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import { kvGet } from "./kv";
import {
  clearTransferLog,
  logTransfer,
  restoreTransferLog,
  summarize,
  transferLog,
  type TransferEntry,
} from "./transferLog";

const T = 1790000000000;
const entry = (kind: TransferEntry["kind"], ms: number, completed: boolean): Omit<TransferEntry, "id"> => ({
  kind,
  startedAt: T,
  endedAt: T + ms,
  completed,
  sent: 0,
  received: 0,
  added: 0,
});

describe("transfer log", () => {
  it("summarizes reliability and median time per transport", () => {
    const list = [
      entry("qr-send", 30000, true),
      entry("qr-send", 50000, true),
      entry("qr-send", 90000, false), // gave up: counts against reliability, not time
      entry("bt-ping", 4000, true),
    ].map((e, i) => ({ ...e, id: String(i) }));
    const s = summarize(list);
    expect(s.total).toBe(4);
    expect(s.completed).toBe(3);
    expect(s.byKind["qr-send"]).toEqual({ total: 3, completed: 2, medianMs: 40000 });
    expect(s.byKind["bt-ping"]).toEqual({ total: 1, completed: 1, medianMs: 4000 });
    expect(s.byKind["qr-receive"]).toBeUndefined();
    expect(summarize([]).medianMs).toBeNull();
  });

  it("persists on this phone and survives a restart, then clears", async () => {
    await clearTransferLog();
    await logTransfer(entry("qr-receive", 20000, true));
    await logTransfer(entry("bt-receive", 0, true));
    expect((await kvGet<TransferEntry[]>("transfers.v1"))?.length).toBe(2);
    transferLog.set([]); // simulate a restart
    await restoreTransferLog();
    expect(transferLog.get().map((e) => e.kind)).toEqual(["qr-receive", "bt-receive"]);
    await clearTransferLog();
    expect(await kvGet<TransferEntry[]>("transfers.v1")).toEqual([]);
  });
});
