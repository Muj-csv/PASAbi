import { describe, expect, it } from "vitest";

import { toWire } from "./ingest";
import {
  BundleAssembler,
  bundlePages,
  decodeId,
  decodeReceipt,
  encodeBundle,
  encodeId,
  encodeReceipt,
  fromBase64,
  rememberReceipt,
  toBase64,
  type AckMemory,
} from "./qr";
import {
  QR_ACK_MEMORY_RECEIVERS,
  QR_FRAME_CHARS,
  QR_MAX_OBSERVATIONS,
  TTL_SECONDS,
} from "./rules";
import type { Category, Observation } from "./types";

const NOW = 1759000000;
const DEV_A = "3f9a1c2e-7b44-4d0e-9a51-6c2d8e1f0a37";
const DEV_B = "b07d55e1-2c9f-4a63-8e10-d4f7a2b96c05";

function uuid(n: number): string {
  return "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
}

/** Realistic content: full GPS doubles and a Filipino/English note (ARGUS). */
function obs(n: number, over: Partial<Observation> = {}): Observation {
  return {
    id: uuid(n),
    type: "REPORT",
    category: "FLOOD",
    people: n % 7,
    note: "hanggang tuhod ang baha sa tapat ng kapilya, tumataas pa " + n,
    lat: 14.599512345678901 + n * 0.002,
    lon: 120.98421234567891,
    accuracy_m: 12.345678,
    created_at: NOW - 600 - n,
    device_id: n % 2 === 0 ? DEV_A : DEV_B,
    received_at: NOW,
    hops: 0,
    own: true,
    uploaded: false,
    ...over,
  };
}

/** Feed every frame; return what the assembler finished with. */
function assemble(frames: string[]): ReturnType<BundleAssembler["accept"]> {
  const a = new BundleAssembler();
  let last: ReturnType<BundleAssembler["accept"]> = { kind: "invalid" };
  for (const f of frames) last = a.accept(f);
  return last;
}

describe("base64 (no Buffer in React Native)", () => {
  it("matches Node's encoder for every padding case", () => {
    for (const len of [0, 1, 2, 3, 4, 5, 255]) {
      const bytes = Uint8Array.from({ length: len }, (_, i) => (i * 37 + 11) % 256);
      const expected = Buffer.from(bytes).toString("base64");
      expect(toBase64(bytes)).toBe(expected);
      expect([...fromBase64(expected)]).toEqual([...bytes]);
    }
  });

  it("rejects text that is not base64", () => {
    expect(() => fromBase64("ab$=")).toThrow();
    expect(() => fromBase64("abc")).toThrow();
  });
});

describe("FR-013 bundle round trip", () => {
  it("one observation", () => {
    const o = obs(1);
    const result = assemble(encodeBundle([o], "a1b2c3d4"));
    expect(result).toEqual({
      kind: "complete",
      bundleId: "a1b2c3d4",
      observations: [toWire(o)],
    });
  });

  it("a full page of 60, every frame within QR_FRAME_CHARS", () => {
    const page = Array.from({ length: QR_MAX_OBSERVATIONS }, (_, i) => obs(i + 1));
    const frames = encodeBundle(page, "b1");
    for (const f of frames) {
      const chunk = f.split(":")[3];
      expect(chunk.length).toBeLessThanOrEqual(QR_FRAME_CHARS);
    }
    // D-027: deflate keeps a realistic page near the 18 frames ARGUS measured.
    expect(frames.length).toBeLessThanOrEqual(20);
    const result = assemble(frames);
    expect(result.kind).toBe("complete");
    if (result.kind === "complete") {
      expect(result.observations).toEqual(page.map(toWire));
    }
  });

  it("BR-016: nothing local-only crosses in a bundle", () => {
    const result = assemble(encodeBundle([obs(1, { passed_on: true })], "c1"));
    if (result.kind !== "complete") throw new Error("expected complete");
    const o = result.observations[0] as Record<string, unknown>;
    for (const f of ["received_at", "hops", "own", "uploaded", "passed_on"]) {
      expect(o).not.toHaveProperty(f);
    }
  });

  it("frames arrive shuffled and duplicated", () => {
    const page = Array.from({ length: 30 }, (_, i) => obs(i + 1));
    const frames = encodeBundle(page, "d1");
    expect(frames.length).toBeGreaterThan(2);
    const messy = [...frames].reverse().flatMap((f) => [f, f]);
    const a = new BundleAssembler();
    let done = 0;
    for (const f of messy) if (a.accept(f).kind === "complete") done += 1;
    // Completes on the last new frame, then keeps answering complete.
    expect(done).toBeGreaterThan(0);
    expect(a.received).toBe(frames.length);
  });

  it("reports progress as received / total", () => {
    const frames = encodeBundle(
      Array.from({ length: 30 }, (_, i) => obs(i + 1)),
      "e1",
    );
    const a = new BundleAssembler();
    expect(a.accept(frames[1])).toEqual({
      kind: "progress",
      received: 1,
      total: frames.length,
    });
  });

  it("rejects a frame from another bundle and still finishes this one", () => {
    const mine = encodeBundle([obs(1), obs(2)], "f1");
    const theirs = encodeBundle([obs(3)], "f2");
    const a = new BundleAssembler();
    a.accept(mine[0]);
    expect(a.accept(theirs[0])).toEqual({ kind: "wrong-bundle" });
    let last = a.accept(mine[0]);
    for (const f of mine.slice(1)) last = a.accept(f);
    expect(last.kind).toBe("complete");
  });

  it("garbage is invalid and never throws", () => {
    const a = new BundleAssembler();
    for (const text of [
      "",
      "hello",
      "https://example.com",
      "PSB1:ab:0/3:QUJD",
      "PSB1:ab:4/3:QUJD",
      "PSB1:AB:1/1:QUJD",
      "PSR1:ab:station:" + DEV_A,
    ]) {
      expect(a.accept(text)).toEqual({ kind: "invalid" });
    }
    // Well-formed frames whose content is not a deflated batch.
    expect(assemble(["PSB1:zz:1/1:QUJDRA=="])).toEqual({ kind: "invalid" });
  });
});

