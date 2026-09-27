import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { coverageByArea, type AreaCoverage } from "./Coverage";
import { COVERAGE_STALE_SECONDS } from "./rules";
import type { Observation } from "./types";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "evidence-vectors");

interface Fixture {
  name: string;
  now: number;
  observations: Observation[];
  expected_areas?: string[];
  coverage?: AreaCoverage[];
}

const fixtures = readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((file) => ({
    file,
    data: JSON.parse(readFileSync(join(DIR, file), "utf8")) as Fixture,
  }))
  .filter(({ data }) => data.coverage !== undefined);

describe("coverage vectors (hand-written from BR-014)", () => {
  it("finds the coverage fixtures", () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(1);
  });

  for (const { file, data } of fixtures) {
    it(file + " : " + data.name, () => {
      expect(
        coverageByArea(data.observations, data.now, data.expected_areas ?? []),
      ).toEqual(data.coverage);
    });

    it(file + " : independent of input order", () => {
      expect(
        coverageByArea(
          [...data.observations].reverse(),
          data.now,
          [...(data.expected_areas ?? [])].reverse(),
        ),
      ).toEqual(data.coverage);
    });
  }
});

describe("coverage edge cases", () => {
  const report = (area: string | undefined, created_at: number): Observation => ({
    id: "00000000-0000-4000-8000-000000000001",
    type: "REPORT",
    category: "FLOOD",
    device_id: "dev-a",
    area_text: area,
    created_at,
  });

  it("nothing observed and nothing expected is an empty list, never 'all clear'", () => {
    expect(coverageByArea([], 1000, [])).toEqual([]);
  });

  it("one second under the stale age is still limited", () => {
    const now = 100000;
    const [row] = coverageByArea(
      [report("Purok 1", now - COVERAGE_STALE_SECONDS + 1)],
      now,
      [],
    );
    expect(row.level).toBe("limited");
    expect(row.distinctDevices).toBe(1);
  });

  it("an expected area that does have reports is listed once, by its reports", () => {
    const rows = coverageByArea([report("Purok 1", 1000)], 1000, ["  purok 1 "]);
    expect(rows).toHaveLength(1);
    expect(rows[0].level).toBe("limited");
  });
});
