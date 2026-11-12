import { useMemo, useState } from "react";
import { Card } from "@astryxdesign/core/Card";
import { CodeBlock } from "@astryxdesign/core/CodeBlock";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { Text } from "@astryxdesign/core/Text";
import { Toolbar } from "@astryxdesign/core/Toolbar";
import { VStack } from "@astryxdesign/core/VStack";

import type { LogEntry } from "@/hooks/use-infra";

type FilterLevel = "ALL" | LogEntry["lvl"];

export function LogsTerminal({ logs }: { logs: LogEntry[] }) {
  const [filter, setFilter] = useState<FilterLevel>("ALL");

  const filtered = useMemo(
    () => (filter === "ALL" ? logs : logs.filter((entry) => entry.lvl === filter)),
    [logs, filter],
  );

  const formattedCode = useMemo(
    () => filtered.map((l) => `${l.ts}  [${l.lvl.padEnd(4, " ")}]  ${l.msg}`).join("\n"),
    [filtered],
  );

  return (
    <Card padding={5}>
      <VStack gap={3}>
        <Toolbar
          label="System log controls"
          size="sm"
          startContent={
            <HStack gap={2} align="center">
              <Heading level={2}>System Logs</Heading>
              <Text type="supporting" size="xsm" hasTabularNumbers>
                {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
              </Text>
            </HStack>
          }
          endContent={
            <SegmentedControl
              label="Filter log severity"
              size="sm"
              value={filter}
              onChange={(val) => setFilter(val as FilterLevel)}
            >
              <SegmentedControlItem value="ALL" label="All" />
              <SegmentedControlItem value="OK" label="OK" />
              <SegmentedControlItem value="WARN" label="WARN" />
              <SegmentedControlItem value="ERR" label="ERR" />
            </SegmentedControl>
          }
        />

        {filtered.length === 0 ? (
          <EmptyState
            isCompact
            title="No log entries match this filter"
            description="Select another severity tier or wait for the next ingestion cycle."
          />
        ) : (
          <CodeBlock
            code={formattedCode}
            language="plaintext"
            title="system.log"
            hasLineNumbers
            maxHeight={320}
            width="100%"
            container="section"
            hasCopyButton
          />
        )}
      </VStack>
    </Card>
  );
}
