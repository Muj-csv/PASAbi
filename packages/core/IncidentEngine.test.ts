import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { compute, safeCheckinCounts } from "./IncidentEngine";
import { CAPACITY_STATION } from "./rules";
import type { Category, Incident, Observation } from "./types";

const VECTOR_DIR = join(dirname(fileURLToPath(import.meta.url)), "test-vectors");

interface ExpectedIncident {
  key: string;
  category: Category;
  observationIds: string[];
  independentReporters: number;
  corroboration: string;
  peopleAffected: number;
  firstSeen: number;
  lastSeen: number;
  centroid?: { lat: number; lon: number };
  areaText?: string;
  spatialExtentM: number;
  status: string;
  score: number;
  breakdown: Record<string, number>;
}

interface Vector {
  name: string;
  why?: string;
  now: number;
  observations: Observation[];
  expected_incidents: ExpectedIncident[];
  expected_safe_counts?: Record<string, number>;
}

function loadVectors(): { file: string; vector: Vector }[] {
  return readdirSync(VECTOR_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((file) => ({
      file,
      vector: JSON.parse(readFileSync(join(VECTOR_DIR, file), "utf8")) as Vector,
    }));
}

/**
 * Everything the RULES decide is compared exactly. Only the two derived
 * distances use a tolerance, because they are doubles: the vectors keep them
 * far from any threshold, so this is about float representation and never
 * about a grouping decision being fuzzy.
 */
function expectIncidentMatches(
  actual: Incident,
  expected: ExpectedIncident,
  where: string,
): void {
  expect(actual.key, where + " key").toBe(expected.key);
  expect(actual.category, where + " category").toBe(expected.category);
  expect(actual.observationIds, where + " observationIds").toEqual(
    expected.observationIds,
  );
  expect(actual.independentReporters, where + " reporters").toBe(
    expected.independentReporters,
  );
  expect(actual.corroboration, where + " corroboration").toBe(
    expected.corroboration,
  );
  expect(actual.peopleAffected, where + " peopleAffected").toBe(
    expected.peopleAffected,
  );
  expect(actual.firstSeen, where + " firstSeen").toBe(expected.firstSeen);
  expect(actual.lastSeen, where + " lastSeen").toBe(expected.lastSeen);
  expect(actual.status, where + " status").toBe(expected.status);
  expect(actual.score, where + " score").toBe(expected.score);
  expect(actual.breakdown, where + " breakdown").toEqual(expected.breakdown);

  if (expected.areaText !== undefined) {
    expect(actual.areaText, where + " areaText").toBe(expected.areaText);
  }

  expect(
    Math.abs(actual.spatialExtentM - expected.spatialExtentM),
    where + " spatialExtentM was " + actual.spatialExtentM,
  ).toBeLessThanOrEqual(2);

  if (expected.centroid) {
    expect(actual.centroid, where + " centroid").toBeDefined();
    const centroid = actual.centroid as { lat: number; lon: number };
    expect(
      Math.abs(centroid.lat - expected.centroid.lat),
      where + " centroid lat",
    ).toBeLessThan(1e-5);
    expect(
      Math.abs(centroid.lon - expected.centroid.lon),
      where + " centroid lon",
    ).toBeLessThan(1e-5);
  } else {
    expect(actual.centroid, where + " centroid should be absent").toBeUndefined();
  }
}

/** Seeded PRNG so a shuffle failure reproduces exactly. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], rand: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const swap = copy[i];
    copy[i] = copy[j];
    copy[j] = swap;
  }
  return copy;
}

const vectors = loadVectors();

describe("incident engine test vectors", () => {
  it("finds the vector files", () => {
    expect(vectors.length).toBeGreaterThanOrEqual(9);
  });

  for (const { file, vector } of vectors) {
    it(file + " : " + vector.name, () => {
      const incidents = compute(vector.observations, vector.now);

      expect(
        incidents.map((i) => i.key),
        "incident count and order",
      ).toEqual(vector.expected_incidents.map((i) => i.key));

      for (let i = 0; i < vector.expected_incidents.length; i++) {
        expectIncidentMatches(
          incidents[i],
          vector.expected_incidents[i],
          file + " incident[" + i + "]",
        );
      }

      if (vector.expected_safe_counts) {
        expect(safeCheckinCounts(vector.observations)).toEqual(
          vector.expected_safe_counts,
        );
      }
    });
  }
});

describe("NFR-002 determinism", () => {
  it("gives identical output for 100 random input orderings of every vector", () => {
    for (const { file, vector } of vectors) {
      const reference = JSON.stringify(compute(vector.observations, vector.now));
      const rand = mulberry32(0x5eed);
      for (let run = 0; run < 100; run++) {
        const scrambled = shuffled(vector.observations, rand);
        const actual = JSON.stringify(compute(scrambled, vector.now));
        expect(actual, file + " differed on shuffle run " + run).toBe(reference);
      }
    }
  });

  it("scores with integers only, so no runtime can round differently", () => {
    for (const { file, vector } of vectors) {
      for (const incident of compute(vector.observations, vector.now)) {
        const terms = { ...incident.breakdown, score: incident.score };
        for (const [term, value] of Object.entries(terms)) {
          expect(
            Number.isInteger(value),
            file + " " + term + " = " + value,
          ).toBe(true);
        }
      }
    }
  });
});

/** A barangay-sized set: one station capacity, spread over the 72 h TTL. */
function syntheticObservations(count: number, now: number): Observation[] {
  const rand = mulberry32(20260925);
  const categories: Category[] = [
    "MEDICAL",
    "TRAPPED",
    "STRUCTURAL",
    "FLOOD",
    "ROAD_BLOCKED",
    "MISSING_PERSON",
    "WATER_FOOD",
    "SHELTER",
  ];
  const observations: Observation[] = [];
  for (let i = 0; i < count; i++) {
    observations.push({
      id: "00000000-0000-4000-8000-" + String(i).padStart(12, "0"),
      type: "REPORT",
      category: categories[Math.floor(rand() * categories.length)],
      device_id: "dev-" + Math.floor(rand() * 40),
      // Roughly a 2 km square, a plausible barangay footprint.
      lat: 14.5995 + (rand() - 0.5) * 0.018,
      lon: 120.9842 + (rand() - 0.5) * 0.018,
      created_at: now - Math.floor(rand() * 72 * 3600),
      people: Math.floor(rand() * 8),
    });
  }
  return observations;
}

describe("NFR-003 performance", () => {
  it("computes a full station store within the 300 ms budget", () => {
    const now = 1759000000;
    const observations = syntheticObservations(CAPACITY_STATION, now);

    compute(observations, now); // warm up, so JIT cost is not read as rule cost

    const started = performance.now();
    const incidents = compute(observations, now);
    const elapsed = performance.now() - started;

    expect(incidents.length).toBeGreaterThan(0);
    console.log(
      "NFR-003: " +
        CAPACITY_STATION +
        " observations -> " +
        incidents.length +
        " incidents in " +
        elapsed.toFixed(1) +
        " ms",
    );
    // Measured on a laptop, not the mid-range phone NFR-003 actually targets,
    // so treat a pass here as necessary rather than sufficient.
    expect(elapsed, "compute took " + elapsed.toFixed(1) + " ms").toBeLessThan(
      300,
    );
  });
});
