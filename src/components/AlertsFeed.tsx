import { useMemo, useState } from "react";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { List, ListItem } from "@astryxdesign/core/List";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Timestamp } from "@astryxdesign/core/Timestamp";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { VStack } from "@astryxdesign/core/VStack";
import { useAlerts } from "@/hooks/use-surveillance";
import { QueryError } from "./QueryError";

type Level = "critical" | "warning" | "info";

export function AlertsFeed() {
  const { data: alerts, loading, error, refetch } = useAlerts();
  const [levelFilter, setLevelFilter] = useState<"all" | Level>("all");

  const visible = useMemo(
    () => (levelFilter === "all" ? alerts : alerts.filter((a) => a.level === levelFilter)),
    [alerts, levelFilter],
  );

  if (error) {
    return <QueryError what="alerts" error={error} onRetry={() => refetch()} />;
  }

  if (loading) {
    return (
      <VStack gap={2}>
        <Skeleton width="100%" height={48} />
        <Skeleton width="100%" height={48} index={1} />
        <Skeleton width="100%" height={48} index={2} />
      </VStack>
    );
  }

  return (
    <VStack gap={3}>
      <SegmentedControl
        label="Filter alerts by severity"
        size="sm"
        layout="fill"
        value={levelFilter}
        onChange={(val) => setLevelFilter(val as "all" | Level)}
      >
        <SegmentedControlItem value="all" label="All" />
        <SegmentedControlItem value="critical" label="Critical" />
        <SegmentedControlItem value="warning" label="Warning" />
        <SegmentedControlItem value="info" label="Info" />
      </SegmentedControl>

      {visible.length === 0 ? (
        <EmptyState
          isCompact
          title="No alerts at this severity"
          description="Switch filter tiers to inspect lower-severity notifications."
        />
      ) : (
        <List edge="outset" density="compact">
          {visible.map((alert) => {
            const dotVariant =
              alert.level === "critical"
                ? "error"
                : alert.level === "warning"
                  ? "warning"
                  : "accent";
            return (
              <ListItem
                key={alert.id}
                align="start"
                startContent={
                  <StatusDot
                    variant={dotVariant}
                    label={alert.level}
                    isPulsing={alert.level === "critical"}
                  />
                }
                label={alert.title}
                description={alert.region}
                endContent={<Timestamp value={alert.createdAt} format="relative_short" isLive />}
                href={`/map?region=${encodeURIComponent(alert.region)}`}
              />
            );
          })}
        </List>
      )}
    </VStack>
  );
}
