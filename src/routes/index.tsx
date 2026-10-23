import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { EpidemicCurve } from "@/components/EpidemicCurve";
import { AlertsFeed } from "@/components/AlertsFeed";
import { RiskTable } from "@/components/RiskTable";
import { QueryError } from "@/components/QueryError";
import { Skeleton } from "@/components/Skeleton";
import { Activity, Rat, ShieldAlert, FlaskConical } from "lucide-react";
import { useCases, useRodents } from "@/hooks/use-surveillance";
import { useNow } from "@/hooks/use-now";

export const Route = createFileRoute("/")({ component: Dashboard });

function bucketByDay(items: { date: string }[], days: number, now: number) {
  const out = new Array<number>(days).fill(0);
  for (const item of items) {
    const d = Math.floor((now - +new Date(item.date)) / 86400000);
    if (d >= 0 && d < days) out[days - 1 - d]++;
  }
  return out;
}

const CURVE_RANGES = [
  { label: "7D", days: 7 as const },
  { label: "30D", days: 30 as const },
  { label: "90D", days: 90 as const },
];

function Dashboard() {
  const {
    data: cases,
    loading: casesLoading,
    error: casesError,
    refetch: refetchCases,
  } = useCases();
  const {
    data: rodents,
    loading: rodentsLoading,
    error: rodentsError,
    refetch: refetchRodents,
  } = useRodents();
  const [curveRange, setCurveRange] = useState<7 | 30 | 90>(90);
  const loading = casesLoading || rodentsLoading;
  const now = useNow();

  const metrics = useMemo(() => {
    const inWindow = (iso: string, minDays: number, maxDays: number) => {
      const d = (now - +new Date(iso)) / 86400000;
      return d > minDays && d <= maxDays;
    };
    const delta = (curr: number, prev: number) =>
      prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 100);

    const last30Cases = cases.filter((c) => inWindow(c.date, -1, 30));
    const prior30Cases = cases.filter((c) => inWindow(c.date, 30, 60));

    const last30Rodents = rodents.filter((r) => inWindow(r.date, -1, 30));
    const prior30Rodents = rodents.filter((r) => inWindow(r.date, 30, 60));

    const confirmedCases = cases.filter((c) => c.status === "Confirmed");
    const last30Confirmed = confirmedCases.filter((c) => inWindow(c.date, -1, 30));
    const prior30Confirmed = confirmedCases.filter((c) => inWindow(c.date, 30, 60));

    const pendingCases = cases.filter((c) => c.status === "Pending");
    const last30Pending = pendingCases.filter((c) => inWindow(c.date, -1, 30));
    const prior30Pending = pendingCases.filter((c) => inWindow(c.date, 30, 60));

    const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
    const ytdConfirmed = confirmedCases.filter((c) => +new Date(c.date) >= yearStart).length;

    return {
      active: {
        value: last30Cases.length,
        delta: delta(last30Cases.length, prior30Cases.length),
        spark: bucketByDay(cases, 14, now),
      },
      rodents: {
        value: rodents.length,
        delta: delta(last30Rodents.length, prior30Rodents.length),
        spark: bucketByDay(rodents, 14, now),
      },
      ytd: {
        value: ytdConfirmed || confirmedCases.length,
        delta: delta(last30Confirmed.length, prior30Confirmed.length),
        spark: bucketByDay(confirmedCases, 14, now),
      },
      pending: {
        value: pendingCases.length,
        delta: delta(last30Pending.length, prior30Pending.length),
        spark: bucketByDay(pendingCases, 14, now),
      },
    };
  }, [cases, rodents, now]);

  const fmt = (n: number) => n.toLocaleString();

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Command Center</h1>
        <p className="text-[12.5px] text-muted-foreground mt-0.5">
          Real-time hantavirus surveillance · {cases.length} cases tracked across {rodents.length}{" "}
          sites
        </p>
      </div>

      {(casesError || rodentsError) && (
        <QueryError
          what="surveillance data"
          error={casesError ?? rodentsError}
          onRetry={() => {
            if (casesError) void refetchCases();
            if (rodentsError) void refetchRodents();
          }}
        />
      )}

      {loading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
          aria-label="Loading metrics"
        >
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[118px] w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            label="Active Human Cases"
            value={fmt(metrics.active.value)}
            delta={metrics.active.delta}
            tone="alert"
            icon={ShieldAlert}
            spark={metrics.active.spark}
          />
          <MetricCard
            label="Rodent Vector Sites"
            value={fmt(metrics.rodents.value)}
            delta={metrics.rodents.delta}
            tone="warning"
            icon={Rat}
            spark={metrics.rodents.spark}
            invertDelta
          />
          <MetricCard
            label="YTD Confirmed Cases"
            value={fmt(metrics.ytd.value)}
            delta={metrics.ytd.delta}
            tone="info"
            icon={Activity}
            spark={metrics.ytd.spark}
          />
          <MetricCard
            label="Pending Lab Results"
            value={fmt(metrics.pending.value)}
            delta={metrics.pending.delta}
            tone="success"
            icon={FlaskConical}
            spark={metrics.pending.spark}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div>
              <h2 className="text-[14px] font-semibold">Epidemic Curve</h2>
              <p className="text-[11.5px] text-muted-foreground">
                Cases / {curveRange} days · stacked by region · moving average trend
              </p>
            </div>
            <div className="flex gap-1 text-[11px]">
              {CURVE_RANGES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  aria-pressed={curveRange === t.days}
                  onClick={() => setCurveRange(t.days)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    curveRange === t.days
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <EpidemicCurve days={curveRange} />
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold">Recent Alerts</h2>
            <span className="text-[11px] text-alert font-semibold inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-alert animate-pulse" /> Live
            </span>
          </div>
          <AlertsFeed />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <div className="mb-3">
          <h2 className="text-[14px] font-semibold">Highest Risk Regions</h2>
          <p className="text-[11.5px] text-muted-foreground">
            Sorted by infection rate per 100,000 population
          </p>
        </div>
        <RiskTable />
      </div>
    </div>
  );
}
