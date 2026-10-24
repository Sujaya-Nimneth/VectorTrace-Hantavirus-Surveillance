import { describe, expect, it } from "vitest";
import { buildEpidemicCurveBuckets, DAY_MS } from "./epi-curve";

const REGIONS = ["Pampa", "Cuyo"];
const now = new Date("2026-10-24T12:00:00Z");

const caseAt = (ageDays: number, region: string) => ({
  date: new Date(+now - ageDays * DAY_MS).toISOString(),
  region,
});

describe("buildEpidemicCurveBuckets", () => {
  it("regression: every in-window case lands in a bucket at 90d (step 3)", () => {
    const cases = Array.from({ length: 90 }, (_, age) => caseAt(age, "Pampa"));
    const buckets = buildEpidemicCurveBuckets(cases, 90, REGIONS, now);
    const total = buckets.reduce((sum, row) => sum + Number(row.Pampa || 0), 0);
    expect(total).toBe(90);
  });

  it("regression: every in-window case lands in a bucket at 7d and 30d (step 1)", () => {
    for (const days of [7, 30] as const) {
      const cases = Array.from({ length: days }, (_, age) => caseAt(age, "Cuyo"));
      const buckets = buildEpidemicCurveBuckets(cases, days, REGIONS, now);
      const total = buckets.reduce((sum, row) => sum + Number(row.Cuyo || 0), 0);
      expect(total, `days=${days}`).toBe(days);
    }
  });

  it("drops cases outside the window and future-dated cases", () => {
    const cases = [caseAt(200, "Pampa"), caseAt(-3, "Pampa"), caseAt(10, "Pampa")];
    const buckets = buildEpidemicCurveBuckets(cases, 30, REGIONS, now);
    const total = buckets.reduce((sum, row) => sum + Number(row.Pampa || 0), 0);
    expect(total).toBe(1);
  });

  it("produces the expected bucket count and zero-filled region columns", () => {
    const buckets = buildEpidemicCurveBuckets([], 90, REGIONS, now);
    expect(buckets).toHaveLength(Math.ceil(90 / 3));
    for (const row of buckets) {
      expect(row.Pampa).toBe(0);
      expect(row.Cuyo).toBe(0);
      expect(row.trend).toBe(0);
    }
  });
});
