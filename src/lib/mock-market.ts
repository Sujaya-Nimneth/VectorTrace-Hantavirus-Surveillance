import type { DiseaseSlug } from "./diseases";
import { PHARMA_TICKERS } from "./diseases";
import type { MarketDailyBar } from "./mock-data";
import { computeMarketNeutralAbnormalReturns, computeVolumeZScores } from "./market-prediction";

let __seed = 1337;
function rand() {
  __seed = (__seed * 9301 + 49297) % 233280;
  return __seed / 233280;
}

function randNormal() {
  const u1 = Math.max(1e-6, rand());
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

const TOTAL_DAYS = 90;

const BASE_PRICE: Record<string, number> = {
  SPY: 582,
  XBI: 98,
  DHR: 248,
  ABT: 118,
  QGEN: 44,
  "BIM.PA": 106,
  TAK: 14.8,
  SNY: 54.5,
  VALN: 6.4,
  "BAVA.CO": 218,
  SIGA: 8.2,
  EBS: 9.6,
  MRNA: 52.4,
  "CSL.AX": 286,
  RHHBY: 37.2,
  BAX: 34.8,
  BDX: 236,
  "GETI-B.ST": 204,
  RTO: 26.5,
};

const BASE_VOLUME: Record<string, number> = {
  SPY: 48_000_000,
  XBI: 9_200_000,
  DHR: 3_100_000,
  ABT: 5_400_000,
  QGEN: 1_250_000,
  "BIM.PA": 320_000,
  TAK: 2_800_000,
  SNY: 2_200_000,
  VALN: 420_000,
  "BAVA.CO": 610_000,
  SIGA: 1_450_000,
  EBS: 1_100_000,
  MRNA: 8_900_000,
  "CSL.AX": 780_000,
  RHHBY: 1_650_000,
  BAX: 3_600_000,
  BDX: 1_750_000,
  "GETI-B.ST": 640_000,
  RTO: 1_900_000,
};

/**
 * Generates an outbreak-linked alpha & volume pulse centered around `peakOffsetFromEnd`
 * days before the latest bar so lead-lag cross-correlations mirror real early warnings.
 */
const TICKER_OUTBREAK_PULSES: Record<
  string,
  Array<{ daysBeforeEnd: number; alphaPulse: number; volMult: number }>
> = {
  // Dengue wave ~11 days lead
  TAK: [{ daysBeforeEnd: 11, alphaPulse: 0.015, volMult: 2.3 }],
  ABT: [{ daysBeforeEnd: 12, alphaPulse: 0.014, volMult: 2.8 }],
  BAX: [
    { daysBeforeEnd: 10, alphaPulse: 0.011, volMult: 2.1 },
    { daysBeforeEnd: 4, alphaPulse: 0.008, volMult: 1.8 },
  ],
  // Mpox wave ~9 days lead
  "BAVA.CO": [{ daysBeforeEnd: 9, alphaPulse: 0.026, volMult: 3.4 }],
  SIGA: [{ daysBeforeEnd: 9, alphaPulse: 0.029, volMult: 3.6 }],
  DHR: [{ daysBeforeEnd: 10, alphaPulse: 0.009, volMult: 1.9 }],
  // H5N1 wave ~8 days lead
  MRNA: [{ daysBeforeEnd: 8, alphaPulse: 0.019, volMult: 2.6 }],
  "CSL.AX": [{ daysBeforeEnd: 9, alphaPulse: 0.011, volMult: 2.0 }],
  RHHBY: [{ daysBeforeEnd: 7, alphaPulse: 0.008, volMult: 1.7 }],
  // Hantavirus acute support ~6 days lead
  "GETI-B.ST": [{ daysBeforeEnd: 6, alphaPulse: 0.013, volMult: 2.2 }],
  RTO: [{ daysBeforeEnd: 11, alphaPulse: 0.009, volMult: 1.9 }],
  // Arbovirus / Cholera subtle pulses
  VALN: [{ daysBeforeEnd: 10, alphaPulse: 0.017, volMult: 2.4 }],
  "BIM.PA": [{ daysBeforeEnd: 11, alphaPulse: 0.012, volMult: 2.1 }],
};

export const MOCK_WIKI_ATTENTION_Z: Record<DiseaseSlug, number> = {
  hantavirus: 1.35,
  dengue: 2.75,
  h5n1: 1.95,
  mpox: 2.45,
  arbovirus: 1.55,
  cholera: 0.85,
};

export const MOCK_CLIMATE_SCORES: Record<DiseaseSlug, number> = {
  hantavirus: 64,
  dengue: 86,
  h5n1: 58,
  mpox: 52,
  arbovirus: 79,
  cholera: 48,
};

function generateIsoDates(days: number): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export const MOCK_MARKET_DATES = generateIsoDates(TOTAL_DAYS);

export const MOCK_MARKET_BARS: MarketDailyBar[] = (() => {
  const spyCloses: number[] = [];
  const xbiCloses: number[] = [];
  const spyRet: number[] = [];
  const xbiRet: number[] = [];

  let spyP = BASE_PRICE.SPY;
  let xbiP = BASE_PRICE.XBI;
  for (let t = 0; t < TOTAL_DAYS; t++) {
    const rMkt = t === 0 ? 0 : 0.0004 + 0.0075 * randNormal();
    const rBio = t === 0 ? 0 : 1.15 * rMkt + 0.009 * randNormal();
    spyP = Number((spyP * (1 + rMkt)).toFixed(4));
    xbiP = Number((xbiP * (1 + rBio)).toFixed(4));
    spyCloses.push(spyP);
    xbiCloses.push(xbiP);
    spyRet.push(rMkt);
    xbiRet.push(rBio);
  }

  const allBars: MarketDailyBar[] = [];

  for (const meta of PHARMA_TICKERS) {
    if (meta.ticker === "SPY" || meta.ticker === "XBI") {
      const closes = meta.ticker === "SPY" ? spyCloses : xbiCloses;
      const rets = meta.ticker === "SPY" ? spyRet : xbiRet;
      const baseV = BASE_VOLUME[meta.ticker] ?? 5_000_000;
      const vols = closes.map((_, t) =>
        Math.round(baseV * (0.85 + 0.3 * rand() + (t % 5 === 0 ? 0.1 : 0))),
      );
      const volZs = computeVolumeZScores(vols, 30);
      for (let t = 0; t < TOTAL_DAYS; t++) {
        allBars.push({
          ticker: meta.ticker,
          tradeDate: MOCK_MARKET_DATES[t],
          closePrice: closes[t],
          volume: vols[t],
          return1d: Number(rets[t].toFixed(5)),
          abnormalReturn1d: 0,
          car7d: 0,
          volumeZScore: Number(volZs[t].toFixed(3)),
        });
      }
      continue;
    }

    const betaMkt = meta.isPurePlay ? 0.55 : 0.78;
    const betaBio = meta.isPurePlay ? 0.85 : 0.35;
    const pulses = TICKER_OUTBREAK_PULSES[meta.ticker] ?? [];
    const baseV = BASE_VOLUME[meta.ticker] ?? 1_500_000;

    let price = BASE_PRICE[meta.ticker] ?? 50;
    const closes: number[] = [];
    const volumes: number[] = [];

    for (let t = 0; t < TOTAL_DAYS; t++) {
      const daysBeforeEnd = TOTAL_DAYS - 1 - t;
      let pulseAlpha = 0;
      let pulseVolMult = 1;
      for (const p of pulses) {
        const dist = Math.abs(daysBeforeEnd - p.daysBeforeEnd);
        if (dist <= 3) {
          const decay = Math.exp(-(dist * dist) / 3.2);
          pulseAlpha += p.alphaPulse * decay;
          pulseVolMult = Math.max(pulseVolMult, 1 + (p.volMult - 1) * decay);
        }
      }

      const noise = (meta.isPurePlay ? 0.011 : 0.0065) * randNormal();
      const ret = t === 0 ? 0 : betaMkt * spyRet[t] + betaBio * xbiRet[t] + pulseAlpha + noise;
      price = Math.max(1, Number((price * (1 + ret)).toFixed(4)));
      closes.push(price);

      const volNoise = 0.86 + 0.28 * rand();
      volumes.push(Math.round(baseV * volNoise * pulseVolMult));
    }

    const { returns, abnormalReturns, car7d } = computeMarketNeutralAbnormalReturns(
      closes,
      spyCloses,
      xbiCloses,
      30,
    );
    const volZs = computeVolumeZScores(volumes, 30);

    for (let t = 0; t < TOTAL_DAYS; t++) {
      allBars.push({
        ticker: meta.ticker,
        tradeDate: MOCK_MARKET_DATES[t],
        closePrice: closes[t],
        volume: volumes[t],
        return1d: Number(returns[t].toFixed(5)),
        abnormalReturn1d: Number(abnormalReturns[t].toFixed(5)),
        car7d: Number(car7d[t].toFixed(5)),
        volumeZScore: Number(volZs[t].toFixed(3)),
      });
    }
  }

  return allBars;
})();
