import { describe, expect, it } from "vitest";

import { MockNetwork } from "../transport/mock";
import { compute } from "./IncidentEngine";
import { CAPACITY_STATION } from "./rules";
import { applyPolicy } from "./StorePolicy";
import { SyncSession, type SyncContext } from "./SyncProtocol";
import type { Category, Observation } from "./types";
import { bytesToUuid, idsPerSummaryChunk, uuidToBytes } from "./wire";

const NOW = 1759000000;

function uuid(n: number): string {
  return "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
}

function observation(n: number, over: Partial<Observation> = {}): Observation {
  return {
    id: uuid(n),
    type: "REPORT",
    category: "FLOOD",
    device_id: "dev-x",
    lat: 14.5995,
    lon: 120.9842,
    created_at: NOW - 600,
    ...over,
  };
}

/** A device: a store plus the context a SyncSession needs. */
class Device {
  observations: Observation[];

  constructor(
    readonly id: string,
    initial: Observation[],
  ) {
    this.observations = [...initial];
  }

  context(): SyncContext {
    return {
      deviceId: this.id,
      role: "resident",
      now: () => NOW,
      observations: () => this.observations,
      apply: (incoming) => {
        // Atomic batch apply through StorePolicy, as ARCHITECTURE requires.
        const merged = [...this.observations];
        const known = new Set(merged.map((o) => o.id));
        for (const o of incoming) if (!known.has(o.id)) merged.push(o);
        this.observations = applyPolicy(merged, CAPACITY_STATION, NOW);
      },
      freeCapacity: () => CAPACITY_STATION - this.observations.length,
    };
  }

  incidentKeys(): string[] {
    return compute(this.observations, NOW).map((i) => i.key);
  }

  has(id: string): boolean {
    return this.observations.some((o) => o.id === id);
  }
}

/** Run one complete encounter between two devices over the mock network. */
async function encounter(
  network: MockNetwork,
  a: Device,
  b: Device,
  overrides: Partial<SyncContext> = {},
): Promise<{ a: SyncSession; b: SyncSession }> {
  const ta = network.device(a.id);
  const tb = network.device(b.id);

  const sessionA = new SyncSession(
    { ...a.context(), ...overrides },
    b.id,
    (p) => ta.send(b.id, p),
  );
  const sessionB = new SyncSession(
    { ...b.context(), ...overrides },
    a.id,
    (p) => tb.send(a.id, p),
  );

  // A real transport hands payloads to a listener that returns nothing, so
  // receive() promises are not awaited by the caller. Track them here and
  // drain to quiescence, otherwise the encounter can look finished while
  // batches are still being applied.
  const pending: Promise<void>[] = [];

  await ta.start({
    onPeerFound: () => {},
    onPeerLost: () => {},
    onPayload: (_from, payload) => {
      pending.push(sessionA.receive(payload));
    },
  });
  await tb.start({
    onPeerFound: () => {},
    onPeerLost: () => {},
    onPayload: (_from, payload) => {
      pending.push(sessionB.receive(payload));
    },
  });

  network.bringTogether(a.id, b.id);
  await sessionA.begin();
  await Promise.all([sessionA.finished, sessionB.finished]);
  while (pending.length > 0) {
    await Promise.all(pending.splice(0, pending.length));
  }
  return { a: sessionA, b: sessionB };
}

describe("wire format", () => {
  it("R-9: round-trips a UUID through 16 raw bytes", () => {
    const id = uuid(12345);
    const bytes = uuidToBytes(id);
    expect(bytes).toHaveLength(16);
    expect(bytesToUuid(bytes)).toBe(id);
  });

  it("rejects anything that is not a lowercase UUID", () => {
    expect(() => uuidToBytes("00000000-0000-4000-8000-00000000000g")).toThrow();
    expect(() => uuidToBytes("not-a-uuid")).toThrow();
  });

  it("sizes a 3,000-ID summary near the 48 KB the architecture assumes", () => {
    // As 36-character strings this would be about 111 KB, which is what R-9
    // corrected. 16 bytes per ID is what makes the chunk maths true.
    expect(3000 * 16).toBe(48000);
    expect(Math.ceil(3000 / idsPerSummaryChunk(30000))).toBe(2);
  });
});

