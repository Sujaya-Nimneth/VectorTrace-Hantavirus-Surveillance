export type LeadLagPoint = {
  lag: number;
  r: number;
  tStat: number;
  zone: "market_leads" | "concurrent" | "cases_lead";
};

export type NowcastTrajectoryPoint = {
  date: string;
  actual: number | null;
  predicted: number | null;
  lower80: number | null;
  upper80: number | null;
  pharmaSignal: number | null;
  isForecast: boolean;
};

export type SignalAttribution = {
  pharmaAlphaScore: number;
  volumeAnomalyScore: number;
  wikiAttentionScore: number;
  climateSuitabilityScore: number;
  weights: {
    pharmaAlpha: number;
    volumeAnomaly: number;
    wikiAttention: number;
    climateSuitability: number;
  };
};

export type DiseaseNowcastResult = {
  compositeOutbreakRisk: number;
  riskTier: "Critical" | "High" | "Moderate" | "Low";
  latestPharmaZScore: number;
  latestCar7d: number;
  latestVolZScore: number;
  optimalLeadDays: number;
  peakR: number;
  forecastTotal7d: number;
  forecastTotal14d: number;
  attribution: SignalAttribution;
  correlogram: LeadLagPoint[];
  trajectory: NowcastTrajectoryPoint[];
};

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

/**
 * Computes simple 1-day percentage returns R_t = (P_t - P_{t-1}) / P_{t-1}.
 */
export function computeDailyReturns(closes: number[]): number[] {
  if (closes.length === 0) return [];
  const out = new Array<number>(closes.length).fill(0);
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1];
    const curr = closes[i];
    out[i] = prev > 0 && curr > 0 ? (curr - prev) / prev : 0;
  }
  return out;
}

/**
 * Fits 2-factor OLS regression y = alpha + beta1*x1 + beta2*x2 via 3x3 normal
 * equations with tiny ridge regularization for numerical stability.
 */
export function solveLinearRegression2Factor(
  y: number[],
  x1: number[],
  x2: number[],
): { alpha: number; beta1: number; beta2: number } {
  const n = Math.min(y.length, x1.length, x2.length);
  if (n < 5) return { alpha: 0, beta1: 1, beta2: 0 };

  let s1 = 0;
  let s2 = 0;
  let s11 = 0;
  let s12 = 0;
  let s22 = 0;
  let sy = 0;
  let s1y = 0;
  let s2y = 0;

  for (let i = 0; i < n; i++) {
    const a = x1[i];
    const b = x2[i];
    const yi = y[i];
    s1 += a;
    s2 += b;
    s11 += a * a;
    s12 += a * b;
    s22 += b * b;
    sy += yi;
    s1y += a * yi;
    s2y += b * yi;
  }

  const ridge = 1e-8;
  const A = [
    [n, s1, s2, sy],
    [s1, s11 + ridge, s12, s1y],
    [s2, s12, s22 + ridge, s2y],
  ];

  // Gaussian elimination with partial pivoting on 3x4 augmented matrix
  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let row = col + 1; row < 3; row++) {
      if (Math.abs(A[row][col]) > Math.abs(A[pivot][col])) pivot = row;
    }
    if (pivot !== col) {
      const tmp = A[col];
      A[col] = A[pivot];
      A[pivot] = tmp;
    }
    const diag = A[col][col];
    if (Math.abs(diag) < 1e-12) return { alpha: 0, beta1: 1, beta2: 0 };
    for (let j = col; j < 4; j++) A[col][j] /= diag;
    for (let row = 0; row < 3; row++) {
      if (row === col) continue;
      const factor = A[row][col];
      for (let j = col; j < 4; j++) A[row][j] -= factor * A[col][j];
    }
  }

  return {
    alpha: A[0][3],
    beta1: clamp(A[1][3], -3, 3),
    beta2: clamp(A[2][3], -3, 3),
  };
}

/**
 * Computes trailing-window 2-factor market-neutral abnormal returns (net of SPY
 * broad market and XBI biotech sector factors) with zero lookahead bias.
 */
