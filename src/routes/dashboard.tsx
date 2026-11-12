import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { FilePlus2, MapPin } from "lucide-react";

import { MetricCard } from "@/components/MetricCard";
import { EpidemicCurve } from "@/components/EpidemicCurve";
import { AlertsFeed } from "@/components/AlertsFeed";
import { RiskTable } from "@/components/RiskTable";
import { QueryError } from "@/components/QueryError";
import { useCases, useRodents } from "@/hooks/use-surveillance";
import { useNow } from "@/hooks/use-now";
import { DAY_MS } from "@/lib/time";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

const CURVE_RANGES: Array<{ days: 7 | 30 | 90; label: string }> = [
  { days: 7, label: "7D" },
  { days: 30, label: "30D" },
  { days: 90, label: "90D" },
];

function DashboardPage() {
  const [curveRange, setCurveRange] = useState<7 | 30 | 90>(90);
  const {
    data: cases = [],
    loading: casesLoading,
    error: casesError,
    refetch: refetchCases,
  } = useCases();
  const {
    data: rodents = [],
    loading: rodentsLoading,
    error: rodentsError,
    refetch: refetchRodents,
  } = useRodents();
  const now = useNow();

  const metrics = useMemo(() => {
    const inWindow = (iso: string, minDays: number, maxDays: number) => {
      const d = (now - +new Date(iso)) / DAY_MS;
      return d > minDays && d <= maxDays;
    };
    const delta = (curr: number, prev: number): number | null => {
      if (prev === 0) return curr === 0 ? 0 : null;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const last30Cases = cases.filter((c) => inWindow(c.date, -1, 30));
    const prior30Cases = cases.filter((c) => inWindow(c.date, 30, 60));

    const last30Rodents = rodents.filter((r) => inWindow(r.date, -1, 30));
    const prior30Rodents = rodents.filter((r) => inWindow(r.date, 30, 60));

    const confirmedCases = cases.filter((c) => c.status === "Confirmed");
    const last30Confirmed = confirmedCases.filter((c) => inWindow(c.date, -1, 30));
    const prior30Confirmed = confirmedCases.filter((c) => inWindow(c.date, 30, 60));

    const pendingCases = cases.filter((c) => c.status === "Pending");
    const last30Pending = pendingCases.filter((c) => inWindow(c.date, -1, 30));
    const prior30Pending = pendingCases.filter((c) => inWindow(c.date, 30, 60));

    const yearStart = new Date(new Date(now).getFullYear(), 0, 1).getTime();
    const ytdConfirmed = confirmedCases.filter((c) => +new Date(c.date) >= yearStart).length;

    const regionCounts = last30Cases.reduce<Record<string, number>>((acc, c) => {
      acc[c.region] = (acc[c.region] ?? 0) + 1;
      return acc;
    }, {});
    const topRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      active: {
        value: last30Cases.length,
        delta: delta(last30Cases.length, prior30Cases.length),
      },
      rodents: {
        value: last30Rodents.length > 0 ? last30Rodents.length : rodents.length,
        delta: delta(last30Rodents.length, prior30Rodents.length),
      },
      ytd: {
        value: ytdConfirmed,
        delta: delta(last30Confirmed.length, prior30Confirmed.length),
      },
      pending: {
        value: pendingCases.length,
        delta: delta(last30Pending.length, prior30Pending.length),
      },
      leadFinding: topRegion
        ? `${topRegion[0]} accounts for ${topRegion[1]} of ${last30Cases.length} reported notifications in the last 30 days.`
        : "Monitoring 6 regional sentinel nodes across active hantavirus corridors.",
    };
  }, [cases, rodents, now]);

  const loading = casesLoading || rodentsLoading;
  const queryError = casesError || rodentsError;

  return (
    <Layout padding={6} contentWidth={1360} height="auto">
      <LayoutHeader hasDivider>
        <HStack justify="between" align="end" gap={4} wrap="wrap" paddingBlockEnd={4}>
          <VStack gap={1}>
            <Heading level={1}>Surveillance Overview</Heading>
            <Text type="supporting">{metrics.leadFinding}</Text>
          </VStack>
          <HStack gap={2} align="center">
            <Button
              label="Open map"
              variant="secondary"
              size="md"
              icon={<Icon icon={MapPin} size="sm" />}
              href="/map"
            />
            <Button
              label="Submit case"
              variant="primary"
              size="md"
              icon={<Icon icon={FilePlus2} size="sm" />}
              href="/intake"
            />
          </HStack>
        </HStack>
      </LayoutHeader>

      <LayoutContent>
        <VStack gap={6}>
          {queryError && (
            <QueryError
              what="surveillance metrics"
              error={queryError}
              onRetry={() => {
                void refetchCases();
                void refetchRodents();
              }}
            />
          )}

          <Card padding={5}>
            {loading ? (
              <Grid columns={{ minWidth: 180, max: 4, repeat: "fit" }} gap={5}>
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} width="100%" height={84} index={i} />
                ))}
              </Grid>
            ) : (
              <Grid columns={{ minWidth: 180, max: 4, repeat: "fit" }} gap={5}>
                <MetricCard
                  label="Active notifications (30d)"
                  value={String(metrics.active.value)}
                  delta={metrics.active.delta}
                  tone="alert"
                />
                <MetricCard
                  label="Rodent trap sites"
                  value={String(metrics.rodents.value)}
                  delta={metrics.rodents.delta}
                  tone="warning"
                  invertDelta
                />
                <MetricCard
                  label="YTD confirmed cases"
                  value={String(metrics.ytd.value)}
                  delta={metrics.ytd.delta}
                  tone="info"
                />
                <MetricCard
                  label="Pending lab confirmation"
                  value={String(metrics.pending.value)}
                  delta={metrics.pending.delta}
                  tone="teal"
                />
              </Grid>
            )}
          </Card>

          <Grid columns={{ minWidth: 340, max: 2, repeat: "fit" }} gap={4} align="start">
            <Card padding={5}>
              <VStack gap={4}>
                <HStack justify="between" align="center" gap={3} wrap="wrap">
                  <VStack gap={0.5}>
                    <Heading level={2}>Epidemic Curve</Heading>
                    <Text type="supporting">
                      Case onset counts by region (straight linear segments)
                    </Text>
                  </VStack>
                  <SegmentedControl
                    label="Epidemic curve window"
                    size="sm"
                    value={String(curveRange)}
                    onChange={(val) => setCurveRange(Number(val) as 7 | 30 | 90)}
                  >
                    {CURVE_RANGES.map((r) => (
                      <SegmentedControlItem key={r.days} value={String(r.days)} label={r.label} />
                    ))}
                  </SegmentedControl>
                </HStack>
                <EpidemicCurve days={curveRange} />
              </VStack>
            </Card>

            <Card padding={5}>
              <VStack gap={4}>
                <VStack gap={0.5}>
                  <Heading level={2}>Alerts Feed</Heading>
                  <Text type="supporting">
                    Select any alert to center the geospatial map on the affected region
                  </Text>
                </VStack>
                <AlertsFeed />
              </VStack>
            </Card>
          </Grid>

          <Card padding={5}>
            <VStack gap={4}>
              <VStack gap={0.5}>
                <Heading level={2}>Regional Incidence &amp; Risk Ranking</Heading>
                <Text type="supporting">
                  Population-adjusted incidence per 100k inhabitants over the selected window
                </Text>
              </VStack>
              <RiskTable />
            </VStack>
          </Card>
        </VStack>
      </LayoutContent>
    </Layout>
  );
}
