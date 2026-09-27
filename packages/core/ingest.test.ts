import { describe, expect, it } from "vitest";

import {
  asReceived,
  isObservation,
  mergeReceived,
  toWire,
  WIRE_FIELDS,
} from "./ingest";
import { RATE_LIMIT_PER_HOUR } from "./rules";
import { canCreate } from "./StorePolicy";
import type { Observation } from "./types";
import { toServerRow } from "./upload";
import { decode, encodeBatch, MSG_BATCH } from "./wire";

const NOW = 1759000000;

function uuid(n: number): string {
  return "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
}

const LOCAL_ONLY = [
  "received_at",
  "hops",
  "own",
  "uploaded",
  "passed_on",
  "reached_station",
] as const;

/** An own observation as the store holds it: every local-only field set. */
function held(n: number, over: Partial<Observation> = {}): Observation {
  return {
    id: uuid(n),
    type: "REPORT",
    category: "FLOOD",
    people: 3,
    note: "water entering the road",
    lat: 14.5995,
    lon: 120.9842,
    accuracy_m: 12,
    area_text: "Purok 4",
    created_at: NOW - 600,
    device_id: "dev-a",
    received_at: NOW - 600,
    hops: 0,
    own: true,
    uploaded: true,
    passed_on: true,
    reached_station: true,
    ...over,
  };
}

describe("BR-016 wire hygiene", () => {
  it("an encoded batch carries no local-only field", () => {
    const message = decode(encodeBatch([held(1), held(2)]));
    if (message.type !== MSG_BATCH) throw new Error("expected a batch");
    for (const o of message.observations) {
      for (const field of LOCAL_ONLY) expect(o).not.toHaveProperty(field);
    }
  });

  it("toWire keeps every shared field intact", () => {
    const o = held(1, { refs: [uuid(9)], action: "ACK", sig: "abc" });
    const wire = toWire(o);
    for (const field of WIRE_FIELDS) expect(wire[field]).toEqual(o[field]);
    expect(Object.keys(wire).sort()).toEqual([...WIRE_FIELDS].sort());
  });

  it("wire fields and server columns name the same set, minus sig", () => {
    // If a field is ever added to one and not the other, this fails.
    const full = held(1, { refs: [uuid(9)], action: "ACK", sig: "abc" });
    expect(Object.keys(toServerRow(full)).sort()).toEqual(
      WIRE_FIELDS.filter((f) => f !== "sig").sort(),
    );
  });
});

describe("receiving observations", () => {
  it("a received observation is never own or uploaded, whatever the sender said", () => {
    const o = asReceived(held(1), NOW);
    expect(o.own).toBe(false);
    expect(o.uploaded).toBe(false);
    expect(o.received_at).toBe(NOW);
    expect(o).not.toHaveProperty("passed_on");
    expect(o).not.toHaveProperty("reached_station");
    expect(o).not.toHaveProperty("hops");
  });

  it("an own observation echoed back by a peer stays own", () => {
    const mine = held(1);
    const merged = mergeReceived([mine], [toWire(mine)], NOW);
    expect(merged).toEqual([mine]);
  });

  it("dedupes within a batch and across ID case", () => {
    const upper = { ...toWire(held(1)), id: uuid(1).toUpperCase() };
    const merged = mergeReceived([], [toWire(held(1)), upper], NOW);
    expect(merged.map((o) => o.id)).toEqual([uuid(1)]);
  });

  it("drops malformed items and keeps the valid ones beside them", () => {
    const good = toWire(held(1, { device_id: "dev-b" }));
    const bad: unknown[] = [
      null,
      "text",
      { ...good, id: "not-a-uuid" },
      { ...good, id: uuid(2), category: "EARTHQUAKE" },
      { ...good, id: uuid(3), note: { html: "x" } },
      { ...good, id: uuid(4), created_at: 1.5 },
      { ...good, id: uuid(5), device_id: "" },
      { ...good, id: uuid(6), type: "STATUS", refs: ["nope"] },
    ];
    const merged = mergeReceived([], [...bad, good], NOW);
    expect(merged.map((o) => o.id)).toEqual([uuid(1)]);
    expect(isObservation(good)).toBe(true);
  });

  it("BR-010: received reports never count toward this device's rate limit", () => {
    const fromPeers = Array.from({ length: RATE_LIMIT_PER_HOUR }, (_, i) =>
      toWire(held(i + 1, { device_id: "dev-b", created_at: NOW - 60 })),
    );
    const store = mergeReceived([], fromPeers, NOW);
    expect(store).toHaveLength(RATE_LIMIT_PER_HOUR);
    expect(canCreate(store, "dev-a", NOW)).toBe(true);
  });
});
