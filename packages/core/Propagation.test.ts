import { describe, expect, it } from "vitest";

import { compute } from "./IncidentEngine";
import { markPropagated, propagationFor } from "./Propagation";
import type { Observation } from "./types";
import { toServerRow } from "./upload";
import { decode, encodeBatch, MSG_BATCH } from "./wire";

const NOW = 1759000000;

function uuid(n: number): string {
  return "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
}

function obs(n: number, over: Partial<Observation> = {}): Observation {
  return {
    id: uuid(n),
    type: "REPORT",
    category: "FLOOD",
    area_text: "Purok 4",
    created_at: NOW - 600,
    device_id: "dev-me",
    own: true,
    uploaded: false,
    ...over,
  };
}

describe("BR-015 marking what this phone actually knows", () => {
  it("a receipt from a resident marks passed on, not reached a station", () => {
    const [o] = markPropagated([obs(1)], [uuid(1)], "resident");
    expect(o.passed_on).toBe(true);
    expect(o.reached_station).toBe(false);
  });

  it("a receipt from a station marks both", () => {
    const [o] = markPropagated([obs(1)], [uuid(1)], "station");
    expect(o.passed_on).toBe(true);
    expect(o.reached_station).toBe(true);
  });

  it("flags only ever go from false to true", () => {
    const reached = markPropagated([obs(1)], [uuid(1)], "station");
    const [again] = markPropagated(reached, [uuid(1)], "resident");
    expect(again.reached_station).toBe(true);
    expect(again.passed_on).toBe(true);
  });

  it("marks only this phone's own observations, and only the ones sent", () => {
    const held = [obs(1), obs(2), obs(3, { own: false, device_id: "dev-b" })];
    const marked = markPropagated(held, [uuid(1), uuid(3)], "station");
    expect(marked[0].passed_on).toBe(true);
    expect(marked[1]).toBe(held[1]);
    // A carried report's status belongs to the phone that made it.
    expect(marked[2]).toBe(held[2]);
  });

  it("BR-016: the new flags never reach the wire or a server row", () => {
    const [o] = markPropagated([obs(1)], [uuid(1)], "station");
    const message = decode(encodeBatch([o]));
    if (message.type !== MSG_BATCH) throw new Error("expected a batch");
    expect(message.observations[0]).not.toHaveProperty("passed_on");
    expect(message.observations[0]).not.toHaveProperty("reached_station");
    expect(toServerRow(o)).not.toHaveProperty("passed_on");
    expect(toServerRow(o)).not.toHaveProperty("reached_station");
  });
});

describe("FR-015 status for the reporter", () => {
  it("reports each flag as it is, never implying a stronger step", () => {
    // Uploaded without ever being passed on: the passed step stays false.
    const held = [obs(1, { uploaded: true })];
    const status = propagationFor(held, compute(held, NOW)).get(uuid(1));
    expect(status).toEqual({
      passedOn: false,
      reachedStation: false,
      uploaded: true,
      groupedWith: 0,
    });
  });

  it("counts the OTHER phones in the same incident", () => {
    const held = [
      obs(1),
      obs(2), // same phone again: still no other phone
      obs(3, { own: false, device_id: "dev-b" }),
      obs(4, { own: false, device_id: "dev-c" }),
    ];
    const status = propagationFor(held, compute(held, NOW));
    expect(status.get(uuid(1))?.groupedWith).toBe(2);
    expect(status.get(uuid(2))?.groupedWith).toBe(2);
  });

  it("covers own observations only", () => {
    const held = [obs(1), obs(2, { own: false, device_id: "dev-b" })];
    const status = propagationFor(held, compute(held, NOW));
    expect([...status.keys()]).toEqual([uuid(1)]);
  });

  it("a check-in forms no incident, so it is grouped with nobody", () => {
    const held = [obs(1, { category: "SAFE_CHECKIN" })];
    expect(propagationFor(held, compute(held, NOW)).get(uuid(1))?.groupedWith).toBe(0);
  });
});
