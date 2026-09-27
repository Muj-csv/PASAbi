import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { gapsFor, type Gaps } from "./Gaps";
import { compute } from "./IncidentEngine";
import type { Observation } from "./types";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "evidence-vectors");

interface Fixture {
  name: string;
  now: number;
  observations: Observation[];
  expected: { key: string; gaps?: Gaps }[];
}

const fixtures = readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((file) => ({
    file,
    data: JSON.parse(readFileSync(join(DIR, file), "utf8")) as Fixture,
  }))
  .filter(({ data }) => data.expected.some((e) => e.gaps !== undefined));

describe("gap vectors (hand-written from BR-013)", () => {
  it("finds the gap fixtures", () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(2);
  });

  for (const { file, data } of fixtures) {
    it(file + " : " + data.name, () => {
      const incidents = compute(data.observations, data.now);
      for (const { key, gaps } of data.expected) {
        if (gaps === undefined) continue;
        const incident = incidents.find((i) => i.key === key);
        expect(incident, file + " has incident " + key).toBeDefined();
        if (!incident) continue;
        expect(gapsFor(incident, incidents, data.observations)).toEqual(gaps);
      }
    });

    it(file + " : independent of input order", () => {
      const reversed = [...data.observations].reverse();
      const a = compute(data.observations, data.now);
      const b = compute(reversed, data.now);
      for (let i = 0; i < a.length; i++) {
        expect(gapsFor(b[i], b, reversed)).toEqual(
          gapsFor(a[i], a, data.observations),
        );
      }
    });
  }
});
