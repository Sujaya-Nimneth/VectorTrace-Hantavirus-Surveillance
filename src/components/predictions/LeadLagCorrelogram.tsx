import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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

import type { LeadLagPoint } from "@/lib/market-prediction";

export function LeadLagCorrelogram({
  correlogram,
  optimalLeadDays,
  peakR,
  loading,
}: {
  correlogram: LeadLagPoint[];
  optimalLeadDays: number;
  peakR: number;
  loading: boolean;
}) {
  const leadCopy =
    optimalLeadDays < 0
      ? `Pharma basket leads confirmed reporting by ${Math.abs(optimalLeadDays)} days (r = ${peakR.toFixed(2)})`
      : optimalLeadDays > 0
        ? `Equity response lags reporting by ${optimalLeadDays} days (supply-chain catch-up, r = ${peakR.toFixed(2)})`
        : `Concurrent co-movement (0d lag, r = ${peakR.toFixed(2)})`;

  return (
    <Card padding={5}>
      <VStack gap={4}>
        <HStack justify="between" align="center" gap={3} wrap="wrap">
          <VStack gap={0.5}>
            <Heading level={2}>Lead-Lag Cross-Correlogram</Heading>
            <Text type="supporting">{leadCopy}</Text>
          </VStack>
          <Token
            size="sm"
            color={optimalLeadDays < 0 ? "teal" : "blue"}
            label={
              optimalLeadDays < 0
                ? `${Math.abs(optimalLeadDays)}D Early Lead`
                : `+${optimalLeadDays}D Supply Lag`
            }
          />
        </HStack>

        {loading ? (
          <Skeleton width="100%" height={320} radius={2} />
        ) : (
          <VStack gap={2} width="100%">
            <VStack width="100%" height={290}>
              <ResponsiveContainer width="100%" height={290}>
                <BarChart data={correlogram} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="lag"
                    interval={4}
                    tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v}d`}
                    tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                  />
                  <YAxis
                    domain={[-1, 1]}
                    tickCount={5}
                    tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(val) => [Number(val ?? 0).toFixed(3), "Pearson r"]}
                    labelFormatter={(lag) =>
                      Number(lag) < 0
                        ? `Lag ${lag}d (Market leads cases by ${Math.abs(Number(lag))}d)`
                        : Number(lag) > 0
                          ? `Lag +${lag}d (Cases lead market by ${lag}d)`
                          : "Lag 0d (Same day)"
                    }
                    contentStyle={{
                      backgroundColor: "var(--color-background-card)",
                      borderColor: "var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--color-text-primary)",
                      fontSize: "12px",
                    }}
                  />
                  <ReferenceLine y={0} stroke="var(--color-border)" />
                  <ReferenceLine x={0} stroke="var(--color-text-secondary)" strokeDasharray="3 3" />
                  <Bar dataKey="r" isAnimationActive={false}>
                    {correlogram.map((entry) => {
                      const fill =
                        entry.lag === optimalLeadDays
                          ? "var(--color-data-red-4)"
                          : entry.zone === "market_leads"
                            ? "var(--color-data-teal-4)"
                            : "var(--color-data-blue-4)";
                      return <Cell key={`lag-${entry.lag}`} fill={fill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </VStack>
            <HStack justify="between" align="center" wrap="wrap" gap={2}>
              <Text type="supporting">
                Left (&tau; &lt; 0): Stocks move before clinical reports
              </Text>
              <Text type="supporting">Right (&tau; &gt; 0): Outbreaks drive procurement</Text>
            </HStack>
          </VStack>
        )}
      </VStack>
    </Card>
  );
}
