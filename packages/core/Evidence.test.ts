import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { evidenceOf, freshnessOf, type Evidence } from "./Evidence";
import { compute } from "./IncidentEngine";
import type { Observation } from "./types";

const HERE = dirname(fileURLToPath(import.meta.url));

interface Fixture {
  name: string;
  now: number;
  observations: Observation[];
  /** Each entry checks evidence, gaps (Gaps.test.ts), or both. */
  expected: { key: string; evidence?: Evidence }[];
}

function load<T>(dir: string): { file: string; data: T }[] {
  return readdirSync(join(HERE, dir))
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((file) => ({
      file,
      data: JSON.parse(readFileSync(join(HERE, dir, file), "utf8")) as T,
    }));
}

const fixtures = load<Fixture>("evidence-vectors");

describe("evidence vectors (hand-written from BR-011 and BR-012)", () => {
  it("finds the fixture files", () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(3);
  });

  for (const { file, data } of fixtures) {
    it(file + " : " + data.name, () => {
      const incidents = compute(data.observations, data.now);
      for (const { key, evidence } of data.expected) {
        if (evidence === undefined) continue;
        const incident = incidents.find((i) => i.key === key);
        expect(incident, file + " has incident " + key).toBeDefined();
        if (!incident) continue;
        expect(evidenceOf(incident, data.observations, data.now)).toEqual(
          evidence,
        );
      }
    });

    it(file + " : independent of input order", () => {
      const reversed = [...data.observations].reverse();
      const a = compute(data.observations, data.now);
      const b = compute(reversed, data.now);
      for (let i = 0; i < a.length; i++) {
        expect(evidenceOf(b[i], reversed, data.now)).toEqual(
          evidenceOf(a[i], data.observations, data.now),
        );
      }
    });
  }
});

describe("freshness (BR-011)", () => {
  it("never reports a negative age when a clock is behind", () => {
    const o: Observation = {
      id: "00000000-0000-4000-8000-000000000001",
      type: "REPORT",
      category: "FLOOD",
      device_id: "dev-a",
      area_text: "Purok 4",
      created_at: 2000,
    };
    const [incident] = compute([o], 1000);
    const evidence = evidenceOf(incident, [o], 1000);
    expect(evidence.latestAgeSeconds).toBe(0);
    expect(evidence.freshness).toBe("fresh");
  });

  it("matches ARGUS's count over the 11 engine vectors: 10 fresh, 2 aging, 2 stale", () => {
    const counts = { fresh: 0, aging: 0, stale: 0 };
    let vector06 = "";
    for (const { file, data } of load<{ now: number; observations: Observation[] }>(
      "test-vectors",
    )) {
      for (const incident of compute(data.observations, data.now)) {
        const f = freshnessOf(data.now - incident.lastSeen);
        counts[f] += 1;
        if (file.startsWith("06-")) vector06 = f;
      }
    }
    expect(counts).toEqual({ fresh: 10, aging: 2, stale: 2 });
    // Vector 06 sits exactly on the one-hour boundary, which is aging.
    expect(vector06).toBe("aging");
  });
});
