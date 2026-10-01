import { describe, expect, it } from "vitest";

import { compute } from "./IncidentEngine";
import { mergeReceived, WIRE_FIELDS } from "./ingest";
import { coarsePassport, passportFromJson, passportOf, passportToApiPayload, passportToCsv, passportToJson } from "./Passport";
import { BundleAssembler, encodeBundle } from "./qr";
import type { Observation } from "./types";

const NOW = 1790000000;
const A = "aaaaaaaa-0000-4000-8000-000000000001";
const B = "bbbbbbbb-0000-4000-8000-000000000002";

const report = (n: number, device: string, extra: Partial<Observation> = {}): Observation => ({
  id: `0000000${n}-0000-4000-8000-000000000000`,
  type: "REPORT",
  category: "FLOOD",
  area_text: "Purok 4",
  lat: 14.5995,
  lon: 120.9842,
  created_at: NOW - 600 + n,
  device_id: device,
  received_at: NOW - 500,
  own: device === A,
  passed_on: device === A,
  ...extra,
});

// Two phones, three reports (one with a tricky note), one acknowledgement.
const held: Observation[] = [
  report(1, A, { people: 3, note: 'Water "knee-deep", near chapel\nhurry' }),
  report(2, B),
  report(3, A),
  {
    id: "00000009-0000-4000-8000-000000000000",
    type: "STATUS",
    action: "ACK",
    refs: ["00000001-0000-4000-8000-000000000000"],
    created_at: NOW - 100,
    device_id: B,
  },
];
const KEY = "00000001-0000-4000-8000-000000000000";

describe("Incident Passport", () => {
  const p = passportOf(KEY, held, NOW)!;

  it("keeps reports, sources, corroboration, derived state and unknowns distinct", () => {
    expect(p.reportCount).toBe(3);
    expect(p.independentSourceCount).toBe(2); // phones, not people
    expect(p.corroboration).toBe("corroborated");
    expect(p.currentStatus).toBe("acknowledged");
    expect(p.affectedPeople).toEqual({ upTo: 3, reported: true });
    expect(p.evidenceTimeline.map((e) => e.type)).toEqual(["REPORT", "REPORT", "REPORT", "STATUS"]);
    expect(p.unknowns.notYetReportedNearby.length).toBeGreaterThan(0); // stays visible
    expect(p.caveats).toContain("no_report_is_not_none");
    expect(JSON.stringify(p)).not.toMatch(/\bsafe\b/i);
  });

  it("never leaks local-only fields in its evidence (BR-016)", () => {
    for (const o of p.supportingEvidence) {
      for (const k of Object.keys(o)) expect(WIRE_FIELDS as readonly string[]).toContain(k);
    }
    // They are reported as THIS phone's view (D-039), outside the evidence.
    expect(p.propagationHistory.find((e) => e.observationId === KEY)).toMatchObject({ own: true, passedOn: true });
  });

  it("round-trips through JSON unchanged, and rejects non-passports", () => {
    expect(passportFromJson(passportToJson(p))).toEqual(p);
    expect(passportFromJson('{"schema":"something-else"}')).toBeNull();
    expect(passportFromJson("not json")).toBeNull();
    expect(JSON.parse(passportToApiPayload(p)).passport).toEqual(p);
  });

  it("round-trips by QR: the receiver rebuilds the same incident itself (D-035)", () => {
    const frames = encodeBundle(p.supportingEvidence, "pp1");
    const assembler = new BundleAssembler();
    let result = null;
    for (const f of frames.reverse()) result = assembler.accept(f);
    expect(result?.kind).toBe("complete");
    const received = mergeReceived([], result?.kind === "complete" ? result.observations : [], NOW);
    const rebuilt = compute(received, NOW).find((i) => i.key === KEY)!;
    expect(rebuilt.observationIds).toEqual(compute(held, NOW).find((i) => i.key === KEY)!.observationIds);
    const again = passportOf(KEY, received, NOW)!;
    expect(again.reportCount).toBe(p.reportCount);
    expect(again.independentSourceCount).toBe(p.independentSourceCount);
    expect(again.currentStatus).toBe(p.currentStatus);
    expect(again.evidenceTimeline).toEqual(p.evidenceTimeline);
  });

  it("exports CSV that survives commas, quotes and newlines in notes", () => {
    const csv = passportToCsv(p);
    expect(csv.startsWith("field,value\r\n")).toBe(true);
    expect(csv).toContain('"Water ""knee-deep"", near chapel\nhurry"');
    expect(csv).toContain("independentSourceCount,2");
  });

  it("coarsens location for export, and keeps the rest untouched (P6)", () => {
    const c = coarsePassport(p);
    expect(c.location.centroid).toEqual({ lat: 14.6, lon: 120.984 });
    for (const o of c.supportingEvidence) {
      if (typeof o.lat === "number") expect(o.lat).toBe(14.6);
      expect(o.accuracy_m).toBeUndefined();
    }
    expect(c.reportCount).toBe(p.reportCount);
    expect(c.evidenceTimeline).toEqual(p.evidenceTimeline);
  });

  it("flags single-source and stale incidents as uncertain", () => {
    const lone = passportOf("00000007-0000-4000-8000-000000000000", [report(7, B, { created_at: NOW - 4 * 3600 })], NOW)!;
    expect(lone.uncertainty).toEqual(expect.arrayContaining(["single_source", "stale", "people_not_reported"]));
    expect(lone.affectedPeople).toEqual({ upTo: null, reported: false });
    expect(passportOf("ffffffff-0000-4000-8000-000000000000", held, NOW)).toBeNull();
  });
});
