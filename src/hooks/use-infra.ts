import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { formatClock } from "@/lib/time";

type IngestRun = Tables<"infra_ingest_runs">;
type ApiUptime = Tables<"infra_api_uptime">;
type DbMetricRow = Tables<"infra_db_metrics">;

export type SourceStatus = {
  src: string;
  status: "ok" | "warn" | "down";
  lastCheckedAt: string | null;
  latencyMs: number | null;
  recordsIngested: number | null;
};

export type LogEntry = {
  ts: string;
  lvl: "OK" | "WARN" | "ERR";
  msg: string;
};

export type InfraSnapshot = {
  cron: {
    successRate: number;
    successCount: number;
    totalCount: number;
    lastSuccessAt: string | null;
    lastRunAt: string | null;
    lastRunFailed: boolean;
  } | null;
  sources: SourceStatus[];
  latencySeries: { t: string; ms: number }[];
  db: {
    avgLatency: number;
    p95Latency: number;
    poolUsed: number | null;
    poolMax: number | null;
    poolSource: string;
    lastCheckedAt: string | null;
  } | null;
  logs: LogEntry[];
};

async function fetchInfra(): Promise<InfraSnapshot> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [runsRes, apiRes, dbRes] = await Promise.all([
    supabase
      .from("infra_ingest_runs")
      .select("source,status,started_at,finished_at,records_ingested,error_message")
      .gte("started_at", since)
      .order("started_at", { ascending: false })
      .limit(200),
    supabase
      .from("infra_api_uptime")
      .select("service,status,latency_ms,checked_at,error_message")
      .order("checked_at", { ascending: false })
      .limit(200),
    supabase
      .from("infra_db_metrics")
      .select("latency_ms,pool_used,pool_max,source,checked_at")
      .order("checked_at", { ascending: false })
      .limit(40),
  ]);

  const runsError = runsRes.error ?? apiRes.error ?? dbRes.error;
  if (runsError) throw new Error(`Failed to load infra metrics: ${runsError.message}`);

  const runs = (runsRes.data ?? []) as IngestRun[];
  const apiRows = (apiRes.data ?? []) as ApiUptime[];
  const dbRows = (dbRes.data ?? []) as DbMetricRow[];

  const logs: LogEntry[] = [];

  let cron: InfraSnapshot["cron"] = null;
  if (runs.length) {
    const successRuns = runs.filter((r) => r.status === "success");
    const total = runs.length;
    const success = successRuns.length;
    cron = {
      successRate: total ? Math.round((success / total) * 1000) / 10 : 0,
      successCount: success,
      totalCount: total,
      lastSuccessAt: successRuns[0]?.started_at ?? null,
      lastRunAt: runs[0].started_at,
      lastRunFailed: runs[0].status === "failed",
    };
    for (const r of runs.slice(0, 6)) {
      logs.push({
        ts: formatClock(r.started_at),
        lvl: r.status === "failed" ? "ERR" : "OK",
        msg:
          r.status === "failed"
            ? `${r.source} ingest failed · ${r.error_message ?? "unknown error"}`
            : `${r.source} sync complete · +${r.records_ingested ?? 0} records`,
      });
    }
  }

  // Sources = ingest feeds (with their latest run) + probed API services.
  const sources: SourceStatus[] = [];
  const seenSource = new Set<string>();
  for (const r of runs) {
    if (seenSource.has(r.source)) continue;
    seenSource.add(r.source);
    const lastSuccess = runs.find((x) => x.source === r.source && x.status === "success");
    sources.push({
      src: r.source,
      status: r.status === "failed" ? "warn" : "ok",
      lastCheckedAt: r.started_at,
      latencyMs: null,
      recordsIngested: lastSuccess?.records_ingested ?? null,
    });
  }
  const latestProbe = new Map<string, ApiUptime>();
  for (const row of apiRows) {
    if (!latestProbe.has(row.service)) latestProbe.set(row.service, row);
  }
  for (const row of latestProbe.values()) {
    if (seenSource.has(row.service)) continue;
    sources.push({
      src: row.service,
      status: row.status,
      lastCheckedAt: row.checked_at,
      latencyMs: row.latency_ms,
      recordsIngested: null,
    });
  }
  for (const row of apiRows.slice(0, 6)) {
    logs.push({
      ts: formatClock(row.checked_at),
      lvl: row.status === "down" ? "ERR" : row.status === "warn" ? "WARN" : "OK",
      msg: `healthcheck · ${row.service} status=${row.status.toUpperCase()} latency=${row.latency_ms ?? "n/a"}ms`,
    });
  }

  let db: InfraSnapshot["db"] = null;
  let latencySeries: InfraSnapshot["latencySeries"] = [];
  if (dbRows.length) {
    const values = dbRows.map((r) => r.latency_ms).sort((a, b) => a - b);
    const avg = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
    const p95Index = Math.max(0, Math.floor(values.length * 0.95) - 1);
    const latest = dbRows[0];

    db = {
      avgLatency: avg,
      p95Latency: values[p95Index],
      poolUsed: latest.pool_used,
      poolMax: latest.pool_max,
      poolSource: latest.source,
      lastCheckedAt: latest.checked_at,
    };

    // Label each point with its actual clock time: rows arrive every 5
    // minutes, so synthetic "-Nm" labels understate elapsed time 5x.
    latencySeries = dbRows
      .slice()
      .reverse()
      .map((r) => ({
        t: formatClock(r.checked_at),
        ms: r.latency_ms,
      }));

    for (const r of dbRows.slice(0, 4)) {
      const pool =
        r.source === "pg_stat_activity" && r.pool_used != null && r.pool_max != null
          ? `${r.pool_used}/${r.pool_max}`
          : "n/a";
      logs.push({
        ts: formatClock(r.checked_at),
        lvl: r.latency_ms > 250 ? "WARN" : "OK",
        msg: `db.metrics · latency=${r.latency_ms}ms pool=${pool}`,
      });
    }
  }

  return { cron, sources, latencySeries, db, logs };
}

/**
 * Live observability snapshot for the admin console.
 * Polls every 30s via React Query (paused while the tab is hidden).
 */
export function useInfra() {
  return useQuery({
    queryKey: ["infra_snapshot"],
    queryFn: fetchInfra,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
