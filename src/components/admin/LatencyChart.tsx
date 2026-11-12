import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

export function LatencyChart({
  series,
  avgLatency,
}: {
  series: { t: string; ms: number }[];
  avgLatency: number | null;
}) {
  return (
    <Card padding={5}>
      <VStack gap={4}>
        <HStack justify="between" align="center" gap={2} wrap="wrap">
          <VStack gap={0.5}>
            <Heading level={2}>Database Query Latency</Heading>
            <Text type="supporting" size="xsm">
              Observed probe timings vs 220ms SLO threshold
            </Text>
          </VStack>
          <Text type="supporting" size="xsm" weight="medium" hasTabularNumbers>
            {avgLatency != null ? `Mean ${avgLatency}ms` : "No samples"}
          </Text>
        </HStack>

        {series.length === 0 ? (
          <EmptyState
            isCompact
            title="No latency telemetry"
            description="Waiting for the next scheduled infrastructure probe."
          />
        ) : (
          <VStack width="100%" height={220}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={series} margin={{ top: 8, right: 12, left: -16, bottom: 4 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border-primary)"
                  vertical={false}
                />
                <XAxis
                  dataKey="t"
                  tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--color-border-primary)" }}
                />
                <YAxis
                  unit="ms"
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
                />
                <ReferenceLine
                  y={220}
                  stroke="var(--color-data-orange-4)"
                  strokeDasharray="4 4"
                  label={{
                    value: "220ms SLO",
                    position: "insideTopRight",
                    fill: "var(--color-text-secondary)",
                    fontSize: 11,
                  }}
                />
                <Line
                  type="linear"
                  dataKey="ms"
                  name="Latency (ms)"
                  stroke="var(--color-data-teal-4)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </VStack>
        )}
      </VStack>
    </Card>
  );
}

export function LatencyChartSkeleton() {
  return (
    <Card padding={5}>
      <VStack gap={3}>
        <Skeleton width="45%" height={20} />
        <Skeleton width="100%" height={220} index={1} />
      </VStack>
    </Card>
  );
}
