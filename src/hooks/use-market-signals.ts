import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { isDemoMode } from "@/lib/demo-mode";
import {
  DISEASES,
  DISEASE_TICKER_MAPPINGS,
  PHARMA_TICKER_BY_SYMBOL,
  getTickersForDisease,
  isDiseaseSlug,
  type DiseaseProfile,
  type DiseaseSlug,
  type SectorRole,
} from "@/lib/diseases";
import { computeDiseaseNowcast, type DiseaseNowcastResult } from "@/lib/market-prediction";
import type {
  Case,
  DiseaseNowcastSignal,
  MarketDailyBar,
  TickerSignalSummary,
} from "@/lib/mock-data";
import {
  MOCK_CLIMATE_SCORES,
  MOCK_MARKET_BARS,
  MOCK_MARKET_DATES,
  MOCK_WIKI_ATTENTION_Z,
} from "@/lib/mock-market";
import { useCases } from "@/hooks/use-surveillance";

type DbMarketBar = Tables<"market_daily_bars">;
type DbNowcastSignal = Tables<"disease_nowcast_signals">;
type DbMapping = Tables<"disease_ticker_mappings">;
type DbTicker = Tables<"pharma_tickers">;

const mapMarketBar = (r: DbMarketBar): MarketDailyBar => ({
  ticker: r.ticker,
  tradeDate: r.trade_date,
  closePrice: Number(r.close_price),
  volume: Number(r.volume),
  return1d: Number(r.return_1d),
  abnormalReturn1d: Number(r.abnormal_return_1d),
  car7d: Number(r.car_7d),
  volumeZScore: Number(r.volume_zscore),
});

const mapNowcast = (r: DbNowcastSignal): DiseaseNowcastSignal => ({
  diseaseSlug: isDiseaseSlug(r.disease_slug) ? r.disease_slug : "hantavirus",
  region: r.region,
  signalDate: r.signal_date,
  pharmaBasketZScore: Number(r.pharma_basket_zscore),
  wikiAttentionZScore: Number(r.wiki_attention_zscore),
  climateSuitabilityScore: Number(r.climate_suitability_score),
  compositeOutbreakRisk: Number(r.composite_outbreak_risk),
  optimalLeadDays: Number(r.optimal_lead_days),
  lagCorrelationR: Number(r.lag_correlation_r),
  forecastCases7d: Number(r.forecast_cases_7d),
  forecastCases14d: Number(r.forecast_cases_14d),
});

async function fetchMarketBars(): Promise<MarketDailyBar[]> {
  if (isDemoMode()) return MOCK_MARKET_BARS;
  const { data, error } = await supabase
    .from("market_daily_bars")
    .select("*")
    .order("trade_date", { ascending: true })
    .limit(2500);
  if (error) throw new Error(`Failed to load market bars: ${error.message}`);
  const rows = (data as DbMarketBar[]).map(mapMarketBar);
  return rows.length > 0 ? rows : MOCK_MARKET_BARS;
}

async function fetchStoredNowcasts(): Promise<DiseaseNowcastSignal[]> {
  if (isDemoMode()) return [];
  const { data, error } = await supabase
    .from("disease_nowcast_signals")
    .select("*")
    .order("signal_date", { ascending: false })
    .limit(300);
  if (error) throw new Error(`Failed to load nowcast signals: ${error.message}`);
  return (data as DbNowcastSignal[]).map(mapNowcast);
}

async function fetchBasketMappings() {
  if (isDemoMode()) {
    return {
      mappings: DISEASE_TICKER_MAPPINGS,
      tickers: PHARMA_TICKER_BY_SYMBOL,
    };
  }
  const [mapRes, tickRes] = await Promise.all([
    supabase.from("disease_ticker_mappings").select("*"),
    supabase.from("pharma_tickers").select("*"),
  ]);
  if (mapRes.error || tickRes.error) {
    return {
      mappings: DISEASE_TICKER_MAPPINGS,
      tickers: PHARMA_TICKER_BY_SYMBOL,
    };
  }
  const dbMappings = (mapRes.data as DbMapping[]).map((m) => ({
    diseaseSlug: isDiseaseSlug(m.disease_slug) ? m.disease_slug : ("hantavirus" as DiseaseSlug),
    ticker: m.ticker,
    weight: Number(m.weight),
    leadRole: m.lead_role,
    rationale: m.rationale,
  }));
  const dbTickers = Object.fromEntries(
    (tickRes.data as DbTicker[]).map((t) => [
      t.ticker,
      {
        ticker: t.ticker,
        companyName: t.company_name,
        exchange: t.exchange,
        sectorRole: t.sector_role as SectorRole,
        isPurePlay: t.is_pure_play,
      },
    ]),
  );
  return {
    mappings: dbMappings.length ? dbMappings : DISEASE_TICKER_MAPPINGS,
    tickers: Object.keys(dbTickers).length ? dbTickers : PHARMA_TICKER_BY_SYMBOL,
  };
}

