import { createFileRoute } from "@tanstack/react-router";
import { MetricCard } from "@/components/MetricCard";
import { EpidemicCurve } from "@/components/EpidemicCurve";
import { AlertsFeed } from "@/components/AlertsFeed";
import { RiskTable } from "@/components/RiskTable";
import { Activity, Rat, ShieldAlert, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Command Center</h1>
        <p className="text-[12.5px] text-muted-foreground mt-0.5">Real-time hantavirus surveillance · last refreshed 14s ago</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="Active Human Cases" value="247" delta={12} tone="alert" icon={ShieldAlert}
          spark={[20, 22, 19, 24, 28, 26, 31, 35, 33, 38, 42, 47]} />
        <MetricCard label="Rodent Vector Sites" value="54" delta={8} tone="warning" icon={Rat}
          spark={[8, 10, 9, 11, 14, 12, 15, 18, 17, 20, 22, 24]} />
        <MetricCard label="YTD Confirmed Cases" value="1,189" delta={-3} tone="info" icon={Activity}
          spark={[60, 80, 75, 92, 88, 105, 100, 118, 120, 130, 138, 142]} />
        <MetricCard label="Pending Lab Results" value="38" delta={-15} tone="success" icon={FlaskConical}
          spark={[55, 52, 48, 50, 44, 41, 45, 39, 38, 36, 34, 38]} />
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
