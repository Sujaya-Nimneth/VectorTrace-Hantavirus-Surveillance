import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { RefreshCw } from "lucide-react";

import { useInfra } from "@/hooks/use-infra";
import { QueryError } from "@/components/QueryError";
import { LatencyChart, LatencyChartSkeleton } from "@/components/admin/LatencyChart";
import { SourcesPanel, SourcesPanelSkeleton } from "@/components/admin/SourcesPanel";
import { LogsTerminal } from "@/components/admin/LogsTerminal";

function HealthStat({
  label,
  value,
  subtext,
  status,
}: {
  label: string;
  value: string;
  subtext: string;
  status: "success" | "warning" | "error" | "neutral";
}) {
  return (
    <VStack gap={1.5} minHeight={80} justify="between">
      <HStack justify="between" align="center" gap={2}>
        <Text type="label" color="secondary" maxLines={1}>
          {label}
        </Text>
        <StatusDot variant={status} label={label} />
      </HStack>
      <Text type="display-3" weight="semibold" hasTabularNumbers>
        {value}
      </Text>
      <Text type="supporting" size="xsm" hasTabularNumbers>
        {subtext}
      </Text>
    </VStack>
  );
}

export function AdminConsole() {
  const { data, isPending, isFetching, error, refetch } = useInfra();

  const healthySources = data ? data.sources.filter((s) => s.status === "ok").length : 0;
  const totalSources = data ? data.sources.length : 0;

  return (
    <Layout padding={6} contentWidth={1360} height="auto">
      <LayoutHeader hasDivider>
        <HStack justify="between" align="end" gap={4} wrap="wrap" paddingBlockEnd={4}>
          <VStack gap={1}>
            <Heading level={1}>System Infrastructure</Heading>
            <Text type="supporting">
              Pipeline cron cadence, database pool saturation, latency SLO compliance, and live feed
              diagnostics.
            </Text>
          </VStack>
          <Button
            label="Refresh telemetry"
            variant="secondary"
            size="md"
            icon={<Icon icon={RefreshCw} size="sm" />}
            isLoading={isFetching}
            onClick={() => {
              void refetch();
            }}
          />
        </HStack>
      </LayoutHeader>

      <LayoutContent>
        <VStack gap={6}>
          {error && (
            <QueryError what="infra metrics" error={error} onRetry={() => void refetch()} />
          )}

          <Card padding={5}>
            {isPending || !data ? (
              <Grid columns={{ minWidth: 180, max: 4, repeat: "fit" }} gap={5}>
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} width="100%" height={80} index={i} />
                ))}
              </Grid>
            ) : (
              <Grid columns={{ minWidth: 180, max: 4, repeat: "fit" }} gap={5}>
                <HealthStat
                  label="Cron success rate"
                  value={data.cron ? `${data.cron.successRate}%` : "—"}
                  subtext={
                    data.cron
                      ? `${data.cron.successCount}/${data.cron.totalCount} runs succeeded`
                      : "No cron history"
                  }
                  status={!data.cron ? "neutral" : data.cron.lastRunFailed ? "error" : "success"}
                />
                <HealthStat
                  label="DB query latency"
                  value={data.db ? `${data.db.avgLatency}ms` : "—"}
                  subtext={data.db ? `p95 ${data.db.p95Latency}ms · SLO 220ms` : "No probe data"}
                  status={!data.db ? "neutral" : data.db.avgLatency > 220 ? "warning" : "success"}
                />
                <HealthStat
                  label="DB pool usage"
                  value={
                    data.db && data.db.poolUsed != null && data.db.poolMax != null
                      ? `${data.db.poolUsed}/${data.db.poolMax}`
                      : "—"
                  }
                  subtext={data.db ? `Source: ${data.db.poolSource}` : "No pool data"}
                  status="neutral"
                />
                <HealthStat
                  label="Active data feeds"
                  value={`${healthySources}/${totalSources}`}
                  subtext="Upstream surveillance sources"
                  status={
                    healthySources === totalSources
                      ? "success"
                      : healthySources === 0
                        ? "error"
                        : "warning"
                  }
                />
              </Grid>
            )}
          </Card>

          <Grid columns={{ minWidth: 340, max: 2, repeat: "fit" }} gap={4}>
            {isPending || !data ? (
              <>
                <LatencyChartSkeleton />
                <SourcesPanelSkeleton />
              </>
            ) : (
              <>
                <LatencyChart
                  series={data.latencySeries}
                  avgLatency={data.db?.avgLatency ?? null}
                />
                <SourcesPanel sources={data.sources} />
              </>
            )}
          </Grid>

          {isPending || !data ? (
            <Skeleton width="100%" height={280} />
          ) : (
            <LogsTerminal logs={data.logs} />
          )}
        </VStack>
      </LayoutContent>
    </Layout>
  );
}
