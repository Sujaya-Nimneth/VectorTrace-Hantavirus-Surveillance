import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Skeleton } from "@/components/Skeleton";

export function LatencyChart({
  series,
  avgLatency,
}: {
  series: { t: string; ms: number }[];
  avgLatency: number | null;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-[14px] font-semibold">API Latency</h2>
          <p className="text-[11.5px] text-muted-foreground">
            Database response time · last checks
          </p>
        </div>
        <div className="text-[11px] text-muted-foreground">
          avg <span className="text-foreground font-semibold">{avgLatency ?? "—"}ms</span>
        </div>
      </div>
      {series.length === 0 ? (
        <div className="h-[220px] grid place-items-center text-[12px] text-muted-foreground">
          No latency snapshots recorded yet. The infra-health-check function hasn&apos;t run.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={series} margin={{ top: 6, right: 8, bottom: 0, left: -22 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="t"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              interval={6}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                fontSize: 12,
                borderRadius: 6,
              }}
            />
            <Line
              type="monotone"
              dataKey="ms"
              stroke="var(--terminal)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function LatencyChartSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-[220px] w-full" />
    </div>
  );
}