function buildDailyCaseCounts(cases: Case[], dates: string[]): number[] {
  const indexByDate = new Map(dates.map((d, i) => [d, i]));
  const counts = new Array<number>(dates.length).fill(0);
  for (const c of cases) {
    const dayKey = c.date.slice(0, 10);
    const idx = indexByDate.get(dayKey);
    if (idx !== undefined) counts[idx] += 1;
  }
  return counts;
}

function computePredictionForDisease(params: {
  diseaseSlug: DiseaseSlug;
  cases: Case[];
  barsByTicker: Map<string, MarketDailyBar[]>;
  storedSignals: DiseaseNowcastSignal[];
  mappings: typeof DISEASE_TICKER_MAPPINGS;
  tickers: typeof PHARMA_TICKER_BY_SYMBOL;
  regionFilter?: string;
}): {
  nowcast: DiseaseNowcastResult;
  tickerSummaries: TickerSignalSummary[];
} {
  const {
    diseaseSlug,
    cases,
    barsByTicker,
    storedSignals,
    mappings,
    tickers,
    regionFilter = "all",
  } = params;

  const diseaseCases = cases.filter(
    (c) =>
      (c.diseaseSlug ?? "hantavirus") === diseaseSlug &&
      (regionFilter === "all" || c.region === regionFilter),
  );

  // Align dates from available market bars (or fallback to demo 90-day calendar)
  const firstMapped = mappings.find((m) => m.diseaseSlug === diseaseSlug);
  const refBars = firstMapped ? (barsByTicker.get(firstMapped.ticker) ?? []) : [];
  const dates = refBars.length >= 14 ? refBars.map((b) => b.tradeDate) : MOCK_MARKET_DATES;

  const dailyCases = buildDailyCaseCounts(diseaseCases, dates);

  const basketMappings = mappings.filter((m) => m.diseaseSlug === diseaseSlug);
  const basketCar7dSeries = new Array<number>(dates.length).fill(0);
  const basketVolZSeries = new Array<number>(dates.length).fill(0);
  const weightTotals = new Array<number>(dates.length).fill(0);

  const tickerSummaries: TickerSignalSummary[] = [];

  for (const mapping of basketMappings) {
    const tickerBars = barsByTicker.get(mapping.ticker) ?? [];
    const byDate = new Map(tickerBars.map((b) => [b.tradeDate, b]));
    const meta = tickers[mapping.ticker] ?? PHARMA_TICKER_BY_SYMBOL[mapping.ticker];

    for (let i = 0; i < dates.length; i++) {
      const bar = byDate.get(dates[i]);
      if (!bar) continue;
      basketCar7dSeries[i] += mapping.weight * bar.car7d;
      basketVolZSeries[i] += mapping.weight * bar.volumeZScore;
      weightTotals[i] += mapping.weight;
    }

    const latest = tickerBars[tickerBars.length - 1];
    const prior7 = tickerBars[Math.max(0, tickerBars.length - 8)];
    const return7d =
      latest && prior7 && prior7.closePrice > 0
        ? (latest.closePrice - prior7.closePrice) / prior7.closePrice
        : 0;
    const car7d = latest?.car7d ?? 0;
    const volumeZScore = latest?.volumeZScore ?? 0;
    const recentPeakCar = Math.max(...tickerBars.slice(-12).map((b) => b.car7d), car7d);
    const recentPeakVolZ = Math.max(
      ...tickerBars.slice(-12).map((b) => b.volumeZScore),
      volumeZScore,
    );

    const signalLabel: TickerSignalSummary["signalLabel"] =
      recentPeakCar >= 0.035 && recentPeakVolZ >= 1.8
        ? "Outbreak Accumulation"
        : recentPeakVolZ >= 1.6 || recentPeakCar >= 0.022
          ? "Supply Stress"
          : "Neutral";

    if (meta) {
      tickerSummaries.push({
        ticker: mapping.ticker,
        companyName: meta.companyName,
        exchange: meta.exchange,
        sectorRole: meta.sectorRole,
        isPurePlay: meta.isPurePlay,
        weight: mapping.weight,
        leadRole: mapping.leadRole,
        rationale: mapping.rationale,
        lastPrice: latest?.closePrice ?? 0,
        return7d: Number(return7d.toFixed(4)),
        car7d: Number(recentPeakCar.toFixed(4)),
        volumeZScore: Number(recentPeakVolZ.toFixed(2)),
        signalLabel,
      });
    }
  }

  for (let i = 0; i < dates.length; i++) {
    if (weightTotals[i] > 0) {
      basketCar7dSeries[i] /= weightTotals[i];
      basketVolZSeries[i] /= weightTotals[i];
    }
  }

  const storedForDisease = storedSignals.filter(
    (s) => s.diseaseSlug === diseaseSlug && (regionFilter === "all" || s.region === regionFilter),
  );
  const wikiAttentionZ = storedForDisease.length
    ? storedForDisease[0].wikiAttentionZScore
    : MOCK_WIKI_ATTENTION_Z[diseaseSlug];
  const climateSuitability = storedForDisease.length
    ? storedForDisease.reduce((acc, s) => acc + s.climateSuitabilityScore, 0) /
      storedForDisease.length
    : MOCK_CLIMATE_SCORES[diseaseSlug];

  const nowcast = computeDiseaseNowcast({
    dates,
    dailyCases,
    basketCar7dSeries,
    basketVolZSeries,
    wikiAttentionZ,
    climateSuitability,
    horizonDays: 14,
  });

  tickerSummaries.sort(
    (a, b) => b.car7d + b.volumeZScore * 0.01 - (a.car7d + a.volumeZScore * 0.01),
  );

  return { nowcast, tickerSummaries };
}

