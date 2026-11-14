import { useMemo, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";
import { Toolbar } from "@astryxdesign/core/Toolbar";
import { VStack } from "@astryxdesign/core/VStack";
import { Download } from "lucide-react";

import type { SectorRole } from "@/lib/diseases";
import { buildCsv, downloadCsv } from "@/lib/csv";
import type { TickerSignalSummary } from "@/lib/mock-data";

const ROLE_LABELS: Record<SectorRole, string> = {
  vaccine: "Vaccine",
  antiviral: "Antiviral",
  diagnostics: "Diagnostics",
  consumables: "Acute Care",
  vector_control: "Vector Control",
  benchmark: "Benchmark",
};

export function PharmaBasketTable({
  diseaseSlug,
  diseaseName,
  tickers,
}: {
  diseaseSlug: string;
  diseaseName: string;
  tickers: TickerSignalSummary[];
}) {
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const visible = useMemo(() => {
    if (roleFilter === "all") return tickers;
    return tickers.filter((t) => t.sectorRole === roleFilter);
  }, [tickers, roleFilter]);

  const exportCsv = () => {
    const csv = buildCsv(
      [
        "Disease",
        "Ticker",
        "Company",
        "Role",
        "Weight",
        "Last Price",
        "7D Return",
        "7D Market-Neutral Alpha",
        "Volume Z-Score",
        "Signal",
      ],
      visible.map((t) => [
        diseaseName,
        t.ticker,
        t.companyName,
        ROLE_LABELS[t.sectorRole],
        t.weight.toFixed(2),
        t.lastPrice.toFixed(2),
        `${(t.return7d * 100).toFixed(2)}%`,
        `${(t.car7d * 100).toFixed(2)}%`,
        t.volumeZScore.toFixed(2),
        t.signalLabel,
      ]),
    );
    downloadCsv(`vectortrace-pharma-basket-${diseaseSlug}.csv`, csv);
  };

  return (
    <Card padding={5}>
      <VStack gap={4}>
        <HStack justify="between" align="center" gap={2} wrap="wrap">
          <VStack gap={0.5}>
            <Heading level={2}>{diseaseName} Pharma &amp; Diagnostics Basket</Heading>
            <Text type="supporting">
              Market-neutral abnormal returns (net of SPY/XBI) and 30-day volume anomalies per
              supply-chain tier
            </Text>
          </VStack>
        </HStack>

        <Toolbar
          label="Filter pharma equity basket"
          size="sm"
          startContent={
            <SegmentedControl
              label="Supply chain role"
              size="sm"
              value={roleFilter}
              onChange={setRoleFilter}
            >
              <SegmentedControlItem value="all" label="All tiers" />
              <SegmentedControlItem value="diagnostics" label="Diagnostics" />
              <SegmentedControlItem value="vaccine" label="Vaccines" />
              <SegmentedControlItem value="antiviral" label="Antivirals" />
              <SegmentedControlItem value="consumables" label="Acute Care" />
            </SegmentedControl>
          }
          endContent={
            <Button
              label="Export CSV"
              variant="secondary"
              size="sm"
              icon={<Icon icon={Download} size="sm" />}
              onClick={exportCsv}
            />
          }
        />

        <Table density="compact" dividers="rows" hasHover>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Ticker</TableHeaderCell>
              <TableHeaderCell>Company &amp; Supply Role</TableHeaderCell>
              <TableHeaderCell>Tier</TableHeaderCell>
              <TableHeaderCell>
                <HStack justify="end" width="100%">
                  Price
                </HStack>
              </TableHeaderCell>
              <TableHeaderCell>
                <HStack justify="end" width="100%">
                  7D Raw
                </HStack>
              </TableHeaderCell>
              <TableHeaderCell>
                <HStack justify="end" width="100%">
                  7D Alpha (α)
                </HStack>
              </TableHeaderCell>
              <TableHeaderCell>
                <HStack justify="end" width="100%">
                  Vol Z
                </HStack>
              </TableHeaderCell>
              <TableHeaderCell>
                <HStack justify="end" width="100%">
                  Wt
                </HStack>
              </TableHeaderCell>
              <TableHeaderCell>Implied Signal</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((t) => {
              const signalColor =
                t.signalLabel === "Outbreak Accumulation"
                  ? "red"
                  : t.signalLabel === "Supply Stress"
                    ? "orange"
                    : "teal";
              return (
                <TableRow key={t.ticker}>
                  <TableCell>
                    <HStack gap={1.5} align="center">
                      <Text type="code" weight="semibold">
                        {t.ticker}
                      </Text>
                      {t.isPurePlay && <Token size="sm" color="purple" label="Pure" />}
                    </HStack>
                  </TableCell>
                  <TableCell>
                    <VStack gap={0.5}>
                      <Text type="body" weight="medium">
                        {t.companyName}
                      </Text>
                      <Text type="supporting">{t.leadRole}</Text>
                    </VStack>
                  </TableCell>
                  <TableCell>
                    <Token size="sm" color="blue" label={ROLE_LABELS[t.sectorRole]} />
                  </TableCell>
                  <TableCell>
                    <Text type="body" justify="end" display="block" hasTabularNumbers>
                      {t.lastPrice.toFixed(2)}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text
                      type="body"
                      justify="end"
                      display="block"
                      hasTabularNumbers
                      color="secondary"
                    >
                      {t.return7d >= 0 ? "+" : ""}
                      {(t.return7d * 100).toFixed(1)}%
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text
                      type="body"
                      justify="end"
                      display="block"
                      weight="semibold"
                      hasTabularNumbers
                    >
                      {t.car7d >= 0 ? "+" : ""}
                      {(t.car7d * 100).toFixed(1)}%
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text type="body" justify="end" display="block" hasTabularNumbers>
                      {t.volumeZScore >= 0 ? "+" : ""}
                      {t.volumeZScore.toFixed(2)}σ
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text
                      type="body"
                      justify="end"
                      display="block"
                      hasTabularNumbers
                      color="secondary"
                    >
                      {Math.round(t.weight * 100)}%
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Token size="sm" color={signalColor} label={t.signalLabel} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </VStack>
    </Card>
  );
}
