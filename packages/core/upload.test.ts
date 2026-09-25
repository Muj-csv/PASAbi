import { describe, expect, it } from "vitest";

import { compute } from "./IncidentEngine";
import type { Observation } from "./types";
import {
  epochSecondsToIso,
  fromServerRow,
  isoToEpochSeconds,
  toServerRow,
  wasUploadedBefore,
} from "./upload";

const NOW = 1759000000;

function uuid(n: number): string {
  return "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
}

describe("FR-009 server row mapping", () => {
  it("round-trips epoch seconds through ISO-8601", () => {
    const iso = epochSecondsToIso(NOW);
    expect(isoToEpochSeconds(iso)).toBe(NOW);
    expect(iso.endsWith("Z"), "must be UTC, not local time").toBe(true);
  });

  it("keeps an observation identical across upload and read-back", () => {
    const original: Observation = {
      id: uuid(1),
      type: "REPORT",
      category: "FLOOD",
      people: 3,
      note: "water entering the road",
      lat: 14.5995,
      lon: 120.9842,
      accuracy_m: 12.5,
      area_text: "Purok 3",
      created_at: NOW - 600,
      device_id: "dev-a",
    };

    const restored = fromServerRow(toServerRow(original));

    // `own` is added by fromServerRow: the dashboard created none of these.
    expect(restored).toEqual({ ...original, own: false });
  });

  it("round-trips a STATUS observation with refs", () => {
    const status: Observation = {
      id: uuid(2),
      type: "STATUS",
      action: "RESOLVE",
      refs: [uuid(1), uuid(3)],
      created_at: NOW - 60,
      device_id: "dev-station",
    };
    const restored = fromServerRow(toServerRow(status));
    expect(restored.action).toBe("RESOLVE");
    expect(restored.refs).toEqual([uuid(1), uuid(3)]);
  });

  it("never sends local-only fields to the server", () => {
    const row = toServerRow({
      id: uuid(4),
      type: "REPORT",
      category: "MEDICAL",
      created_at: NOW,
      device_id: "dev-a",
      received_at: NOW,
      hops: 2,
      own: true,
      uploaded: false,
      sig: "signature-bytes",
    });

    for (const local of ["received_at", "hops", "own", "uploaded", "sig"]) {
      expect(
        Object.prototype.hasOwnProperty.call(row, local),
        local + " must not be uploaded",
      ).toBe(false);
    }
  });

  it("uses null rather than undefined, because the target is SQL", () => {
    const row = toServerRow({
      id: uuid(5),
      type: "REPORT",
      category: "SHELTER",
      created_at: NOW,
      device_id: "dev-a",
    });
    expect(row.note).toBeNull();
    expect(row.lat).toBeNull();
    expect(row.refs).toBeNull();
    expect(row.people).toBeNull();
  });

  it("gives the dashboard the same incidents a device would compute", () => {
    // The Phase 4 acceptance criterion: same observations in, same incidents
    // out, whichever side of the upload you are standing on.
    const local: Observation[] = [
      {
        id: uuid(10),
        type: "REPORT",
        category: "FLOOD",
        device_id: "dev-a",
        lat: 14.5995,
        lon: 120.9842,
        created_at: NOW - 900,
      },
      {
        id: uuid(11),
        type: "REPORT",
        category: "FLOOD",
        device_id: "dev-b",
        lat: 14.59995,
        lon: 120.9842,
        created_at: NOW - 600,
      },
    ];

    const uploaded = local.map(toServerRow).map(fromServerRow);

    expect(JSON.stringify(compute(uploaded, NOW))).toBe(
      JSON.stringify(compute(local, NOW)),
    );
  });
});

describe("FR-007 since last sync", () => {
  it("counts a row as already seen only when the server saw it first", () => {
    const base = toServerRow({
      id: uuid(20),
      type: "REPORT",
      category: "FLOOD",
      created_at: NOW,
      device_id: "dev-a",
    });

    const old = { ...base, first_uploaded_at: epochSecondsToIso(NOW - 7200) };
    const fresh = { ...base, first_uploaded_at: epochSecondsToIso(NOW - 60) };

    expect(wasUploadedBefore(old, NOW - 3600)).toBe(true);
    expect(wasUploadedBefore(fresh, NOW - 3600)).toBe(false);
    // Unknown upload time must read as new, never as already seen.
    expect(wasUploadedBefore(base, NOW - 3600)).toBe(false);
  });
});