export function computeMarketNeutralAbnormalReturns(
  tickerCloses: number[],
  spyCloses: number[],
  xbiCloses: number[],
  rollingWindow = 60,
): { returns: number[]; abnormalReturns: number[]; car7d: number[] } {
  const n = Math.min(tickerCloses.length, spyCloses.length, xbiCloses.length);
  const returns = computeDailyReturns(tickerCloses.slice(0, n));
  const spyReturns = computeDailyReturns(spyCloses.slice(0, n));
  const xbiReturns = computeDailyReturns(xbiCloses.slice(0, n));
  const abnormalReturns = new Array<number>(n).fill(0);
  const car7d = new Array<number>(n).fill(0);

  for (let t = 1; t < n; t++) {
    const start = Math.max(1, t - rollingWindow);
    const len = t - start;
    if (len < 10) {
      abnormalReturns[t] = returns[t] - 0.5 * (spyReturns[t] + xbiReturns[t]);
    } else {
      const { alpha, beta1, beta2 } = solveLinearRegression2Factor(
        returns.slice(start, t),
        spyReturns.slice(start, t),
        xbiReturns.slice(start, t),
      );
      const expected = alpha + beta1 * spyReturns[t] + beta2 * xbiReturns[t];
      abnormalReturns[t] = returns[t] - expected;
    }
  }

  for (let t = 0; t < n; t++) {
    let sum = 0;
    for (let k = Math.max(0, t - 6); k <= t; k++) {
      sum += abnormalReturns[k];
    }
    car7d[t] = sum;
  }

  return { returns, abnormalReturns, car7d };
}

/**
 * Computes trailing-window trading volume Z-scores to detect institutional
 * accumulation or supply-chain procurement shocks without lookahead bias.
 */
export function computeVolumeZScores(volumes: number[], window = 30): number[] {
  const n = volumes.length;
  const out = new Array<number>(n).fill(0);
  for (let t = 0; t < n; t++) {
    const start = Math.max(0, t - window);
    const slice = volumes.slice(start, t);
    if (slice.length < 5) {
      out[t] = 0;
      continue;
    }
    const mean = slice.reduce((acc, v) => acc + v, 0) / slice.length;
    const variance = slice.reduce((acc, v) => acc + (v - mean) ** 2, 0) / slice.length;
    const std = Math.sqrt(variance);
    out[t] = std > 1e-6 ? clamp((volumes[t] - mean) / std, -6, 8) : 0;
  }
  return out;
}

export function pearsonCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return 0;
  let sa = 0;
  let sb = 0;
  for (let i = 0; i < n; i++) {
    sa += a[i];
    sb += b[i];
  }
  const ma = sa / n;
  const mb = sb / n;

  let num = 0;
  let da2 = 0;
  let db2 = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - ma;
    const db = b[i] - mb;
    num += da * db;
    da2 += da * da;
    db2 += db * db;
  }
  const denom = Math.sqrt(da2 * db2);
  if (denom < 1e-12) return 0;
  return clamp(num / denom, -1, 1);
}

/**
 * Bidirectional cross-correlogram over lag tau in [-maxLagDays, +maxLagDays].
 * Negative lag (tau < 0) means marketSignal at t correlates with caseSeries at
 * t + |tau| (market leads outbreak by |tau| days).
 */
export function computeLeadLagCorrelogram(
  marketSignal: number[],
  caseSeries: number[],
  maxLagDays = 21,
): { series: LeadLagPoint[]; optimalLeadDays: number; peakR: number } {
  const n = Math.min(marketSignal.length, caseSeries.length);
  const series: LeadLagPoint[] = [];

  for (let lag = -maxLagDays; lag <= maxLagDays; lag++) {
    const x: number[] = [];
    const y: number[] = [];
    if (lag < 0) {
      const lead = -lag;
      for (let t = 0; t + lead < n; t++) {
        x.push(marketSignal[t]);
        y.push(caseSeries[t + lead]);
      }
    } else {
      for (let t = 0; t + lag < n; t++) {
        x.push(marketSignal[t + lag]);
        y.push(caseSeries[t]);
      }
    }
    const r = x.length >= 6 ? pearsonCorrelation(x, y) : 0;
    const denom = Math.max(1e-6, 1 - r * r);
    const tStat = x.length >= 6 ? r * Math.sqrt((x.length - 2) / denom) : 0;
    const zone: LeadLagPoint["zone"] =
      lag < 0 ? "market_leads" : lag > 0 ? "cases_lead" : "concurrent";
    series.push({
      lag,
      r: Number(r.toFixed(3)),
      tStat: Number(tStat.toFixed(2)),
      zone,
    });
  }

  let best = series[0] ?? { lag: 0, r: 0, tStat: 0, zone: "concurrent" as const };
  for (const pt of series) {
    if (pt.r > best.r + 0.005 || (Math.abs(pt.r - best.r) <= 0.005 && pt.lag < best.lag)) {
      best = pt;
    }
  }

  return {
    series,
    optimalLeadDays: best.lag,
    peakR: best.r,
  };
}

