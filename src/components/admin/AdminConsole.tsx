import { ServerCog, Database, Cpu, Lock, ShieldCheck, Zap, type LucideIcon } from "lucide-react";
import { useInfra } from "@/hooks/use-infra";
import { relativeTime, HOUR_MS } from "@/lib/time";
import { QueryError } from "@/components/QueryError";
import { Skeleton } from "@/components/Skeleton";
import { LatencyChart, LatencyChartSkeleton } from "@/components/admin/LatencyChart";
import { SourcesPanel, SourcesPanelSkeleton } from "@/components/admin/SourcesPanel";
import { LogsTerminal } from "@/components/admin/LogsTerminal";

/**
 * The full admin console. Loaded lazily by the /admin route so recharts and
 * the console panels stay out of every other route's bundle.
 */
export default function AdminConsole() {
  const { data, isPending, error, refetch } = useInfra();

  const cron = data?.cron ?? null;
  const db = data?.db ?? null;
  const sources = data?.sources ?? [];

  const lastSuccessLabel = cron?.lastSuccessAt ? relativeTime(cron.lastSuccessAt) : "—";
  const poolLabel =
    db?.poolMax != null && db.poolUsed != null ? `${db.poolUsed}/${db.poolMax}` : "n/a";
  const successAge = cron?.lastSuccessAt ? Date.now() - +new Date(cron.lastSuccessAt) : Infinity;
  const engineTone =
    cron === null ? "warn" : cron.successRate >= 95 && successAge < HOUR_MS ? "ok" : "warn";
  const cronTone = cron === null ? "warn" : cron.successRate >= 95 ? "ok" : "warn";
  const latencyTone = db === null ? "warn" : db.p95Latency <= 220 ? "ok" : "warn";
  const engineValue = engineTone === "ok" ? "Healthy" : cron === null ? "No data" : "Degraded";
  const cronValue = cron ? `${cron.successRate.toFixed(1)}%` : "—";
  const cronSub = cron
    ? `${cron.successCount} / ${cron.totalCount} jobs (24h)`
    : "No ingest runs in the last 24h";
  const engineSub = cron
    ? `Last sync ${lastSuccessLabel} · pool ${poolLabel}`
    : "Waiting for the first ingest run";

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-terminal flex items-center gap-1.5">
            <Lock className="size-3" /> Admin Console · Restricted
          </div>
          <h1 className="text-xl font-bold tracking-tight mt-0.5">System Infrastructure</h1>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">
            Observability for the VectorTrace data engine and ingest pipelines.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-success/10 border border-success/30 text-success text-[12px] font-semibold">
          <ShieldCheck className="size-3.5" /> Auth verified · admin
        </div>
      </div>

      {error ? (
        <QueryError what="infra metrics" error={error} onRetry={() => refetch()} />
      ) : isPending ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          role="status"
          aria-label="Loading infra metrics"
        >
          <span className="sr-only">Loading infra metrics…</span>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[104px] w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminCard
            icon={Database}
            label="Data Engine"
            value={engineValue}
            sub={engineSub}
            tone={engineTone}
          />
          <AdminCard
            icon={Cpu}
            label="Cron Success"
            value={cronValue}
            sub={cronSub}
            tone={cronTone}
          />
          <AdminCard
            icon={Zap}
            label="Avg Latency"
            value={db ? `${db.avgLatency}ms` : "—"}
            sub={db ? `p95 = ${db.p95Latency}ms` : "No snapshots yet"}
            tone={latencyTone}
          />
          <AdminCard
            icon={ServerCog}
            label="Active Channels"
            value={`${sources.filter((s) => s.status === "ok").length}/${sources.length}`}
            sub="healthy upstream feeds"
            tone={sources.length === 0 ? "warn" : "ok"}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {error ? (
          <div className="grid place-items-center p-8 text-[12px] text-muted-foreground">
            Latency chart unavailable.
          </div>
        ) : isPending ? (
          <LatencyChartSkeleton />
        ) : (
          <LatencyChart series={data.latencySeries} avgLatency={db?.avgLatency ?? null} />
        )}
        {error ? (
          <div className="grid place-items-center p-8 text-[12px] text-muted-foreground">
            Feed status unavailable.
          </div>
        ) : isPending ? (
          <SourcesPanelSkeleton />
        ) : (
          <SourcesPanel sources={sources} />
        )}
      </div>

      {isPending ? (
        <Skeleton className="h-80 w-full rounded-lg" />
      ) : (
        <LogsTerminal logs={data?.logs ?? []} />
      )}
    </div>
  );
}

function AdminCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  tone: "ok" | "warn";
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </div>
        <Icon className={`size-4 ${tone === "ok" ? "text-terminal-dim" : "text-warning"}`} />
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}
