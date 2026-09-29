// The one check the browser QR path needs: every frame this app draws
// (qrcode, level M, as in qr.tsx) is readable by the decoder it scans with
// (jsqr), and the frames reassemble into the same observations in core.
import jsQR from "jsqr";
import QRCode from "qrcode";
import { describe, expect, it } from "vitest";

import { BundleAssembler, encodeBundle, QR_MAX_OBSERVATIONS, type Observation } from "../../../packages/core";

const PX = 4; // pixels per module, like a phone screen seen by a camera

function decode(text: string): string | null {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = qr.modules.size + 8; // 4-module quiet zone each side
  const w = n * PX;
  const rgba = new Uint8ClampedArray(w * w * 4).fill(255);
  for (let y = 0; y < qr.modules.size; y++) {
    for (let x = 0; x < qr.modules.size; x++) {
      if (!qr.modules.get(x, y)) continue;
      for (let dy = 0; dy < PX; dy++) {
        for (let dx = 0; dx < PX; dx++) {
          const i = (((y + 4) * PX + dy) * w + (x + 4) * PX + dx) * 4;
          rgba[i] = rgba[i + 1] = rgba[i + 2] = 0;
        }
      }
    }
  }
  return jsQR(rgba, w, w, { inversionAttempts: "dontInvert" })?.data ?? null;
}

function hex(n: number, len: number): string {
  return n.toString(16).padStart(len, "0").slice(-len);
}

function page(size: number): Observation[] {
  return Array.from({ length: size }, (_, i) => ({
    id: `${hex(i + 1, 8)}-0000-4000-8000-${hex(i * 7919, 12)}`,
    type: "REPORT" as const,
    category: "FLOOD" as const,
    people: (i % 9) + 1,
    // Worst case for size: a full 140-character note on every report.
    note: "Tubig lampas daan malapit sa kapilya, may mga batang naiwan sa bubong ng bahay sa Purok 4. ".repeat(2).slice(0, 140),
    area_text: `Purok ${(i % 7) + 1}`,
    lat: 14.5995 + i / 10000,
    lon: 120.9842 - i / 10000,
    created_at: 1790000000 + i * 60,
    device_id: `aaaaaaaa-0000-4000-8000-${hex(i % 5, 12)}`,
  }));
}

describe("browser QR round trip", () => {
  it("decodes every frame of a full page and reassembles it", () => {
    const sent = page(QR_MAX_OBSERVATIONS);
    const frames = encodeBundle(sent, "a1b2c3d4");
    const assembler = new BundleAssembler();
    let result = null;
    // Reverse order: the camera catches frames in any order.
    for (const frame of [...frames].reverse()) {
      const read = decode(frame);
      expect(read).toBe(frame);
      result = assembler.accept(read!);
    }
    expect(result?.kind).toBe("complete");
    const got = result?.kind === "complete" ? (result.observations as Observation[]) : [];
    expect(got.map((o) => o.id).sort()).toEqual(sent.map((o) => o.id).sort());
    expect(got.find((o) => o.id === sent[0].id)?.note).toBe(sent[0].note);
  });
});
