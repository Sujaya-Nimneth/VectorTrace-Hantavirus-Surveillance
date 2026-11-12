import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { List, ListItem } from "@astryxdesign/core/List";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Text } from "@astryxdesign/core/Text";
import { Timestamp } from "@astryxdesign/core/Timestamp";
import { Token } from "@astryxdesign/core/Token";
import { VStack } from "@astryxdesign/core/VStack";

import type { SourceStatus } from "@/hooks/use-infra";

export function SourcesPanel({ sources }: { sources: SourceStatus[] }) {
  const hasDown = sources.some((s) => s.status === "down");
  const hasWarn = sources.some((s) => s.status === "warn");

  const badgeLabel = hasDown ? "Degraded" : hasWarn ? "Partial" : "Operational";
  const badgeColor = hasDown ? "red" : hasWarn ? "orange" : "green";

  return (
    <Card padding={5}>
      <VStack gap={4}>
        <HStack justify="between" align="center" gap={2} wrap="wrap">
          <VStack gap={0.5}>
            <Heading level={2}>Data Engine · Ingest Feeds &amp; APIs</Heading>
            <Text type="supporting" size="xsm">
              External feed sync status and response latency
            </Text>
          </VStack>
          <Token size="sm" color={badgeColor} label={badgeLabel} />
        </HStack>

        <List edge="outset" density="compact">
          {sources.map((s) => {
            const dotVariant =
              s.status === "ok" ? "success" : s.status === "warn" ? "warning" : "error";
            return (
              <ListItem
                key={s.src}
                startContent={
                  <StatusDot
                    variant={dotVariant}
                    label={s.status}
                    isPulsing={s.status === "down"}
                  />
                }
                label={s.src}
                description={
                  s.lastCheckedAt ? (
                    <HStack gap={1} align="center">
                      <Text type="supporting" size="xsm">
                        Checked
                      </Text>
                      <Timestamp value={s.lastCheckedAt} format="relative_short" isLive />
                    </HStack>
                  ) : (
                    "No check recorded"
                  )
                }
                endContent={
                  <Text type="supporting" size="xsm" hasTabularNumbers>
                    {s.latencyMs != null ? `${s.latencyMs}ms` : "—"} ·{" "}
                    {s.recordsIngested != null ? `${s.recordsIngested} rec` : "—"}
                  </Text>
                }
              />
            );
          })}
        </List>
      </VStack>
    </Card>
  );
}

export function SourcesPanelSkeleton() {
  return (
    <Card padding={5}>
      <VStack gap={3}>
        <Skeleton width="55%" height={20} />
        <Skeleton width="100%" height={40} index={1} />
        <Skeleton width="100%" height={40} index={2} />
        <Skeleton width="100%" height={40} index={3} />
      </VStack>
    </Card>
  );
}
