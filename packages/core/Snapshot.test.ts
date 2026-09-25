import { describe, expect, it } from "vitest";

import { compute } from "./IncidentEngine";
import { changesSince, snapshotOf } from "./Snapshot";
import { canCreate, statusCreatedAt } from "./StorePolicy";
import type { Observation } from "./types";

const NOW = 1759000000;

function uuid(n: number): string {
  return "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
}

function report(n: number, over: Partial<Observation> = {}): Observation {
  return {
    id: uuid(n),
    type: "REPORT",
    category: "FLOOD",
    device_id: "dev-" + String(n),
    lat: 14.5995,
    lon: 120.9842,
    created_at: NOW - 600,
    ...over,
  };
}

function status(
  n: number,
  action: "ACK" | "RESOLVE",
  refs: string[],
  createdAt: number,
): Observation {
  return {
    id: uuid(n),
    type: "STATUS",
    action,
    refs,
    device_id: "dev-station",
    created_at: createdAt,
  };
}

describe("FR-007 what changed", () => {
  it("reports nothing before a baseline exists", () => {
    const current = compute([report(1)], NOW);
    expect(changesSince(null, current).size).toBe(0);
  });

  it("flags an incident that did not exist before as new", () => {
    const before = snapshotOf(compute([report(1)], NOW), NOW);
    const current = compute([report(1), report(2, { lat: 14.9 })], NOW);

    const changes = changesSince(before, current);
    const newOnes = [...changes.entries()].filter(([, c]) => c.includes("new"));

    expect(newOnes).toHaveLength(1);
    expect(newOnes[0][0]).toBe(uuid(2));
  });

  it("flags escalation and new corroboration when a second device reports", () => {
    const first = [report(1)];
    const before = snapshotOf(compute(first, NOW), NOW);

    // Same spot, same category, a different device: one incident with two
    // reporters, so the score rises by the corroboration bonus.
    const current = compute([...first, report(2, { lat: 14.59995 })], NOW);
    const changes = changesSince(before, current);

    expect(changes.get(uuid(1))).toEqual(["escalated", "newly_corroborated"]);
  });

  it("flags a resolve", () => {
    const reports = [report(1)];
    const before = snapshotOf(compute(reports, NOW), NOW);

    const resolved = compute(
      [...reports, status(9, "RESOLVE", [uuid(1)], NOW - 300)],
      NOW,
    );
    expect(changesSince(before, resolved).get(uuid(1))).toEqual(["resolved"]);
  });

  it("stays quiet when nothing changed", () => {
    const reports = [report(1), report(2, { lat: 14.9 })];
    const before = snapshotOf(compute(reports, NOW), NOW);
    expect(changesSince(before, compute(reports, NOW)).size).toBe(0);
  });

  it("matches on observation IDs, so losing the key observation is not a new incident", () => {
    // The key is the smallest ID in the group. Evict that one observation and
    // the incident is renamed, though nothing about the situation changed.
    const a = report(1);
    const b = report(2, { lat: 14.59995 });
    const before = snapshotOf(compute([a, b], NOW), NOW);
    expect(before.incidents[0].key).toBe(uuid(1));

    const afterEviction = compute([b], NOW);
    expect(afterEviction[0].key).toBe(uuid(2));

    // The key changed but membership still overlaps, so this is NOT new.
    const changes = changesSince(before, afterEviction);
    expect(changes.get(uuid(2)) ?? []).not.toContain("new");
  });
});

describe("D-017 rate limit counts reports only", () => {
  it("does not let status actions lock a station operator out", () => {
    // Six reports from this device exhausts BR-010.
    const mine: Observation[] = [];
    for (let i = 0; i < 6; i++) {
      mine.push(report(100 + i, { device_id: "dev-station" }));
    }
    expect(canCreate(mine, "dev-station", NOW)).toBe(false);

    // Twenty acknowledgements must not make that worse, and once the reports
    // age out the operator can work the board again.
    const withStatuses = [...mine];
    for (let i = 0; i < 20; i++) {
      withStatuses.push(status(200 + i, "ACK", [uuid(100)], NOW - 60));
    }
    expect(canCreate(withStatuses, "dev-station", NOW + 3601)).toBe(true);
  });
});

describe("FR-008 status actions from the board", () => {
  it("clamps a skewed station clock so the resolve still applies (R-6)", () => {
    const incidentReports = [report(1, { created_at: NOW - 3600 })];

    // Station clock is well behind the report it is answering.
    const createdAt = statusCreatedAt(NOW - 9000, incidentReports);
    const resolved = compute(
      [...incidentReports, status(9, "RESOLVE", [uuid(1)], createdAt)],
      NOW,
    );

    expect(resolved[0].status).toBe("resolved");
    expect(resolved[0].score).toBe(0);
  });
});
