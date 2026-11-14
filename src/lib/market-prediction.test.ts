import { describe, expect, it } from "vitest";
import {
  computeDailyReturns,
  computeDiseaseNowcast,
  computeLeadLagCorrelogram,
  computeMarketNeutralAbnormalReturns,
  computeVolumeZScores,
  pearsonCorrelation,
} from "./market-prediction";

describe("market-prediction quantitative engine", () => {
  it("computes simple 1-day returns safely", () => {
    const returns = computeDailyReturns([100, 110, 99, 99]);
    expect(returns[0]).toBe(0);
    expect(returns[1]).toBeCloseTo(0.1, 6);
    expect(returns[2]).toBeCloseTo(-0.1, 6);
    expect(returns[3]).toBe(0);
  });

  it("strips market beta in market-neutral abnormal returns", () => {
    // Stock moves 1.5x SPY with zero idiosyncratic alpha until day 40 (+12% shock)
    const days = 45;
    const spy: number[] = [100];
    const xbi: number[] = [100];
    const ticker: number[] = [100];
    for (let i = 1; i < days; i++) {
      const mRet = (i % 5 === 0 ? 0.02 : -0.005) + (i % 3 === 0 ? 0.01 : 0);
      const bRet = mRet * 0.8 + (i % 2 === 0 ? 0.004 : -0.004);
      spy.push(spy[i - 1] * (1 + mRet));
      xbi.push(xbi[i - 1] * (1 + bRet));
      const shock = i === 42 ? 0.12 : 0;
      ticker.push(ticker[i - 1] * (1 + 1.5 * mRet + shock));
    }

    const { abnormalReturns, car7d } = computeMarketNeutralAbnormalReturns(ticker, spy, xbi, 30);
    // Quiet pre-shock days should have near-zero abnormal return
    expect(Math.abs(abnormalReturns[35])).toBeLessThan(0.01);
    // Shock day should retain ~12% idiosyncratic alpha
    expect(abnormalReturns[42]).toBeGreaterThan(0.1);
    expect(car7d[42]).toBeGreaterThan(0.1);
  });

  it("detects volume spikes via trailing Z-score without lookahead", () => {
    const volumes = [
      ...Array.from({ length: 35 }, (_, i) => 1_000_000 + (i % 3) * 50_000),
      2_800_000,
    ];
    const z = computeVolumeZScores(volumes, 30);
    expect(z[30]).toBeLessThan(2);
    expect(z[35]).toBeGreaterThan(5);
  });

  it("recovers negative lead lag when pharma signal precedes outbreak cases", () => {
    const n = 90;
    const market = Array.from(
      { length: n },
      (_, t) => Math.exp(-((t - 30) ** 2) / 20) + 0.5 * Math.exp(-((t - 65) ** 2) / 20),
    );
    // Cases mirror the market surge 10 days later (lag = -10)
    const cases = Array.from({ length: n }, (_, t) => (t >= 10 ? market[t - 10] * 12 : 0));

    const { optimalLeadDays, peakR, series } = computeLeadLagCorrelogram(market, cases, 21);
    expect(optimalLeadDays).toBe(-10);
    expect(peakR).toBeGreaterThan(0.95);
    const pointAtNeg10 = series.find((p) => p.lag === -10);
    expect(pointAtNeg10?.zone).toBe("market_leads");
  });

  it("computes composite nowcast risk and bounded 14-day forecast fan", () => {
    const n = 60;
    const dates = Array.from({ length: n }, (_, i) => {
      const d = new Date("2026-09-01T00:00:00Z");
      d.setUTCDate(d.getUTCDate() + i);
      return d.toISOString().slice(0, 10);
    });
    const dailyCases = Array.from({ length: n }, (_, i) => (i > 45 ? 4 : 1));
    const carSeries = Array.from({ length: n }, (_, i) => (i > 50 ? 0.08 : 0.005));
    const volZSeries = Array.from({ length: n }, (_, i) => (i > 50 ? 3.1 : 0.2));

    const result = computeDiseaseNowcast({
      dates,
      dailyCases,
      basketCar7dSeries: carSeries,
      basketVolZSeries: volZSeries,
      wikiAttentionZ: 2.6,
      climateSuitability: 84,
      horizonDays: 14,
    });

    expect(result.compositeOutbreakRisk).toBeGreaterThan(70);
    expect(["High", "Critical"]).toContain(result.riskTier);
    expect(result.trajectory).toHaveLength(n + 14);
    expect(result.forecastTotal14d).toBeGreaterThan(result.forecastTotal7d);

    const forecasts = result.trajectory.filter((pt) => pt.isForecast);
    expect(forecasts).toHaveLength(14);
    for (const pt of forecasts) {
      expect(pt.predicted).not.toBeNull();
      expect(pt.lower80!).toBeLessThanOrEqual(pt.predicted!);
      expect(pt.upper80!).toBeGreaterThanOrEqual(pt.predicted!);
    }

    expect(pearsonCorrelation([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 6);
  });
});
