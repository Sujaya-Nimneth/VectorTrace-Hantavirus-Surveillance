import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ServerCog, Database, Cpu, Lock, ShieldCheck, Zap, Terminal } from "lucide-react";

export const Route = createFileRoute("/_admin/admin")({
  component: Admin,
  head: () => ({ meta: [{ title: "System Infrastructure · VectorTrace" }] }),
});

const LATENCY = Array.from({ length: 40 }, (_, i) => ({
  t: `-${40 - i}m`,
  ms: 80 + Math.round(Math.sin(i / 3) * 30 + Math.random() * 25 + 60),
}));

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

function Admin() {
  const [logs, setLogs] = useState(INITIAL_LOGS);

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
        <AdminCard icon={Database} label="Data Engine" value="Healthy" sub="Last sync 4m ago" tone="ok" />
        <AdminCard icon={Cpu} label="Cron Success" value="98.2%" sub="487 / 496 jobs (24h)" tone="ok" />
        <AdminCard icon={Zap} label="Avg Latency" value="124ms" sub="p95 = 218ms" tone="warn" />
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
            <div className="text-[11px] text-muted-foreground">avg <span className="text-foreground font-semibold">124ms</span></div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={LATENCY} margin={{ top: 6, right: 8, bottom: 0, left: -22 }}>
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
            {[
              { src: "WHO Disease Outbreak News", last: "4m ago", status: "ok", recs: "+3 records" },
              { src: "PAHO Hantavirus Updates", last: "12m ago", status: "ok", recs: "+1 record" },
              { src: "MinSal Argentina · BoEpi", last: "1h ago", status: "ok", recs: "+8 records" },
              { src: "ECDC Communicable Disease", last: "2h ago", status: "warn", recs: "rate-limited" },
              { src: "ProMED Mail · Hantavirus", last: "3h ago", status: "ok", recs: "+0 records" },
            ].map(s => (
              <div key={s.src} className="flex items-center gap-3 text-[12px]">
                <div className={`size-2 rounded-full ${s.status === "ok" ? "bg-success" : "bg-warning"}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{s.src}</div>
                  <div className="text-[10.5px] text-muted-foreground">Last sync {s.last}</div>
                </div>
                <div className={`text-[11px] font-semibold ${s.status === "ok" ? "text-muted-foreground" : "text-warning"}`}>{s.recs}</div>
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
