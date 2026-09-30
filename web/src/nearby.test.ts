// Ping (D-033) on the mock network: one tap reaches every phone in range,
// both sides end up holding the union, and only batches that went out mark
// the sender's own reports passed on (BR-015). Proves the protocol wiring,
// not a real radio (see packages/transport/mock.ts).
import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import type { Observation, Role } from "@pasabi/core";

import { MockNetwork } from "../../packages/transport/mock";

import { NearbyNode, type NearbyStore } from "./nearby";

const T0 = 1790000000;

function report(n: number, device: string): Observation {
  return {
    id: `${String(n).padStart(8, "0")}-0000-4000-8000-000000000000`,
    type: "REPORT",
    category: "FLOOD",
    area_text: "Purok 4",
    created_at: T0 - 60 * n,
    device_id: device,
    own: true,
  };
}

function memoryStore(role: Role, held: Observation[]) {
  const passedOn: { ids: string[]; role: Role }[] = [];
  /** Who each received batch came from: what the Receive screen shows. */
  const receivedFrom: string[] = [];
  const store: NearbyStore = {
    role: () => role,
    observations: () => held,
    apply: (incoming, from) => {
      receivedFrom.push(from);
      for (const o of incoming) if (!held.some((h) => h.id === o.id)) held.push({ ...o, own: false });
    },
    freeCapacity: () => 1000,
    onSent: (ids, peerRole) => passedOn.push({ ids, role: peerRole }),
  };
  return { store, held, passedOn, receivedFrom };
}

const A = "aaaaaaaa-0000-4000-8000-000000000001";
const B = "bbbbbbbb-0000-4000-8000-000000000002";
const C = "cccccccc-0000-4000-8000-000000000003";

describe("NearbyNode ping", () => {
  it("passes to every phone in range with one tap, and syncs both ways", async () => {
    const net = new MockNetwork();
    const a = memoryStore("resident", [report(1, A), report(2, A)]);
    const b = memoryStore("station", [report(3, B)]);
    const c = memoryStore("resident", []);
    const nodes = [
      new NearbyNode(net.device(A), a.store, () => T0),
      new NearbyNode(net.device(B), b.store, () => T0),
      new NearbyNode(net.device(C), c.store, () => T0),
    ];
    await Promise.all(nodes.map((n) => n.start()));
    net.bringTogether(A, B);
    net.bringTogether(A, C);
    expect([...nodes[0].peers].sort()).toEqual([B, C]);

    const result = await nodes[0].pingAll();

    expect(result.reached).toBe(2);
    const ids = (s: { held: Observation[] }) => s.held.map((o) => o.id).sort();
    expect(ids(b)).toEqual(ids(a)); // B got A's two, A got B's one
    // B was only waiting (never tapped anything) and knows who pinged it.
    expect(b.receivedFrom).toContain(A);
    // The exchanges run at the same moment, so C gets what A held when the
    // ping began; B's report reaches C on A's next ping (store and carry).
    expect(ids(c)).toEqual([report(1, A).id, report(2, A).id]);
    await nodes[0].pingAll();
    expect(ids(c)).toContain(report(3, B).id);
    // Passed on to a station and to a resident, each honestly labelled.
    expect(a.passedOn.map((p) => p.role).sort()).toContain("station");
    expect(a.passedOn.flatMap((p) => p.ids)).toContain(report(1, A).id);
  });

  it("reaches nobody, and marks nothing, when no phone is in range", async () => {
    const net = new MockNetwork();
    const a = memoryStore("resident", [report(1, A)]);
    const node = new NearbyNode(net.device(A), a.store, () => T0);
    await node.start();
    expect(await node.pingAll()).toEqual({ reached: 0, sent: 0 });
    expect(a.passedOn).toHaveLength(0);
  });

  it("forgets a phone that walked out of range", async () => {
    const net = new MockNetwork();
    const a = memoryStore("resident", [report(1, A)]);
    const b = memoryStore("resident", []);
    const na = new NearbyNode(net.device(A), a.store, () => T0);
    const nb = new NearbyNode(net.device(B), b.store, () => T0);
    await Promise.all([na.start(), nb.start()]);
    net.bringTogether(A, B);
    net.separate(A, B);
    expect(na.peers.size).toBe(0);
    expect((await na.pingAll()).reached).toBe(0);
  });
});
