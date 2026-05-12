import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { MetricCard } from "@/components/MetricCard";
import { EpidemicCurve } from "@/components/EpidemicCurve";
import { AlertsFeed } from "@/components/AlertsFeed";
import { RiskTable } from "@/components/RiskTable";
import { Activity, Rat, ShieldAlert, FlaskConical } from "lucide-react";
import { useCases, useRodents } from "@/hooks/use-surveillance";

export const Route = createFileRoute("/")({ component: Dashboard });

function bucketByDay(cases: { date: string }[], days: number) {
  const out = new Array(days).fill(0);
  const now = Date.now();
  for (const c of cases) {
    const d = Math.floor((now - +new Date(c.date)) / 86400000);
    if (d >= 0 && d < days) out[days - 1 - d]++;
  }
  return out;
}

function Dashboard() {
  const { data: cases } = useCases();
  const rodents = useRodents();

  const metrics = useMemo(() => {
    const now = Date.now();
    const last30 = cases.filter(c => (now - +new Date(c.date)) / 86400000 <= 30);
    const prior30 = cases.filter(c => {
      const d = (now - +new Date(c.date)) / 86400000;
      return d > 30 && d <= 60;
    });
    const active = last30.filter(c => c.status !== "Confirmed").length + last30.filter(c => c.status === "Confirmed").length;
    const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
    const ytdConfirmed = cases.filter(c => c.status === "Confirmed" && +new Date(c.date) >= yearStart).length;
    const pending = cases.filter(c => c.status === "Pending").length;
    const delta = (a: number, b: number) => b === 0 ? 0 : Math.round(((a - b) / b) * 100);

    return {
      active: { value: active, delta: delta(last30.length, prior30.length), spark: bucketByDay(cases, 14) },
      rodents: { value: rodents.length, spark: bucketByDay(rodents, 14) },
      ytd: { value: ytdConfirmed, spark: bucketByDay(cases.filter(c => c.status === "Confirmed"), 14) },
      pending: { value: pending, spark: bucketByDay(cases.filter(c => c.status === "Pending"), 14) },
    };
  }, [cases, rodents]);

  const fmt = (n: number) => n.toLocaleString();

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Command Center</h1>
        <p className="text-[12.5px] text-muted-foreground mt-0.5">
          Real-time hantavirus surveillance · {cases.length} cases tracked across {rodents.length} sites
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="Active Human Cases" value={fmt(metrics.active.value)} delta={metrics.active.delta} tone="alert" icon={ShieldAlert}
          spark={metrics.active.spark} />
        <MetricCard label="Rodent Vector Sites" value={fmt(metrics.rodents.value)} delta={8} tone="warning" icon={Rat}
          spark={metrics.rodents.spark} />
        <MetricCard label="YTD Confirmed Cases" value={fmt(metrics.ytd.value)} delta={-3} tone="info" icon={Activity}
          spark={metrics.ytd.spark} />
        <MetricCard label="Pending Lab Results" value={fmt(metrics.pending.value)} delta={-15} tone="success" icon={FlaskConical}
          spark={metrics.pending.spark} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[14px] font-semibold">Epidemic Curve</h2>
              <p className="text-[11.5px] text-muted-foreground">Cases / 90 days · stacked by region · 7-day trend</p>
            </div>
            <div className="flex gap-1 text-[11px]">
              {["7D", "30D", "90D"].map(t => (
                <button key={t} className={`px-2 py-1 rounded font-medium ${t === "90D" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{t}</button>
              ))}
            </div>
          </div>
          <EpidemicCurve />
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
          <p className="text-[11.5px] text-muted-foreground">Sorted by infection rate per 100,000 population</p>
        </div>
        <RiskTable />
      </div>
    </div>
  );
}
