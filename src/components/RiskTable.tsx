import { useMemo, useState } from "react";
import { Toolbar } from "@astryxdesign/core/Toolbar";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { Selector } from "@astryxdesign/core/Selector";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@astryxdesign/core/Table";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Token } from "@astryxdesign/core/Token";
import { Link } from "@astryxdesign/core/Link";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { ArrowDown, ArrowUp, ArrowUpDown, Download } from "lucide-react";

import { useCases } from "@/hooks/use-surveillance";
import { useNow } from "@/hooks/use-now";
import { REGIONS } from "@/lib/mock-data";
import { buildCsv, downloadCsv } from "@/lib/csv";
import { DAY_MS } from "@/lib/time";
import { QueryError } from "./QueryError";

type SortKey = "region" | "pop" | "total" | "confirmed" | "rate";

const WINDOWS = [
  { days: "30", label: "30D" },
  { days: "90", label: "90D" },
  { days: "365", label: "1Y" },
];

export function RiskTable() {
  const { data: CASES, loading, error, refetch } = useCases();
  const now = useNow();
  const [windowDays, setWindowDays] = useState<number>(90);
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("rate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    const cutoff = now - windowDays * DAY_MS;
    const regions =
      regionFilter === "all" ? REGIONS : REGIONS.filter((r) => r.name === regionFilter);
    return regions
      .map((r) => {
        const cases = CASES.filter((c) => c.region === r.name && +new Date(c.date) >= cutoff);
        const total = cases.length;
        const confirmed = cases.filter((c) => c.status === "Confirmed").length;
        const rate = r.pop > 0 ? (total / r.pop) * 100_000 : 0;
        const tier = rate >= 2 ? "High" : rate >= 1 ? "Moderate" : "Low";
        return { region: r.name, pop: r.pop, total, confirmed, rate, tier };
      })
      .sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (typeof av === "string" && typeof bv === "string") {
          return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
        }
        return sortDir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
      });
  }, [CASES, now, windowDays, regionFilter, sortKey, sortDir]);

  const maxRate = useMemo(() => Math.max(...rows.map((r) => r.rate), 1), [rows]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const exportCsv = () => {
    const csv = buildCsv(
      ["Region", "Population", "Total Cases", "Confirmed", "Incidence / 100k", "Risk Tier"],
      rows.map((r) => [r.region, r.pop, r.total, r.confirmed, r.rate.toFixed(2), r.tier]),
    );
    downloadCsv(`vectortrace-regional-risk-${windowDays}d.csv`, csv);
  };

  if (error) {
    return <QueryError what="risk ranking" error={error} onRetry={() => refetch()} />;
  }

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <Icon icon={ArrowUpDown} size="xsm" color="secondary" />;
    return sortDir === "asc" ? (
      <Icon icon={ArrowUp} size="xsm" color="primary" />
    ) : (
      <Icon icon={ArrowDown} size="xsm" color="primary" />
    );
  };

  const regionOptions = [
    { value: "all", label: "All regions" },
    ...REGIONS.map((r) => ({ value: r.name, label: r.name })),
  ];

  return (
    <VStack gap={3}>
      <Toolbar
        label="Regional risk ranking controls"
        size="sm"
        startContent={
          <SegmentedControl
            label="Risk calculation window"
            size="sm"
            value={String(windowDays)}
            onChange={(val) => setWindowDays(Number(val))}
          >
            {WINDOWS.map((w) => (
              <SegmentedControlItem key={w.days} value={w.days} label={w.label} />
            ))}
          </SegmentedControl>
        }
        endContent={
          <HStack gap={2} align="center" wrap="wrap">
            <Selector
              label="Filter by region"
              isLabelHidden
              variant="secondary"
              size="sm"
              width={180}
              options={regionOptions}
              value={regionFilter}
              onChange={setRegionFilter}
            />
            <Button
              label="Export CSV"
              variant="secondary"
              size="sm"
              icon={<Icon icon={Download} size="sm" />}
              onClick={exportCsv}
            />
          </HStack>
        }
      />

      {loading ? (
        <VStack gap={2}>
          <Skeleton width="100%" height={36} />
          <Skeleton width="100%" height={36} index={1} />
          <Skeleton width="100%" height={36} index={2} />
          <Skeleton width="100%" height={36} index={3} />
        </VStack>
      ) : (
        <Table density="compact" dividers="rows" hasHover isStriped={false}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>
                <Button
                  label="Region"
                  variant="ghost"
                  size="sm"
                  endContent={sortIcon("region")}
                  onClick={() => toggleSort("region")}
                />
              </TableHeaderCell>
              <TableHeaderCell>
                <HStack justify="end" width="100%">
                  <Button
                    label="Population"
                    variant="ghost"
                    size="sm"
                    endContent={sortIcon("pop")}
                    onClick={() => toggleSort("pop")}
                  />
                </HStack>
              </TableHeaderCell>
              <TableHeaderCell>
                <HStack justify="end" width="100%">
                  <Button
                    label="Total cases"
                    variant="ghost"
                    size="sm"
                    endContent={sortIcon("total")}
                    onClick={() => toggleSort("total")}
                  />
                </HStack>
              </TableHeaderCell>
              <TableHeaderCell>
                <HStack justify="end" width="100%">
                  <Button
                    label="Confirmed"
                    variant="ghost"
                    size="sm"
                    endContent={sortIcon("confirmed")}
                    onClick={() => toggleSort("confirmed")}
                  />
                </HStack>
              </TableHeaderCell>
              <TableHeaderCell>
                <HStack justify="end" width="100%">
                  <Button
                    label="Incidence / 100k"
                    variant="ghost"
                    size="sm"
                    endContent={sortIcon("rate")}
                    onClick={() => toggleSort("rate")}
                  />
                </HStack>
              </TableHeaderCell>
              <TableHeaderCell>Risk tier</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const tierColor =
                r.tier === "High" ? "red" : r.tier === "Moderate" ? "orange" : "teal";
              const barVariant =
                r.tier === "High" ? "error" : r.tier === "Moderate" ? "warning" : "success";
              return (
                <TableRow key={r.region}>
                  <TableCell>
                    <Link href={`/map?region=${encodeURIComponent(r.region)}`} isStandalone={false}>
                      <Text type="body" weight="medium">
                        {r.region}
                      </Text>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Text
                      type="body"
                      justify="end"
                      display="block"
                      hasTabularNumbers
                      color="secondary"
                    >
                      {r.pop.toLocaleString()}
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
                      {r.total}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text type="body" justify="end" display="block" hasTabularNumbers>
                      {r.confirmed}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <HStack justify="end" align="center" gap={3} width="100%">
                      <VStack width={80}>
                        <ProgressBar
                          label={`${r.region} relative incidence`}
                          value={Math.min(100, (r.rate / maxRate) * 100)}
                          max={100}
                          variant={barVariant}
                          isLabelHidden
                        />
                      </VStack>
                      <Text type="body" hasTabularNumbers weight="medium">
                        {r.rate.toFixed(2)}
                      </Text>
                    </HStack>
                  </TableCell>
                  <TableCell>
                    <Token size="sm" color={tierColor} label={r.tier} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </VStack>
  );
}
