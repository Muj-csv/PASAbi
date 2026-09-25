import { describe, expect, it } from "vitest";

import {
  CAPACITY_RESIDENT,
  RATE_LIMIT_PER_HOUR,
  TTL_SAFE_CHECKIN_SECONDS,
  TTL_SECONDS,
} from "./rules";
import {
  applyPolicy,
  canCreate,
  evict,
  expire,
  isExpired,
  normalizeId,
  normalizeObservation,
  statusCreatedAt,
} from "./StorePolicy";
import type { Observation } from "./types";

const NOW = 1759000000;

let seq = 0;
function nextId(): string {
  seq += 1;
  return "00000000-0000-4000-8000-" + String(seq).padStart(12, "0");
}

function obs(over: Partial<Observation> = {}): Observation {
  return {
    id: nextId(),
    type: "REPORT",
    category: "FLOOD",
    device_id: "dev-a",
    lat: 14.5995,
    lon: 120.9842,
    created_at: NOW - 600,
    ...over,
  };
}

describe("BR-002 / R-8 normalization", () => {
  it("lowercases the ID and every ref on ingest", () => {
    expect(normalizeId("  00000000-0000-4000-8000-00000000000A  ")).toBe(
      "00000000-0000-4000-8000-00000000000a",
    );
    const normalized = normalizeObservation(
      obs({
        id: "00000000-0000-4000-8000-00000000000B",
        type: "STATUS",
        action: "ACK",
        refs: ["00000000-0000-4000-8000-00000000000C"],
      }),
    );
    expect(normalized.id).toBe("00000000-0000-4000-8000-00000000000b");
    expect(normalized.refs).toEqual(["00000000-0000-4000-8000-00000000000c"]);
  });
});

describe("BR-009 expiry", () => {
  it("expires reports after 72 h and check-ins after 24 h", () => {
    const report = obs({ created_at: NOW - TTL_SECONDS });
    const freshReport = obs({ created_at: NOW - TTL_SECONDS + 1 });
    const checkin = obs({
      category: "SAFE_CHECKIN",
      area_text: "Purok 3",
      created_at: NOW - TTL_SAFE_CHECKIN_SECONDS,
    });
    const freshCheckin = obs({
      category: "SAFE_CHECKIN",
      area_text: "Purok 3",
      created_at: NOW - TTL_SAFE_CHECKIN_SECONDS + 1,
    });

    expect(isExpired(report, NOW)).toBe(true);
    expect(isExpired(freshReport, NOW)).toBe(false);
    expect(isExpired(checkin, NOW)).toBe(true);
    expect(isExpired(freshCheckin, NOW)).toBe(false);

    const kept = expire([report, freshReport, checkin, freshCheckin], NOW);
    expect(kept.map((o) => o.id).sort()).toEqual(
      [freshReport.id, freshCheckin.id].sort(),
    );
  });
});

describe("BR-010 rate limit", () => {
  it("allows six observations an hour and then stops", () => {
    const mine: Observation[] = [];
    for (let i = 0; i < RATE_LIMIT_PER_HOUR; i++) {
      expect(canCreate(mine, "dev-a", NOW)).toBe(true);
      mine.push(obs({ device_id: "dev-a", created_at: NOW - 60 * i }));
    }
    expect(canCreate(mine, "dev-a", NOW)).toBe(false);
    // Another device is unaffected, and so is this one an hour later.
    expect(canCreate(mine, "dev-b", NOW)).toBe(true);
    expect(canCreate(mine, "dev-a", NOW + 3601)).toBe(true);
  });
});

describe("BR-007 / R-6 status timestamp clamp", () => {
  it("never lets a status look older than what it answers", () => {
    const report = obs({ created_at: NOW - 3600 });
    // Station clock is an hour and a half behind the report it answers.
    const skewed = statusCreatedAt(NOW - 9000, [report]);
    expect(skewed).toBe(report.created_at + 1);
    expect(skewed).toBeGreaterThan(report.created_at);
  });

  it("leaves a correct clock alone and tolerates no references", () => {
    const report = obs({ created_at: NOW - 3600 });
    expect(statusCreatedAt(NOW, [report])).toBe(NOW);
    expect(statusCreatedAt(NOW, [])).toBe(NOW);
  });
});

