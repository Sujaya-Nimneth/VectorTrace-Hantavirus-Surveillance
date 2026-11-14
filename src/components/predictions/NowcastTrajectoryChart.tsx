import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";
import { VStack } from "@astryxdesign/core/VStack";

import type { NowcastTrajectoryPoint } from "@/lib/market-prediction";

export function NowcastTrajectoryChart({
  diseaseName,
  trajectory,
  loading,
}: {
  diseaseName: string;
  trajectory: NowcastTrajectoryPoint[];
  loading: boolean;
}) {
  const displayPoints = trajectory.slice(-59); // Last 45 historical + 14 forecast days
  const firstForecastDate = displayPoints.find((p) => p.isForecast)?.date;

  return (
    <Card padding={5}>
      <VStack gap={4}>
        <HStack justify="between" align="center" gap={3} wrap="wrap">
          <VStack gap={0.5}>
            <Heading level={2}>Outbreak Nowcast &amp; Pharma Lead Signal</Heading>
            <Text type="supporting">
              Observed {diseaseName} notifications vs 14-day forecast fan &amp; equity anomaly index
            </Text>
          </VStack>
          <Token size="sm" color="orange" label="14D Horizon · 80% CI" />
        </HStack>

        {loading ? (
          <Skeleton width="100%" height={320} radius={2} />
        ) : (
          <VStack width="100%" height={320}>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart
                data={displayPoints}
                margin={{ top: 8, right: 8, left: -14, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  minTickGap={24}
                  tickFormatter={(v: string) => v.slice(5)}
                  tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--color-border)" }}
                />
                <YAxis
                  yAxisId="cases"
                  allowDecimals={false}
                  tickCount={5}
                  tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="signal"
                  orientation="right"
                  tickCount={4}
                  tick={{ fontSize: 11, fill: "var(--color-data-teal-4)" }}
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
                />
                <Legend
                  wrapperStyle={{
                    fontSize: "12px",
                    paddingTop: "8px",
                    color: "var(--color-text-secondary)",
                  }}
                />
                {firstForecastDate && (
                  <ReferenceLine
                    yAxisId="cases"
                    x={firstForecastDate}
                    stroke="var(--color-border)"
                    strokeDasharray="4 4"
                    label={{
                      value: "Forecast",
                      position: "insideTopLeft",
                      fill: "var(--color-text-secondary)",
                      fontSize: 11,
                    }}
                  />
                )}
                <Area
                  yAxisId="cases"
                  type="monotone"
                  dataKey="upper80"
                  name="80% Upper Bound"
                  stroke="none"
                  fill="var(--color-data-orange-4)"
                  fillOpacity={0.18}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="cases"
                  type="monotone"
                  dataKey="lower80"
                  name="80% Lower Bound"
                  stroke="var(--color-data-orange-4)"
                  strokeOpacity={0.45}
                  strokeDasharray="2 3"
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="cases"
                  type="linear"
                  dataKey="actual"
                  name="Observed Cases"
                  stroke="var(--color-data-blue-4)"
                  strokeWidth={2.2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="cases"
                  type="monotone"
                  dataKey="predicted"
                  name="Predicted Cases"
                  stroke="var(--color-data-orange-4)"
                  strokeWidth={2.2}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="signal"
                  type="monotone"
                  dataKey="pharmaSignal"
                  name="Pharma Anomaly (σ)"
                  stroke="var(--color-data-teal-4)"
                  strokeWidth={1.6}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </VStack>
        )}
      </VStack>
    </Card>
  );
}
