import { describe, expect, it } from "vitest";

import {
  CAPACITY_RESIDENT,
  CATEGORIES,
  CATEGORY_BASE,
  MAX_OWN_OBSERVATIONS,
  PEOPLE_BONUS,
  PEOPLE_BONUS_MAX_INDEX,
} from "./rules";

describe("rules", () => {
  it("gives every category a base score", () => {
    for (const category of CATEGORIES) {
      expect(CATEGORY_BASE[category], category).toBeTypeOf("number");
    }
  });

  it("R-3: the people bonus table is integer, non-decreasing and caps at 20", () => {
    expect(PEOPLE_BONUS).toHaveLength(16);
    for (let i = 0; i < PEOPLE_BONUS.length; i++) {
      expect(Number.isInteger(PEOPLE_BONUS[i]), "index " + i).toBe(true);
      if (i > 0) expect(PEOPLE_BONUS[i]).toBeGreaterThanOrEqual(PEOPLE_BONUS[i - 1]);
    }
    expect(PEOPLE_BONUS[PEOPLE_BONUS_MAX_INDEX]).toBe(20);
    expect(Math.max(...PEOPLE_BONUS)).toBe(20);
  });

  it("R-5: resident capacity exceeds the most own observations a device can hold", () => {
    // BR-009 and BR-010 bound own observations at 432. If this ever fails,
    // the store can deadlock on data it is not allowed to evict.
    expect(MAX_OWN_OBSERVATIONS).toBe(432);
    expect(CAPACITY_RESIDENT).toBeGreaterThan(MAX_OWN_OBSERVATIONS);
  });
});
