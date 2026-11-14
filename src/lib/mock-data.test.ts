import { describe, expect, it } from "vitest";
import { CASES } from "./mock-cases";
import { RODENTS } from "./mock-rodents";
import { ALERTS } from "./mock-alerts";
import { MOCK_MARKET_BARS } from "./mock-market";
import { REGIONS } from "./mock-data";
import { DISEASE_BY_SLUG, DISEASE_SLUGS, PHARMA_TICKERS } from "./diseases";

describe("mock cases (multi-disease demo dataset)", () => {
  it("has unique ids and covers all 6 surveillance diseases", () => {
    const ids = new Set(CASES.map((c) => c.id));
    expect(ids.size).toBe(CASES.length);

    const seenDiseases = new Set(CASES.map((c) => c.diseaseSlug));
    for (const slug of DISEASE_SLUGS) {
      expect(seenDiseases.has(slug)).toBe(true);
    }
  });

  it("only uses known regions, disease-matched syndromes, and statuses", () => {
    const regions = new Set(REGIONS.map((r) => r.name));
    for (const c of CASES) {
      expect(regions.has(c.region)).toBe(true);
      const profile = DISEASE_BY_SLUG[c.diseaseSlug ?? "hantavirus"];
      expect(profile.syndromes.map((s) => s.code)).toContain(c.syndrome);
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

describe("mock sentinel sites (demo dataset)", () => {
  it("has unique ids, valid sentinel types, and positivity within 0–100", () => {
    const ids = new Set(RODENTS.map((r) => r.id));
    expect(ids.size).toBe(RODENTS.length);
    for (const r of RODENTS) {
      expect(r.positivity).toBeGreaterThanOrEqual(0);
      expect(r.positivity).toBeLessThanOrEqual(100);
      expect(["rodent_trap", "mosquito_ovitrap", "avian_sentinel", "wastewater_node"]).toContain(
        r.sentinelType,
      );
    }
  });
});

describe("mock alerts (demo dataset)", () => {
  it("stores ISO timestamps and valid signal sources", () => {
    for (const a of ALERTS) {
      expect(Number.isNaN(new Date(a.createdAt).getTime())).toBe(false);
      expect(["clinical", "who_don", "market_divergence", "composite_nowcast"]).toContain(
        a.signalSource,
      );
    }
  });
});

describe("mock market bars (demo dataset)", () => {
  it("contains 90 days of valid bars for every mapped ticker and benchmark", () => {
    const tickers = new Set(MOCK_MARKET_BARS.map((b) => b.ticker));
    for (const meta of PHARMA_TICKERS) {
      expect(tickers.has(meta.ticker)).toBe(true);
    }
    for (const b of MOCK_MARKET_BARS) {
      expect(b.closePrice).toBeGreaterThan(0);
      expect(b.volume).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(b.abnormalReturn1d)).toBe(true);
      expect(Number.isFinite(b.car7d)).toBe(true);
      expect(Number.isFinite(b.volumeZScore)).toBe(true);
    }
  });
});