describe("BR-008 eviction", () => {
  it("evicts SAFE_CHECKIN before anything else", () => {
    const checkin = obs({
      category: "SAFE_CHECKIN",
      area_text: "Purok 3",
      created_at: NOW - 100,
    });
    const medical = obs({ category: "MEDICAL", created_at: NOW - 9000 });
    const kept = evict([checkin, medical], 1, NOW);
    expect(kept.map((o) => o.id)).toEqual([medical.id]);
  });

  it("keeps the earliest and latest observation of the incident it thins", () => {
    // One SHELTER incident of four observations at the same spot. SHELTER has
    // the lowest base score, so this is the incident eviction reaches first.
    const a = obs({
      category: "SHELTER",
      created_at: NOW - 4000,
      device_id: "dev-a",
    });
    const b = obs({
      category: "SHELTER",
      created_at: NOW - 3000,
      device_id: "dev-b",
    });
    const c = obs({
      category: "SHELTER",
      created_at: NOW - 2000,
      device_id: "dev-c",
    });
    const d = obs({
      category: "SHELTER",
      created_at: NOW - 1000,
      device_id: "dev-d",
    });
    const medical = obs({
      category: "MEDICAL",
      lat: 14.65,
      created_at: NOW - 500,
    });

    const kept = evict([a, b, c, d, medical], 3, NOW);
    const keptIds = kept.map((o) => o.id);

    expect(keptIds).toContain(a.id); // earliest of the thinned incident
    expect(keptIds).toContain(d.id); // latest of the thinned incident
    expect(keptIds).toContain(medical.id); // more urgent, untouched
    expect(keptIds).not.toContain(b.id);
    expect(keptIds).not.toContain(c.id);
  });

  it("does not evict own un-uploaded observations while anything else remains", () => {
    const mineUnsent = obs({
      own: true,
      uploaded: false,
      created_at: NOW - 9000,
      category: "SHELTER",
    });
    const carried = obs({
      own: false,
      created_at: NOW - 100,
      category: "SHELTER",
      lat: 14.65,
    });
    const kept = evict([mineUnsent, carried], 1, NOW);
    expect(kept.map((o) => o.id)).toEqual([mineUnsent.id]);
  });

  it("evicts an already uploaded own observation like any other", () => {
    const mineSent = obs({
      own: true,
      uploaded: true,
      created_at: NOW - 9000,
      category: "SHELTER",
    });
    const carried = obs({
      own: false,
      created_at: NOW - 100,
      category: "MEDICAL",
      lat: 14.65,
    });
    const kept = evict([mineSent, carried], 1, NOW);
    expect(kept.map((o) => o.id)).toEqual([carried.id]);
  });

  it("R-5: falls back to evicting own un-uploaded rather than staying over capacity", () => {
    // The pathological case BR-008 used to deadlock on: every observation is
    // this device's own and none of them has been uploaded.
    const mine = [0, 1, 2, 3].map((i) =>
      obs({ own: true, uploaded: false, created_at: NOW - 9000 + i * 100 }),
    );
    const kept = evict(mine, 2, NOW);

    expect(kept).toHaveLength(2);
    // Oldest first, so the two newest survive.
    expect(kept.map((o) => o.id).sort()).toEqual(
      [mine[2].id, mine[3].id].sort(),
    );
  });

  it("leaves a store that is already within capacity untouched", () => {
    const all = [obs(), obs(), obs()];
    expect(evict(all, CAPACITY_RESIDENT, NOW)).toHaveLength(3);
  });
});

describe("applyPolicy", () => {
  it("normalizes, expires and evicts in one pass", () => {
    const stale = obs({ created_at: NOW - TTL_SECONDS - 1 });
    const upper = obs({
      id: "00000000-0000-4000-8000-0000000000FF",
      created_at: NOW - 100,
    });
    const extra = [0, 1, 2].map((i) =>
      obs({ created_at: NOW - 200 - i, category: "SHELTER" }),
    );

    const kept = applyPolicy([stale, upper, ...extra], 2, NOW);

    expect(kept).toHaveLength(2);
    expect(kept.map((o) => o.id)).not.toContain(stale.id);
    for (const o of kept) expect(o.id).toBe(o.id.toLowerCase());
  });
});