export function useMarketBars() {
  return useQuery({
    queryKey: ["market_daily_bars"],
    queryFn: fetchMarketBars,
    staleTime: 120_000,
  });
}

export function useDiseasePrediction(diseaseSlug: DiseaseSlug, regionFilter = "all") {
  const { allCases, loading: casesLoading, error: casesError, refetch: refetchCases } = useCases();
  const barsQuery = useMarketBars();
  const storedQuery = useQuery({
    queryKey: ["disease_nowcast_signals"],
    queryFn: fetchStoredNowcasts,
    staleTime: 120_000,
  });
  const mappingsQuery = useQuery({
    queryKey: ["disease_ticker_mappings"],
    queryFn: fetchBasketMappings,
    staleTime: 300_000,
  });

  const barsByTicker = useMemo(() => {
    const map = new Map<string, MarketDailyBar[]>();
    for (const bar of barsQuery.data ?? []) {
      const arr = map.get(bar.ticker);
      if (arr) arr.push(bar);
      else map.set(bar.ticker, [bar]);
    }
    return map;
  }, [barsQuery.data]);

  const prediction = useMemo(() => {
    const mappings = mappingsQuery.data?.mappings ?? DISEASE_TICKER_MAPPINGS;
    const tickers = mappingsQuery.data?.tickers ?? PHARMA_TICKER_BY_SYMBOL;
    return computePredictionForDisease({
      diseaseSlug,
      cases: allCases,
      barsByTicker,
      storedSignals: storedQuery.data ?? [],
      mappings,
      tickers,
      regionFilter,
    });
  }, [diseaseSlug, allCases, barsByTicker, storedQuery.data, mappingsQuery.data, regionFilter]);

  return {
    nowcast: prediction.nowcast,
    tickerSummaries: prediction.tickerSummaries,
    loading: casesLoading || barsQuery.isPending,
    error: casesError || barsQuery.error || storedQuery.error,
    refetch: () => {
      void refetchCases();
      void barsQuery.refetch();
      void storedQuery.refetch();
    },
  };
}

export type DiseaseRiskOverview = {
  disease: DiseaseProfile;
  nowcast: DiseaseNowcastResult;
  leadTickers: string[];
};

export function useAllDiseaseNowcasts() {
  const { allCases, loading: casesLoading, error: casesError, refetch: refetchCases } = useCases();
  const barsQuery = useMarketBars();
  const storedQuery = useQuery({
    queryKey: ["disease_nowcast_signals"],
    queryFn: fetchStoredNowcasts,
    staleTime: 120_000,
  });
  const mappingsQuery = useQuery({
    queryKey: ["disease_ticker_mappings"],
    queryFn: fetchBasketMappings,
    staleTime: 300_000,
  });

  const barsByTicker = useMemo(() => {
    const map = new Map<string, MarketDailyBar[]>();
    for (const bar of barsByTickerList(barsQuery.data ?? [])) {
      const arr = map.get(bar.ticker);
      if (arr) arr.push(bar);
      else map.set(bar.ticker, [bar]);
    }
    return map;
  }, [barsQuery.data]);

  const summaries = useMemo<DiseaseRiskOverview[]>(() => {
    const mappings = mappingsQuery.data?.mappings ?? DISEASE_TICKER_MAPPINGS;
    const tickers = mappingsQuery.data?.tickers ?? PHARMA_TICKER_BY_SYMBOL;
    return DISEASES.map((disease) => {
      const { nowcast } = computePredictionForDisease({
        diseaseSlug: disease.slug,
        cases: allCases,
        barsByTicker,
        storedSignals: storedQuery.data ?? [],
        mappings,
        tickers,
      });
      const leadTickers = getTickersForDisease(disease.slug)
        .slice(0, 3)
        .map((m) => m.ticker);
      return { disease, nowcast, leadTickers };
    }).sort((a, b) => b.nowcast.compositeOutbreakRisk - a.nowcast.compositeOutbreakRisk);
  }, [allCases, barsByTicker, storedQuery.data, mappingsQuery.data]);

  return {
    data: summaries,
    loading: casesLoading || barsQuery.isPending,
    error: casesError || barsQuery.error,
    refetch: () => {
      void refetchCases();
      void barsQuery.refetch();
    },
  };
}

function barsByTickerList(bars: MarketDailyBar[]): MarketDailyBar[] {
  return bars;
}