/** Converts a Z-score into a bounded 0-100 risk sub-score via smooth logistic scaling. */
function zScoreToRisk100(z: number, center = 0.5, scale = 1.15): number {
  const sig = 1 / (1 + Math.exp(-(z - center) / scale));
  return Number((sig * 100).toFixed(1));
}

function addIsoDays(isoDate: string, days: number): string {
  const base = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

export function computeDiseaseNowcast(params: {
  dates: string[];
  dailyCases: number[];
  basketCar7dSeries: number[];
  basketVolZSeries: number[];
  wikiAttentionZ: number;
  climateSuitability: number;
  horizonDays?: number;
}): DiseaseNowcastResult {
  const {
    dates,
    dailyCases,
    basketCar7dSeries,
    basketVolZSeries,
    wikiAttentionZ,
    climateSuitability,
    horizonDays = 14,
  } = params;

  const n = Math.min(
    dates.length,
    dailyCases.length,
    basketCar7dSeries.length,
    basketVolZSeries.length,
  );

  // Combined equity anomaly Z-series: 60% CAR_7d (scaled by typical 3% 7d swing) + 40% Volume Z
  const pharmaSignalSeries = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    pharmaSignalSeries[i] = Number(
      (0.6 * (basketCar7dSeries[i] / 0.03) + 0.4 * basketVolZSeries[i]).toFixed(3),
    );
  }

  const {
    series: correlogram,
    optimalLeadDays,
    peakR,
  } = computeLeadLagCorrelogram(pharmaSignalSeries, dailyCases, 21);

  const lastIdx = Math.max(0, n - 1);
  const latestCar7d = n > 0 ? basketCar7dSeries[lastIdx] : 0;
  const latestVolZScore = n > 0 ? basketVolZSeries[lastIdx] : 0;
  const latestPharmaZScore = n > 0 ? pharmaSignalSeries[lastIdx] : 0;

  // Use peak over recent 5 trading days so single-day noise doesn't erase a fresh surge
  const recentWindowStart = Math.max(0, n - 5);
  const recentMaxCar =
    n > 0 ? Math.max(...basketCar7dSeries.slice(recentWindowStart)) : latestCar7d;
  const recentMaxVolZ =
    n > 0 ? Math.max(...basketVolZSeries.slice(recentWindowStart)) : latestVolZScore;

  const pharmaAlphaScore = zScoreToRisk100(recentMaxCar / 0.025, 0.35, 1.0);
  const volumeAnomalyScore = zScoreToRisk100(recentMaxVolZ, 0.4, 1.05);
  const wikiAttentionScore = zScoreToRisk100(wikiAttentionZ, 0.35, 1.0);
  const climateSuitabilityScore = Number(clamp(climateSuitability, 0, 100).toFixed(1));

  const weights = {
    pharmaAlpha: 0.35,
    volumeAnomaly: 0.25,
    wikiAttention: 0.2,
    climateSuitability: 0.2,
  };

  const compositeOutbreakRisk = Number(
    clamp(
      pharmaAlphaScore * weights.pharmaAlpha +
        volumeAnomalyScore * weights.volumeAnomaly +
        wikiAttentionScore * weights.wikiAttention +
        climateSuitabilityScore * weights.climateSuitability,
      0,
      100,
    ).toFixed(1),
  );

  const riskTier: DiseaseNowcastResult["riskTier"] =
    compositeOutbreakRisk >= 75
      ? "Critical"
      : compositeOutbreakRisk >= 55
        ? "High"
        : compositeOutbreakRisk >= 35
          ? "Moderate"
          : "Low";

  // Build historical + 14-day predicted trajectory anchored on recent 7-day baseline
  const recentCasesSlice = dailyCases.slice(Math.max(0, n - 7));
  const baselineDaily =
    recentCasesSlice.length > 0
      ? recentCasesSlice.reduce((a, b) => a + b, 0) / recentCasesSlice.length
      : 0.5;
  const priorCasesSlice = dailyCases.slice(Math.max(0, n - 21), Math.max(0, n - 7));
  const priorDaily =
    priorCasesSlice.length > 0
      ? priorCasesSlice.reduce((a, b) => a + b, 0) / priorCasesSlice.length
      : baselineDaily;

  const caseStd = Math.max(
    0.45,
    Math.sqrt(
      recentCasesSlice.reduce((acc, v) => acc + (v - baselineDaily) ** 2, 0) /
        Math.max(1, recentCasesSlice.length),
    ),
  );

  // Lead offset in days for reading the leading equity indicator
  const effectiveLead = optimalLeadDays < 0 ? clamp(-optimalLeadDays, 4, 18) : 9;

  const trajectory: NowcastTrajectoryPoint[] = [];
  for (let i = 0; i < n; i++) {
    trajectory.push({
      date: dates[i],
      actual: dailyCases[i],
      predicted: i === n - 1 ? Number(baselineDaily.toFixed(2)) : null,
      lower80: null,
      upper80: null,
      pharmaSignal: pharmaSignalSeries[i],
      isForecast: false,
    });
  }

  const lastDate = n > 0 ? dates[lastIdx] : new Date().toISOString().slice(0, 10);
  const momentumRatio =
    priorDaily > 0 ? clamp((baselineDaily - priorDaily) / priorDaily, -0.35, 0.6) : 0;
  const riskImpulse = (compositeOutbreakRisk - 42) / 55; // negative if low risk, positive if surging

  let forecastTotal7d = 0;
  let forecastTotal14d = 0;

  for (let h = 1; h <= horizonDays; h++) {
    // Look up historical pharma signal at (n - 1 - effectiveLead + h) when in range
    const laggedIdx = n - 1 - effectiveLead + h;
    const laggedSignal =
      laggedIdx >= 0 && laggedIdx < n ? pharmaSignalSeries[laggedIdx] : latestPharmaZScore;
    const growthMultiplier = clamp(
      1 + 0.14 * laggedSignal + 0.28 * riskImpulse + 0.25 * momentumRatio * (h / horizonDays),
      0.55,
      2.65,
    );
    const pointForecast = Math.max(0, baselineDaily * growthMultiplier);
    const halfWidth = 1.28 * caseStd * Math.sqrt(h / 4.5);

    if (h <= 7) forecastTotal7d += pointForecast;
    forecastTotal14d += pointForecast;

    trajectory.push({
      date: addIsoDays(lastDate, h),
      actual: null,
      predicted: Number(pointForecast.toFixed(2)),
      lower80: Number(Math.max(0, pointForecast - halfWidth).toFixed(2)),
      upper80: Number((pointForecast + halfWidth).toFixed(2)),
      pharmaSignal: laggedIdx >= 0 && laggedIdx < n ? pharmaSignalSeries[laggedIdx] : null,
      isForecast: true,
    });
  }

  return {
    compositeOutbreakRisk,
    riskTier,
    latestPharmaZScore: Number(latestPharmaZScore.toFixed(2)),
    latestCar7d: Number(latestCar7d.toFixed(4)),
    latestVolZScore: Number(latestVolZScore.toFixed(2)),
    optimalLeadDays,
    peakR,
    forecastTotal7d: Number(forecastTotal7d.toFixed(1)),
    forecastTotal14d: Number(forecastTotal14d.toFixed(1)),
    attribution: {
      pharmaAlphaScore,
      volumeAnomalyScore,
      wikiAttentionScore,
      climateSuitabilityScore,
      weights,
    },
    correlogram,
    trajectory,
  };
}
