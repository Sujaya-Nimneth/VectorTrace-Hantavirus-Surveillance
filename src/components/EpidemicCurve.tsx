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
import { useDiseaseFilter } from "@/hooks/use-disease-filter";
import { DISEASES, getDiseaseProfile } from "@/lib/diseases";
import { REGIONS } from "@/lib/mock-data";
import { buildEpidemicCurveBuckets, buildPathogenCurveBuckets } from "@/lib/epi-curve";
import { QueryError } from "./QueryError";

const REGION_STROKES = [
  "var(--color-data-blue-4)",
  "var(--color-data-teal-4)",
  "var(--color-data-orange-4)",
  "var(--color-data-purple-4)",
  "var(--color-data-shamrock-4)",
  "var(--color-data-red-4)",
];

export function EpidemicCurve({
  days = 90,
  groupBy = "region",
}: {
  days?: 7 | 30 | 90;
  groupBy?: "region" | "pathogen";
}) {
  const { disease } = useDiseaseFilter();
  const { data: CASES, loading, error, refetch } = useCases(disease);

  const activeDiseases = useMemo(
    () => (disease === "all" ? DISEASES : [getDiseaseProfile(disease)]),
    [disease],
  );

  const data = useMemo(
    () =>
      groupBy === "pathogen"
        ? buildPathogenCurveBuckets(
            CASES,
            days,
            activeDiseases.map((d) => d.slug),
          )
        : buildEpidemicCurveBuckets(
            CASES,
            days,
            REGIONS.map((r) => r.name),
          ),
    [CASES, days, groupBy, activeDiseases],
  );

  if (error) {
    return <QueryError what="epidemic curve" error={error} onRetry={() => refetch()} />;
  }

  if (loading) {
    return <Skeleton width="100%" height={360} radius={2} />;
  }

  return (
    <VStack width="100%" height={360}>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="date"
            minTickGap={24}
            tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-border)" }}
          />
          <YAxis
            allowDecimals={false}
            tickCount={4}
            tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-background-card)",
              borderColor: "var(--color-border)",
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
          {groupBy === "pathogen"
            ? activeDiseases.map((profile) => (
                <Line
                  key={profile.slug}
                  type="linear"
                  dataKey={profile.slug}
                  name={profile.shortName}
                  stroke={profile.chartColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              ))
            : REGIONS.map((region, idx) => (
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
