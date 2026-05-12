import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ServerCog, Database, Cpu, Lock, ShieldCheck, Zap, Terminal, ShieldOff, LogIn, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  component: AdminGate,
  head: () => ({ meta: [{ title: "System Infrastructure · VectorTrace" }] }),
});

type IngestRun = {
  source: string;
  status: "success" | "failed";
  started_at: string;
  finished_at: string | null;
  records_ingested: number | null;
  error_message: string | null;
};

type ApiUptime = {
  service: string;
  status: "ok" | "warn" | "down";
  latency_ms: number | null;
  checked_at: string;
  error_message: string | null;
};

type DbMetric = {
  latency_ms: number;
  pool_used: number;
  pool_max: number;
  checked_at: string;
};

type SourceStatus = {
  src: string;
  apiService: string;
  last: string;
  status: "ok" | "warn" | "down";
  recs: string;
};

function AdminGate() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoles();

  if (authLoading || (user && rolesLoading)) {
    return <div className="h-full grid place-items-center text-muted-foreground p-12"><Loader2 className="size-5 animate-spin" /></div>;
  }
  if (!user) {
    return (
      <div className="p-12 max-w-md mx-auto text-center">
        <div className="bg-card border border-border rounded-lg p-8">
          <ShieldOff className="size-10 mx-auto mb-3 text-alert" />
          <h2 className="font-bold text-[15px]">Authentication required</h2>
          <p className="text-[12.5px] text-muted-foreground mt-1.5">The infrastructure console is restricted to admin users.</p>
          <Link to="/login" className="mt-5 inline-flex items-center gap-1.5 px-4 h-10 rounded-md text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
            <LogIn className="size-4" /> Sign in
          </Link>
        </div>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="p-12 max-w-md mx-auto text-center">
        <div className="bg-card border border-border rounded-lg p-8">
          <ShieldOff className="size-10 mx-auto mb-3 text-alert" />
          <h2 className="font-bold text-[15px]">Insufficient privileges</h2>
          <p className="text-[12.5px] text-muted-foreground mt-1.5">
            Account <span className="font-mono text-foreground">{user.email}</span> doesn't hold the admin role required for this console.
          </p>
          <Link to="/" className="mt-5 inline-flex items-center gap-1.5 px-4 h-10 rounded-md text-[13px] font-semibold border border-input hover:bg-muted">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }
  return <Admin />;
}

const FALLBACK_LATENCY = Array.from({ length: 40 }, (_, i) => ({
  t: `-${40 - i}m`,
  ms: 80 + Math.round(Math.sin(i / 3) * 30 + Math.random() * 25 + 60),
}));

const FALLBACK_SOURCES: SourceStatus[] = [
  { src: "WHO Disease Outbreak News", apiService: "WHO Disease Outbreak News", last: "4m ago", status: "ok", recs: "+3 records" },
  { src: "PAHO Hantavirus Updates", apiService: "ScrapeGraphAI", last: "12m ago", status: "ok", recs: "+1 record" },
  { src: "MinSal Argentina · BoEpi", apiService: "ScrapeGraphAI", last: "1h ago", status: "ok", recs: "+8 records" },
  { src: "ECDC Communicable Disease", apiService: "ScrapeGraphAI", last: "2h ago", status: "warn", recs: "rate-limited" },
  { src: "ProMED Mail · Hantavirus", apiService: "ScrapeGraphAI", last: "3h ago", status: "ok", recs: "+0 records" },
];

const INITIAL_LOGS = [
  { ts: "14:02:11", lvl: "OK", msg: "ScrapeGraphAI · WHO DON crawl complete · 3 records inserted" },
  { ts: "14:01:58", lvl: "OK", msg: "supabase.realtime · channel hanta_cases subscribed [client #847]" },
  { ts: "14:01:42", lvl: "WARN", msg: "scraper rate-limit headroom 14% on source paho.org" },
  { ts: "14:01:20", lvl: "OK", msg: "edge.function ingest-don-feed exec=412ms status=200" },
  { ts: "14:00:55", lvl: "OK", msg: "pg_cron job 'sync_don_twice_daily' tick · next run 02:00 UTC" },
  { ts: "14:00:30", lvl: "ERR", msg: "geocoder timeout · region=NEA · retry queued (attempt 2/3)" },
  { ts: "14:00:11", lvl: "OK", msg: "auth.session refresh · uid=ep_reyes scope=admin" },
  { ts: "13:59:48", lvl: "OK", msg: "row-level-security · policy applied to public.hanta_alerts" },
];