describe("D-025 paging", () => {
  it("61 observations make a page of 60 and a page of 1", () => {
    const all = Array.from({ length: 61 }, (_, i) =>
      obs(i + 1, { lat: 14.5 + i * 0.01 }),
    );
    const pages = bundlePages(all, NOW, new Set());
    expect(pages.map((p) => p.length)).toEqual([60, 1]);
  });

  it("most urgent first, skipping what this receiver already acknowledged", () => {
    const cat = (n: number, category: Category, lat: number) =>
      obs(n, { category, lat, people: 0 });
    const all = [
      cat(1, "SHELTER", 14.1),
      cat(2, "MEDICAL", 14.2),
      cat(3, "ROAD_BLOCKED", 14.3),
      cat(4, "MEDICAL", 14.4),
    ];
    const [first] = bundlePages(all, NOW, new Set());
    expect(first.map((o) => o.category)).toEqual([
      "MEDICAL",
      "MEDICAL",
      "ROAD_BLOCKED",
      "SHELTER",
    ]);

    const [skipped] = bundlePages(all, NOW, new Set([uuid(2)]));
    expect(skipped.map((o) => o.id)).toEqual([uuid(4), uuid(3), uuid(1)]);
  });

  it("never bundles expired observations, and nothing left means no pages", () => {
    const old = obs(1, { created_at: NOW - TTL_SECONDS });
    expect(bundlePages([old], NOW, new Set())).toEqual([]);
  });
});

describe("receipts and ID frames", () => {
  it("round-trip", () => {
    const r = { bundleId: "a1b2c3d4", role: "station" as const, deviceId: DEV_A };
    expect(decodeReceipt(encodeReceipt(r))).toEqual(r);
    expect(decodeId(encodeId("resident", DEV_B))).toEqual({
      role: "resident",
      deviceId: DEV_B,
    });
  });

  it("reject anything else", () => {
    expect(decodeReceipt("PSR1:a1:admin:" + DEV_A)).toBeNull();
    expect(decodeReceipt("PSR1:a1:station:not-a-uuid-not-a-uuid-not-a-uuid-xx")).toBeNull();
    expect(decodeReceipt(encodeId("station", DEV_A))).toBeNull();
    expect(decodeId("PSB1:a1:1/1:QQ==")).toBeNull();
  });
});

describe("D-025 sender-side memory", () => {
  it("merges receipts per receiver and forgets IDs no longer held", () => {
    const held = new Set([uuid(1), uuid(2), uuid(3)]);
    let m: AckMemory = {};
    m = rememberReceipt(m, DEV_B, [uuid(1), uuid(9)], held, NOW);
    m = rememberReceipt(m, DEV_B, [uuid(2)], held, NOW + 10);
    expect(m[DEV_B]).toEqual({ ids: [uuid(1), uuid(2)], at: NOW + 10 });
  });

  it("keeps only the most recent receivers", () => {
    let m: AckMemory = {};
    for (let i = 0; i < QR_ACK_MEMORY_RECEIVERS + 5; i++) {
      m = rememberReceipt(m, "receiver-" + i, [], new Set(), NOW + i);
    }
    const kept = Object.keys(m);
    expect(kept).toHaveLength(QR_ACK_MEMORY_RECEIVERS);
    expect(kept).not.toContain("receiver-0");
    expect(kept).toContain("receiver-" + (QR_ACK_MEMORY_RECEIVERS + 4));
  });
});
