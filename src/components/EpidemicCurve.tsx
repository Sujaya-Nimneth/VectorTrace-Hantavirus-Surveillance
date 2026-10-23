import { useMemo } from "react";
import {
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useCases } from "@/hooks/use-surveillance";
import { REGIONS } from "@/lib/mock-data";
import { QueryError } from "./QueryError";
import { Skeleton } from "./Skeleton";

type BucketRow = {
  date: string;
  trend?: number;
  [region: string]: string | number | undefined;
};

export function EpidemicCurve({ days = 90 }: { days?: 7 | 30 | 90 }) {
  const { data: CASES, loading, error, refetch } = useCases();

  const data = useMemo(() => {
    const step = days === 90 ? 3 : 1;
    const maxOffset = days - 1;
    const buckets: Record<string, BucketRow> = {};
    const now = new Date();

    for (let i = maxOffset; i >= 0; i -= step) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      const row: BucketRow = { date: key };
      for (const r of REGIONS) {
        row[r.name] = 0;
      }
      buckets[key] = row;
    }

    for (const c of CASES) {
      const cd = new Date(c.date);
      const ageDays = Math.floor((+now - +cd) / 86400000);
      if (ageDays < 0 || ageDays > maxOffset) continue;
      const bucketOffset = Math.floor(ageDays / step) * step;
      const d = new Date(now);
      d.setDate(d.getDate() - bucketOffset);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      const row = buckets[key];
      if (row) {
        row[c.region] = Number(row[c.region] || 0) + 1;
      }
    }

    const arr = Object.values(buckets);
    arr.forEach((row, idx) => {
      const slice = arr.slice(Math.max(0, idx - 2), idx + 1);
      const avg =
        slice.reduce(
          (sum, r) => sum + REGIONS.reduce((acc, reg) => acc + Number(r[reg.name] || 0), 0),
          0,
        ) / slice.length;
      row.trend = +avg.toFixed(1);
    });
    return arr;
  }, [CASES, days]);

  const palette = [
    "var(--chart-3)",
    "var(--chart-2)",
    "var(--chart-1)",
    "var(--chart-4)",
    "var(--chart-5)",
    "var(--primary)",
  ];

  const xAxisInterval = days === 7 ? 0 : 3;

  if (error) {
    return (
      <div className="h-[300px] grid place-items-center px-4">
        <div className="w-full max-w-md">
          <QueryError what="epidemic curve" error={error} onRetry={() => refetch()} />
        </div>
      </div>
    );
  }

  if (loading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -20 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          interval={xAxisInterval}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={8} />
        {REGIONS.map((r, i) => (
          <Bar key={r.name} dataKey={r.name} stackId="a" fill={palette[i]} />
        ))}
        <Line
          type="monotone"
          dataKey="trend"
          stroke="var(--alert)"
          strokeWidth={2}
          dot={false}
          name="Moving avg"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
