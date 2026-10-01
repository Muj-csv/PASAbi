// Hand-written fixtures for each gap reason (D-038) and for CHECK (D-037).
import { describe, expect, it } from "vitest";

import { areaGaps } from "./AreaGaps";
import { compute } from "./IncidentEngine";
import { isObservation } from "./ingest";
import type { Observation } from "./types";

const NOW = 1790000000;
let n = 0;
const obs = (device: string, area: string, extra: Partial<Observation> = {}): Observation => ({
  id: `${String(++n).padStart(8, "0")}-0000-4000-8000-000000000000`,
  type: "REPORT",
  category: "FLOOD",
  area_text: area,
  created_at: NOW - 600,
  device_id: `${device.repeat(8)}-0000-4000-8000-000000000000`,
  ...extra,
});
const byArea = (gaps: ReturnType<typeof areaGaps>, area: string) => gaps.find((g) => g.area === area)!;

describe("area information gaps", () => {
  it("an expected area with no reports is a gap: no observations, never safe", () => {
    const g = byArea(areaGaps([], NOW, ["Purok 5"]), "purok 5");
    expect(g.reasons).toEqual(["no_observations"]);
    expect(JSON.stringify(g)).not.toMatch(/safe/i);
  });

  it("names stale, single-source and uncertain areas, and clears a well-covered one", () => {
    const held = [
      obs("a", "Purok 1", { created_at: NOW - 4 * 3600 }), // stale
      obs("b", "Purok 2"), // one phone only, and its incident rests on one phone
      obs("c", "Purok 3"),
      obs("d", "Purok 3"),
      obs("e", "Purok 3"), // three phones, corroborated incident
    ];
    const gaps = areaGaps(held, NOW);
    // Stale, and its one open incident rests on a single phone.
    expect(byArea(gaps, "purok 1").reasons).toEqual(["stale", "uncertain"]);
    expect(byArea(gaps, "purok 2").reasons).toEqual(["single_source", "uncertain"]);
    expect(byArea(gaps, "purok 3").reasons).toEqual([]);
  });

  it("CHECK: a sweep's 'not seen' is observed coverage, never an incident (D-037)", () => {
    const check = obs("f", "Purok 6", { type: "CHECK", category: "TRAPPED" });
    expect(isObservation(check)).toBe(true);
    expect(isObservation({ ...check, area_text: undefined })).toBe(false); // must name the area
    expect(compute([check], NOW)).toEqual([]);
    const g = byArea(areaGaps([check], NOW, ["Purok 6"]), "purok 6");
    expect(g.reasons).not.toContain("no_observations"); // somebody went and looked
    expect(g.notSeenWhenChecked).toEqual(["TRAPPED"]);
  });
});
