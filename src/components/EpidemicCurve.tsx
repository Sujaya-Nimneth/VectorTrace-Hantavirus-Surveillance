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
import { buildEpidemicCurveBuckets } from "@/lib/epi-curve";
import { QueryError } from "./QueryError";
import { Skeleton } from "./Skeleton";

export function EpidemicCurve({ days = 90 }: { days?: 7 | 30 | 90 }) {
  const { data: CASES, loading, error, refetch } = useCases();

  const data = useMemo(
    () =>
      buildEpidemicCurveBuckets(
        CASES,
        days,
        REGIONS.map((r) => r.name),
      ),
    [CASES, days],
  );

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