describe("FR-005 encounter sync", () => {
  it("leaves two devices holding the same observations", async () => {
    const network = new MockNetwork();
    const a = new Device("dev-a", [
      observation(1, { device_id: "dev-a" }),
      observation(2, { device_id: "dev-a", category: "MEDICAL" }),
    ]);
    const b = new Device("dev-b", [observation(3, { device_id: "dev-b" })]);

    const { a: sessionA } = await encounter(network, a, b);

    expect(a.observations.map((o) => o.id).sort()).toEqual(
      b.observations.map((o) => o.id).sort(),
    );
    expect(a.observations).toHaveLength(3);
    expect(sessionA.stats.truncated).toBe(false);
  });

  it("sends nothing when both devices already agree", async () => {
    const network = new MockNetwork();
    const shared = [observation(1), observation(2)];
    const a = new Device("dev-a", shared);
    const b = new Device("dev-b", shared);

    const { a: sessionA, b: sessionB } = await encounter(network, a, b);

    expect(sessionA.stats.observationsSent).toBe(0);
    expect(sessionB.stats.observationsSent).toBe(0);
  });

  it("orders a batch most urgent incident first", async () => {
    const network = new MockNetwork();
    // SHELTER scores lowest, MEDICAL highest. All are single reports far
    // enough apart to stay separate incidents.
    const a = new Device("dev-a", [
      observation(1, { category: "SHELTER", lat: 14.7 }),
      observation(2, { category: "MEDICAL", lat: 14.8 }),
      observation(3, { category: "WATER_FOOD", lat: 14.9 }),
    ]);
    const b = new Device("dev-b", []);

    // One observation per payload, so arrival order is send order.
    await encounter(network, a, b, { maxPayloadBytes: 420 });

    const arrival = b.observations.map((o) => o.category);
    expect(arrival[0]).toBe("MEDICAL");
    expect(arrival[arrival.length - 1]).toBe("SHELTER");
  });
});

describe("PHASE-2 2a acceptance", () => {
  it("three devices converge to identical incident lists", async () => {
    const a = new Device("dev-a", [
      observation(1, { device_id: "dev-a", category: "FLOOD" }),
    ]);
    const b = new Device("dev-b", [
      observation(2, {
        device_id: "dev-b",
        category: "ROAD_BLOCKED",
        lat: 14.7,
      }),
    ]);
    const c = new Device("dev-c", [
      observation(3, { device_id: "dev-c", category: "WATER_FOOD", lat: 14.8 }),
    ]);

    await encounter(new MockNetwork(), a, b);
    await encounter(new MockNetwork(), b, c);
    await encounter(new MockNetwork(), a, c);

    expect(a.incidentKeys()).toEqual(b.incidentKeys());
    expect(b.incidentKeys()).toEqual(c.incidentKeys());
    expect(a.observations).toHaveLength(3);
  });

  it("carries a MEDICAL observation from A to C through B", async () => {
    const urgent = observation(99, { device_id: "dev-a", category: "MEDICAL" });
    const a = new Device("dev-a", [urgent]);
    const b = new Device("dev-b", []);
    const c = new Device("dev-c", []);

    // A and C never meet. B is the carrier, which is the whole premise.
    await encounter(new MockNetwork(), a, b);
    expect(b.has(urgent.id)).toBe(true);
    expect(c.has(urgent.id)).toBe(false);

    await encounter(new MockNetwork(), b, c);
    expect(c.has(urgent.id)).toBe(true);
  });

  it("NFR-004: 100 new observations cross inside the 10 s budget", async () => {
    // 1 ms latency and 250 KB/s, roughly Bluetooth-class throughput and
    // pessimistic for Wi-Fi Direct.
    const network = new MockNetwork({ latencyMs: 1, bytesPerSecond: 250000 });
    const categories: Category[] = [
      "FLOOD",
      "MEDICAL",
      "WATER_FOOD",
      "SHELTER",
    ];
    const many: Observation[] = [];
    for (let i = 0; i < 100; i++) {
      many.push(
        observation(1000 + i, {
          device_id: "dev-a",
          category: categories[i % categories.length],
          lat: 14.5995 + i * 0.002,
          note: "sample observation number " + i,
        }),
      );
    }
    const a = new Device("dev-a", many);
    const b = new Device("dev-b", []);

    const started = performance.now();
    await encounter(network, a, b);
    const elapsed = performance.now() - started;

    expect(b.observations).toHaveLength(100);
    expect(elapsed, "encounter took " + elapsed.toFixed(0) + " ms").toBeLessThan(
      10000,
    );
    console.log(
      "NFR-004: 100 observations in " +
        elapsed.toFixed(0) +
        " ms over " +
        network.sent.length +
        " payloads",
    );
  });

  it("never puts more on the air than the transport allows", async () => {
    const network = new MockNetwork({ maxPayloadBytes: 1200 });
    const many = Array.from({ length: 60 }, (_, i) =>
      observation(2000 + i, { device_id: "dev-a", lat: 14.5 + i * 0.01 }),
    );
    const a = new Device("dev-a", many);
    const b = new Device("dev-b", []);

    // MockNetwork.deliver throws if a payload exceeds the ceiling, so this
    // test passing IS the chunking assertion.
    const { a: sessionA } = await encounter(network, a, b, {
      maxPayloadBytes: 1200,
    });

    // Regression guard: a session must not report finished while its batch
    // loop is still running. Answering a peer BYE mid-loop used to resolve
    // `finished` early, which in the field means tearing down a connection
    // with observations still on the wire.
    expect(sessionA.stats.observationsSent).toBe(60);
    expect(b.observations).toHaveLength(60);
    expect(Math.max(...network.sent.map((s) => s.bytes))).toBeLessThanOrEqual(
      1200,
    );
  });
});
