// The PWA's store (IndexedDB port of src/storage/observations.ts). What must
// hold: receiveObservations() is the ONE ingest path, it resets local-only
// fields (BR-016), never replaces what is held, drops malformed input, and
// propagation flags come only from markPassedOn (BR-015).
import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import type { Observation } from "@pasabi/core";

import { kvSet } from "./kv";
import {
  createReport,
  markPassedOn,
  observations,
  receiveObservations,
  refreshStore,
} from "./observations";

const ME = "aaaaaaaa-0000-4000-8000-000000000001";
const PEER = "bbbbbbbb-0000-4000-8000-000000000002";

function now(): number {
  return Math.floor(Date.now() / 1000);
}

function peerReport(id: string, extra: Partial<Observation> = {}): Observation {
  return {
    id,
    type: "REPORT",
    category: "FLOOD",
    area_text: "Purok 4",
    created_at: now() - 60,
    device_id: PEER,
    ...extra,
  };
}

const held = (id: string) => observations.get().find((o) => o.id === id);

beforeEach(async () => {
  await kvSet("observations.v1", []);
  await refreshStore();
});

describe("PWA observation store", () => {
  it("stores an own report, marked own and not yet uploaded", async () => {
    const id = await createReport({ category: "TRAPPED", people: 3, area_text: " Purok 2 " }, ME);
    const o = held(id)!;
    expect(o).toMatchObject({ type: "REPORT", own: true, uploaded: false, area_text: "Purok 2", people: 3 });
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("strips local-only fields a sender tried to smuggle in (BR-016)", async () => {
    const id = "cccccccc-0000-4000-8000-000000000003";
    const added = await receiveObservations([
      peerReport(id, { own: true, uploaded: true, passed_on: true, reached_station: true }),
    ]);
    expect(added).toBe(1);
    const o = held(id)!;
    expect(o.own).not.toBe(true);
    expect(o.uploaded).not.toBe(true);
    expect(o.passed_on).not.toBe(true);
    expect(o.reached_station).not.toBe(true);
  });

  it("never replaces what it holds, and counts only what is new", async () => {
    const mine = await createReport({ category: "FLOOD", area_text: "Purok 4" }, ME);
    // My own report coming back from another phone must stay mine.
    const added = await receiveObservations([{ ...held(mine)!, own: false }]);
    expect(added).toBe(0);
    expect(held(mine)!.own).toBe(true);
  });

  it("drops malformed input instead of storing it", async () => {
    const added = await receiveObservations([{ foo: 1 }, null, "PSB1:junk", { id: "not-a-uuid", type: "REPORT" }]);
    expect(added).toBe(0);
    expect(observations.get()).toHaveLength(0);
  });

  it("sets propagation flags only through a receipt (BR-015)", async () => {
    const id = await createReport({ category: "MEDICAL", area_text: "Purok 1" }, ME);
    expect(held(id)!.passed_on).not.toBe(true);
    await markPassedOn([id], "resident");
    expect(held(id)).toMatchObject({ passed_on: true });
    expect(held(id)!.reached_station).not.toBe(true);
    await markPassedOn([id], "station");
    expect(held(id)).toMatchObject({ passed_on: true, reached_station: true });
  });
});
