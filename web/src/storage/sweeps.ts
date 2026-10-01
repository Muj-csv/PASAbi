// Purok Sweep records (spec §4.6, D-036): kept on the station, never synced.
// What a sweep FINDS is synced, as ordinary REPORT or CHECK observations.

import { SAFE_CHECKIN, type Category, type GapReason } from "@pasabi/core";

import { uuid4 } from "./device";
import { kvGet, kvSet, live } from "./kv";
import { addObservation, nowSeconds } from "./observations";

export type SweepAnswer = "seen" | "not_seen" | "couldnt";

export interface Sweep {
  sweepId: string;
  targetArea: string;
  createdAt: number;
  startedAt: number;
  completedAt: number | null;
  assignedOperator: string | null;
  requestedCategories: Category[];
  answers: Partial<Record<Category, SweepAnswer>>;
  /** IDs of the observations this sweep produced. */
  observationsCollected: string[];
  /** Filled in on completion: the area's gap reasons after the sweep. */
  coverageStatus: GapReason[] | null;
  /** Filled in on completion: categories nobody could check. */
  remainingUnknowns: Category[] | null;
}

const KEY = "sweeps.v1";
export const sweeps = live<Sweep[]>([]);

export async function restoreSweeps(): Promise<void> {
  const stored = await kvGet<Sweep[]>(KEY);
  sweeps.set(Array.isArray(stored) ? stored : []);
}

async function save(next: Sweep[]): Promise<void> {
  sweeps.set(next);
  await kvSet(KEY, next);
}

function update(id: string, fn: (s: Sweep) => Sweep): Promise<void> {
  return save(sweeps.get().map((s) => (s.sweepId === id ? fn(s) : s)));
}

export async function startSweep(targetArea: string, categories: readonly Category[], operator: string | null): Promise<string> {
  const now = nowSeconds();
  const sweep: Sweep = {
    sweepId: uuid4(),
    targetArea,
    createdAt: now,
    startedAt: now,
    completedAt: null,
    assignedOperator: operator,
    requestedCategories: [...categories],
    answers: {},
    observationsCollected: [],
    coverageStatus: null,
    remainingUnknowns: null,
  };
  await save([...sweeps.get(), sweep]);
  return sweep.sweepId;
}

export function recordAnswer(id: string, category: Category, answer: SweepAnswer, observationId?: string): Promise<void> {
  return update(id, (s) => ({
    ...s,
    answers: { ...s.answers, [category]: answer },
    observationsCollected: observationId ? [...s.observationsCollected, observationId] : s.observationsCollected,
  }));
}

/**
 * "Checked, not seen" (D-037): an immutable CHECK observation, synced like
 * any other. Only for categories where absence is a finding; a missing
 * safe check-in is not recorded (it stays a gap).
 */
export async function recordNotSeen(id: string, category: Category, area: string, deviceId: string): Promise<void> {
  if (category === SAFE_CHECKIN) return recordAnswer(id, category, "couldnt");
  const now = nowSeconds();
  const obsId = uuid4();
  await addObservation({
    id: obsId,
    type: "CHECK",
    category,
    area_text: area,
    device_id: deviceId,
    created_at: now,
    received_at: now,
    hops: 0,
    own: true,
    uploaded: false,
  });
  await recordAnswer(id, category, "not_seen", obsId);
}

export function completeSweep(id: string, coverageStatus: GapReason[]): Promise<void> {
  return update(id, (s) => ({
    ...s,
    completedAt: nowSeconds(),
    coverageStatus,
    remainingUnknowns: s.requestedCategories.filter((c) => s.answers[c] === undefined || s.answers[c] === "couldnt"),
  }));
}