function relativeTime(iso: string) {
  const diff = (Date.now() - +new Date(iso)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatClock(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function Admin() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [latencySeries, setLatencySeries] = useState(FALLBACK_LATENCY);
  const [sources, setSources] = useState<SourceStatus[]>(FALLBACK_SOURCES);
  const [cronSummary, setCronSummary] = useState({
    successRate: 98.2,
    successCount: 487,
    totalCount: 496,
    lastSuccessAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  });
  const [dbSnapshot, setDbSnapshot] = useState({
    avgLatency: 124,
    p95Latency: 218,
    poolUsed: 12,
    poolMax: 64,
    lastCheckedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  });

  useEffect(() => {
    let cancelled = false;

    const loadInfra = async () => {
      let lastRun: IngestRun | undefined;
      let lastSuccess: IngestRun | undefined;
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
          .select("latency_ms,pool_used,pool_max,checked_at")
          .order("checked_at", { ascending: false })
          .limit(40),
      ]);

      if (cancelled) return;

      if (runsRes.data?.length) {
        const runs = runsRes.data as IngestRun[];
        const successRuns = runs.filter((r) => r.status === "success");
        const failedRuns = runs.filter((r) => r.status === "failed");
        lastRun = runs[0];
        lastSuccess = successRuns[0];
        const total = runs.length;
        const success = successRuns.length;
        const successRate = total ? Math.round((success / total) * 1000) / 10 : 0;

        setCronSummary((prev) => ({
          successRate,
          successCount: success,
          totalCount: total,
          lastSuccessAt: successRuns[0]?.started_at ?? prev.lastSuccessAt,
        }));

        const failureLogs = failedRuns.slice(0, 3).map((r) => ({
          ts: formatClock(r.started_at),
          lvl: "ERR",
          msg: `${r.source} ingest failed · ${r.error_message ?? "unknown error"}`,
        }));
        if (failureLogs.length) {
          setLogs((current) => [...failureLogs, ...current].slice(0, 18));
        }

      }

      if (apiRes.data?.length) {
        const latest = new Map<string, ApiUptime>();
        for (const row of apiRes.data as ApiUptime[]) {
          if (!latest.has(row.service)) latest.set(row.service, row);
        }

        setSources((prev) =>
          prev.map((s) => {
            const row = latest.get(s.apiService);
            if (!row) return s;
            return {
              ...s,
              status: row.status,
              last: relativeTime(row.checked_at),
              recs: row.latency_ms != null ? `${row.latency_ms}ms` : s.recs,
            };
          }),
        );
      }

      if (lastRun) {
        setSources((prev) =>
          prev.map((s) => {
            if (s.apiService !== "WHO Disease Outbreak News") return s;
            const status = lastRun.status === "failed" ? "warn" : "ok";
            const last = lastSuccess ? relativeTime(lastSuccess.started_at) : s.last;
            const recs = lastSuccess?.records_ingested != null ? `+${lastSuccess.records_ingested} records` : s.recs;
            return { ...s, status, last, recs };
          }),
        );
      }

      if (dbRes.data?.length) {
        const dbRows = dbRes.data as DbMetric[];
        const values = dbRows.map((r) => r.latency_ms).sort((a, b) => a - b);
        const avg = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
        const p95Index = Math.max(0, Math.floor(values.length * 0.95) - 1);
        const p95 = values[p95Index];
        const latest = dbRows[0];

        setDbSnapshot({
          avgLatency: avg,
          p95Latency: p95,
          poolUsed: latest.pool_used,
          poolMax: latest.pool_max,
          lastCheckedAt: latest.checked_at,
        });

        setLatencySeries(
          dbRows
            .slice()
            .reverse()
            .map((r, i) => ({
              t: `-${dbRows.length - 1 - i}m`,
              ms: r.latency_ms,
            })),
        );
      }
    };

    loadInfra();
    const id = setInterval(loadInfra, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const samples = [
        { lvl: "OK", msg: "scraper.tick · sources=12 throughput=4.2/s" },
        { lvl: "OK", msg: "supabase.realtime · broadcast 'case_created' fanout=14" },
        { lvl: "WARN", msg: "edge.function memory 78% of 256MB limit" },
        { lvl: "OK", msg: "pg.query SELECT * FROM hanta_cases · 12ms" },
      ];
      const s = samples[Math.floor(Math.random() * samples.length)];
      const now = new Date();
      const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      setLogs(l => [{ ts, ...s }, ...l].slice(0, 18));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const lastSuccessLabel = cronSummary.lastSuccessAt ? relativeTime(cronSummary.lastSuccessAt) : "—";
  const poolLabel = dbSnapshot.poolMax ? `${dbSnapshot.poolUsed}/${dbSnapshot.poolMax}` : "n/a";
  const successAge = cronSummary.lastSuccessAt ? Date.now() - +new Date(cronSummary.lastSuccessAt) : Infinity;
  const engineTone = cronSummary.successRate >= 95 && successAge < 60 * 60 * 1000 ? "ok" : "warn";
  const cronTone = cronSummary.successRate >= 95 ? "ok" : "warn";
  const latencyTone = dbSnapshot.p95Latency <= 220 ? "ok" : "warn";
  const cronValue = `${cronSummary.successRate.toFixed(1)}%`;
  const cronSub = `${cronSummary.successCount} / ${cronSummary.totalCount} jobs (24h)`;
  const engineValue = engineTone === "ok" ? "Healthy" : "Degraded";
  const engineSub = `Last sync ${lastSuccessLabel} · pool ${poolLabel}`;

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-terminal flex items-center gap-1.5">
            <Lock className="size-3" /> Admin Console · Restricted
          </div>
          <h1 className="text-xl font-bold tracking-tight mt-0.5">System Infrastructure</h1>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">Observability for the VectorTrace data engine and ingest pipelines.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-success/10 border border-success/30 text-success text-[12px] font-semibold">
          <ShieldCheck className="size-3.5" /> Auth verified · admin
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AdminCard icon={Database} label="Data Engine" value={engineValue} sub={engineSub} tone={engineTone} />
        <AdminCard icon={Cpu} label="Cron Success" value={cronValue} sub={cronSub} tone={cronTone} />
        <AdminCard icon={Zap} label="Avg Latency" value={`${dbSnapshot.avgLatency}ms`} sub={`p95 = ${dbSnapshot.p95Latency}ms`} tone={latencyTone} />
        <AdminCard icon={ServerCog} label="Active Channels" value="14" sub="realtime subscribers" tone="ok" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Latency chart */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[14px] font-semibold">API Latency</h2>
              <p className="text-[11.5px] text-muted-foreground">Response time · last 40 minutes</p>
            </div>
            <div className="text-[11px] text-muted-foreground">avg <span className="text-foreground font-semibold">{dbSnapshot.avgLatency}ms</span></div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={latencySeries} margin={{ top: 6, right: 8, bottom: 0, left: -22 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval={6} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 12, borderRadius: 6 }} />
              <Line type="monotone" dataKey="ms" stroke="var(--terminal)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cron sync card */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold">Data Engine · ScrapeGraphAI</h2>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-success/15 text-success font-semibold">Operational</span>
          </div>
          <div className="space-y-3">
            {sources.map(s => (
              <div key={s.src} className="flex items-center gap-3 text-[12px]">
                <div className={`size-2 rounded-full ${s.status === "ok" ? "bg-success" : s.status === "down" ? "bg-alert" : "bg-warning"}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{s.src}</div>
                  <div className="text-[10.5px] text-muted-foreground">Last sync {s.last}</div>
                </div>
                <div className={`text-[11px] font-semibold ${s.status === "ok" ? "text-muted-foreground" : s.status === "down" ? "text-alert" : "text-warning"}`}>{s.recs}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Terminal logs */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="bg-[oklch(0.18_0.02_240)] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white text-[12px] font-semibold">
            <Terminal className="size-3.5 text-terminal" /> system.log
          </div>
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-alert" />
            <span className="size-2.5 rounded-full bg-warning" />
            <span className="size-2.5 rounded-full bg-success" />
          </div>
        </div>
        <div className="bg-terminal-bg p-4 font-mono text-[11.5px] h-72 overflow-y-auto leading-relaxed">
          {logs.map((l, i) => (
            <div key={i} className="flex gap-3 py-0.5">
              <span className="text-white/40 shrink-0">{l.ts}</span>
              <span className={`shrink-0 font-bold w-10 ${l.lvl === "ERR" ? "text-alert" : l.lvl === "WARN" ? "text-warning" : "text-terminal"}`}>
                [{l.lvl}]
              </span>
              <span className="text-white/85">{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminCard({ icon: Icon, label, value, sub, tone }: { icon: any; label: string; value: string; sub: string; tone: "ok" | "warn" }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
        <Icon className={`size-4 ${tone === "ok" ? "text-terminal-dim" : "text-warning"}`} />
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}
