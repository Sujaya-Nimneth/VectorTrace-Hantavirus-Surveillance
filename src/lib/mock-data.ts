import type { DiseaseSlug, SectorRole, SentinelType } from "./diseases";

export type Case = {
  id: string;
  diseaseSlug?: DiseaseSlug;
  region: string;
  lat: number | null;
  lng: number | null;
  date: string;
  syndrome: string;
  status: "Confirmed" | "Suspected" | "Pending";
  age: number | null;
  sex: "M" | "F" | null;
  symptoms: string[];
  exposure: string | null;
};

export type RodentSite = {
  id: string;
  diseaseSlug?: DiseaseSlug;
  sentinelType?: SentinelType;
  region: string;
  lat: number;
  lng: number;
  date: string;
  positivity: number;
  species: string;
};

export type SentinelSite = RodentSite;

export type Alert = {
  id: string;
  diseaseSlug?: DiseaseSlug;
  signalSource?: "clinical" | "who_don" | "market_divergence" | "composite_nowcast";
  createdAt: string;
  level: "critical" | "warning" | "info";
  title: string;
  region: string;
};

export type MarketDailyBar = {
  ticker: string;
  tradeDate: string;
  closePrice: number;
  volume: number;
  return1d: number;
  abnormalReturn1d: number;
  car7d: number;
  volumeZScore: number;
};

export type DiseaseNowcastSignal = {
  diseaseSlug: DiseaseSlug;
  region: string;
  signalDate: string;
  pharmaBasketZScore: number;
  wikiAttentionZScore: number;
  climateSuitabilityScore: number;
  compositeOutbreakRisk: number;
  optimalLeadDays: number;
  lagCorrelationR: number;
  forecastCases7d: number;
  forecastCases14d: number;
};

export type TickerSignalSummary = {
  ticker: string;
  companyName: string;
  exchange: string;
  sectorRole: SectorRole;
  isPurePlay: boolean;
  weight: number;
  leadRole: string;
  rationale: string;
  lastPrice: number;
  return7d: number;
  car7d: number;
  volumeZScore: number;
  signalLabel: "Outbreak Accumulation" | "Supply Stress" | "Neutral";
};

export const REGIONS = [
  { name: "Patagonia Norte", lat: -41.13, lng: -71.31, pop: 638645 },
  { name: "Cuyo", lat: -32.89, lng: -68.84, pop: 1738929 },
  { name: "NOA", lat: -24.79, lng: -65.41, pop: 1333365 },
  { name: "Pampeana", lat: -36.62, lng: -64.29, pop: 316940 },
  { name: "NEA", lat: -27.45, lng: -58.99, pop: 1055259 },
  { name: "Centro", lat: -31.42, lng: -64.18, pop: 3760450 },
];
