import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { VStack } from "@astryxdesign/core/VStack";
import { useCases } from "@/hooks/use-surveillance";
import { REGIONS } from "@/lib/mock-data";
import { buildEpidemicCurveBuckets } from "@/lib/epi-curve";
import { QueryError } from "./QueryError";

const REGION_STROKES = [
  "var(--color-data-blue-4)",
  "var(--color-data-teal-4)",
  "var(--color-data-orange-4)",
  "var(--color-data-purple-4)",
  "var(--color-data-green-4)",
  "var(--color-data-red-4)",
];

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

  if (error) {
    return <QueryError what="epidemic curve" error={error} onRetry={() => refetch()} />;
  }

  if (loading) {
    return <Skeleton width="100%" height={300} radius={2} />;
  }

  return (
    <VStack width="100%" height={300}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 4 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border-primary)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-border-primary)" }}
          />
          <YAxis
            allowDecimals={false}
            tickCount={4}
            tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-background-card)",
              borderColor: "var(--color-border-primary)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text-primary)",
              fontSize: "12px",
            }}
            itemStyle={{ paddingTop: 2, paddingBottom: 2 }}
          />
          <Legend
            wrapperStyle={{
              fontSize: "12px",
              paddingTop: "8px",
              color: "var(--color-text-secondary)",
            }}
          />
          {REGIONS.map((region, idx) => (
            <Line
              key={region.name}
              type="linear"
              dataKey={region.name}
              stroke={REGION_STROKES[idx % REGION_STROKES.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </VStack>
  );
}
