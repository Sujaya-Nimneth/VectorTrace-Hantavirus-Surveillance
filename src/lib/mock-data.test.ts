import { describe, expect, it } from "vitest";
import { CASES } from "./mock-cases";
import { RODENTS } from "./mock-rodents";
import { ALERTS } from "./mock-alerts";
import { REGIONS } from "./mock-data";

describe("mock cases (demo dataset)", () => {
  it("has unique ids", () => {
    const ids = new Set(CASES.map((c) => c.id));
    expect(ids.size).toBe(CASES.length);
  });

  it("only uses known regions, syndromes, and statuses", () => {
    const regions = new Set(REGIONS.map((r) => r.name));
    for (const c of CASES) {
      expect(regions.has(c.region)).toBe(true);
      expect(["HPS", "HFRS"]).toContain(c.syndrome);
      expect(["Confirmed", "Suspected", "Pending"]).toContain(c.status);
      expect(["M", "F"]).toContain(c.sex);
      expect(Array.isArray(c.symptoms)).toBe(true);
    }
  });

  it("carries parseable dates", () => {
    for (const c of CASES) {
      expect(Number.isNaN(new Date(c.date).getTime())).toBe(false);
    }
  });
});

describe("mock rodent sites (demo dataset)", () => {
  it("has unique ids and positivity within 0–100", () => {
    const ids = new Set(RODENTS.map((r) => r.id));
    expect(ids.size).toBe(RODENTS.length);
    for (const r of RODENTS) {
      expect(r.positivity).toBeGreaterThanOrEqual(0);
      expect(r.positivity).toBeLessThanOrEqual(100);
    }
  });
});

describe("mock alerts (demo dataset)", () => {
  it("stores ISO timestamps so relative labels stay live", () => {
    for (const a of ALERTS) {
      expect(Number.isNaN(new Date(a.createdAt).getTime())).toBe(false);
    }
  });
});
