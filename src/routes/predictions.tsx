import { useEffect } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Selector } from "@astryxdesign/core/Selector";
import { Skeleton } from "@astryxdesign/core/Skeleton";
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
import { VStack } from "@astryxdesign/core/VStack";
import { MapPin, TrendingUp } from "lucide-react";

import { MetricCard } from "@/components/MetricCard";
import { QueryError } from "@/components/QueryError";
import { LeadLagCorrelogram } from "@/components/predictions/LeadLagCorrelogram";
import { NowcastTrajectoryChart } from "@/components/predictions/NowcastTrajectoryChart";
import { PharmaBasketTable } from "@/components/predictions/PharmaBasketTable";
import { SignalAttributionCard } from "@/components/predictions/SignalAttributionCard";
import { setGlobalDiseaseFilter, useDiseaseFilter } from "@/hooks/use-disease-filter";
import { useAllDiseaseNowcasts, useDiseasePrediction } from "@/hooks/use-market-signals";
import { DISEASES, getDiseaseProfile, isDiseaseSlug, type DiseaseSlug } from "@/lib/diseases";

export type PredictionsSearch = { disease?: string };

export const Route = createFileRoute("/predictions")({
  component: PredictionsPage,
  head: () => ({ meta: [{ title: "Outbreak Predictor · VectorTrace" }] }),
  validateSearch: (search: Record<string, unknown>): PredictionsSearch => ({
    disease: typeof search.disease === "string" ? search.disease : undefined,
  }),
});

function PredictionsPage() {
  const search = useSearch({ from: "/predictions" });
  const navigate = useNavigate();
  const { disease: globalDisease } = useDiseaseFilter();

  const activeSlug: DiseaseSlug = isDiseaseSlug(search.disease)
    ? search.disease
    : globalDisease !== "all"
      ? globalDisease
      : "dengue";

  useEffect(() => {
    if (isDiseaseSlug(search.disease)) {
      setGlobalDiseaseFilter(search.disease);
    }
  }, [search.disease]);

  const profile = getDiseaseProfile(activeSlug);
  const { nowcast, tickerSummaries, loading, error, refetch } = useDiseasePrediction(activeSlug);
  const { data: allNowcasts } = useAllDiseaseNowcasts();

  const selectDisease = (next: string) => {
    if (!isDiseaseSlug(next)) return;
    setGlobalDiseaseFilter(next);
    void navigate({ to: "/predictions", search: { disease: next }, replace: true });
  };

  const diseaseOptions = DISEASES.map((d) => ({
    value: d.slug,
    label: `${d.name} (${d.casePrefix})`,
  }));

  return (
    <Layout padding={6} contentWidth={1360} height="auto">
      <LayoutHeader hasDivider>
        <HStack justify="between" align="end" gap={4} wrap="wrap" paddingBlockEnd={4}>
          <VStack gap={1}>
            <Heading level={1}>Bio-Financial Outbreak Predictor</Heading>
            <Text type="supporting">
              Forecasting {profile.name} case surges using market-neutral pharma &amp; diagnostics
              alpha, institutional volume anomalies, syndromic search velocity, and climate drivers.
            </Text>
          </VStack>
          <HStack gap={2} align="center" wrap="wrap">
            <Selector
              label="Target pathogen"
              isLabelHidden
              variant="secondary"
              size="md"
              width={240}
              options={diseaseOptions}
              value={activeSlug}
              onChange={selectDisease}
            />
            <Button
              label="Open map"
              variant="secondary"
              size="md"
              icon={<Icon icon={MapPin} size="sm" />}
              href={`/map`}
            />
          </HStack>
        </HStack>
      </LayoutHeader>

      <LayoutContent>
        <VStack gap={6}>
          {error && <QueryError what="bio-financial signals" error={error} onRetry={refetch} />}

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
                  label="Composite outbreak risk"
                  value={`${nowcast.compositeOutbreakRisk.toFixed(0)}/100`}
                  delta={Math.round(nowcast.compositeOutbreakRisk - 50)}
                  deltaLabel={`${nowcast.riskTier} tier`}
                  windowLabel={`· ${profile.shortName}`}
                  tone={nowcast.compositeOutbreakRisk >= 70 ? "alert" : "warning"}
                />
                <MetricCard
                  label="Pharma basket 7d alpha"
                  value={`${nowcast.latestCar7d >= 0 ? "+" : ""}${(nowcast.latestCar7d * 100).toFixed(1)}%`}
                  delta={Math.round(nowcast.latestCar7d * 1000)}
                  deltaLabel="Net of SPY & XBI"
                  windowLabel="· 7d CAR"
                  tone="teal"
                />
                <MetricCard
                  label="Volume anomaly Z-score"
                  value={`${nowcast.latestVolZScore >= 0 ? "+" : ""}${nowcast.latestVolZScore.toFixed(2)}σ`}
                  delta={Math.round(nowcast.latestVolZScore * 10)}
                  deltaLabel={nowcast.latestVolZScore >= 1.8 ? "Abnormal turnover" : "Normal range"}
                  windowLabel="· vs 30d mean"
                  tone={nowcast.latestVolZScore >= 2 ? "alert" : "info"}
                />
                <MetricCard
                  label="Optimal lead correlation"
                  value={
                    nowcast.optimalLeadDays < 0
                      ? `-${Math.abs(nowcast.optimalLeadDays)}d`
                      : `+${nowcast.optimalLeadDays}d`
                  }
                  delta={Math.round(nowcast.peakR * 100)}
                  deltaLabel={`r = ${nowcast.peakR.toFixed(2)}`}
                  windowLabel={
                    nowcast.optimalLeadDays < 0 ? "· equity leads cases" : "· supply lag"
                  }
                  tone="info"
                  invertDelta
                />
              </Grid>
            )}
          </Card>

          <Grid columns={{ minWidth: 340, max: 2, repeat: "fit" }} gap={4} align="start">
            <NowcastTrajectoryChart
              diseaseName={profile.name}
              trajectory={nowcast.trajectory}
              loading={loading}
            />
            <LeadLagCorrelogram
              correlogram={nowcast.correlogram}
              optimalLeadDays={nowcast.optimalLeadDays}
              peakR={nowcast.peakR}
              loading={loading}
            />
          </Grid>

          <Grid columns={{ minWidth: 340, max: 2, repeat: "fit" }} gap={4} align="start">
            <SignalAttributionCard diseaseName={profile.name} nowcast={nowcast} />

            <Card padding={5}>
              <VStack gap={4}>
                <HStack justify="between" align="center" gap={2} wrap="wrap">
                  <VStack gap={0.5}>
                    <Heading level={2}>Cross-Pathogen Risk Ranking</Heading>
                    <Text type="supporting">
                      Select any pathogen to inspect its leading equity basket and 14-day nowcast
                    </Text>
                  </VStack>
                  <Icon icon={TrendingUp} size="sm" color="accent" />
                </HStack>

                <Table density="compact" dividers="rows" hasHover>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Pathogen</TableHeaderCell>
                      <TableHeaderCell>Lead Tickers</TableHeaderCell>
                      <TableHeaderCell>Lead</TableHeaderCell>
                      <TableHeaderCell>Risk Score</TableHeaderCell>
                      <TableHeaderCell>Action</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allNowcasts.map(({ disease, nowcast: nc, leadTickers }) => {
                      const barVariant =
                        nc.compositeOutbreakRisk >= 75
                          ? "error"
                          : nc.compositeOutbreakRisk >= 55
                            ? "warning"
                            : "success";
                      const isCurrent = disease.slug === activeSlug;
                      return (
                        <TableRow key={disease.slug}>
                          <TableCell>
                            <HStack gap={2} align="center">
                              <Token
                                size="sm"
                                color={disease.tokenColor}
                                label={disease.casePrefix}
                              />
                              <Text type="body" weight={isCurrent ? "semibold" : "medium"}>
                                {disease.shortName}
                              </Text>
                            </HStack>
                          </TableCell>
                          <TableCell>
                            <Text type="code" color="secondary">
                              {leadTickers.join(", ")}
                            </Text>
                          </TableCell>
                          <TableCell>
                            <Text type="supporting" hasTabularNumbers>
                              {nc.optimalLeadDays < 0
                                ? `-${Math.abs(nc.optimalLeadDays)}d`
                                : `+${nc.optimalLeadDays}d`}
                            </Text>
                          </TableCell>
                          <TableCell>
                            <HStack gap={2} align="center">
                              <VStack width={64}>
                                <ProgressBar
                                  label={`${disease.name} risk`}
                                  value={nc.compositeOutbreakRisk}
                                  max={100}
                                  variant={barVariant}
                                  isLabelHidden
                                />
                              </VStack>
                              <Text type="body" hasTabularNumbers weight="semibold">
                                {nc.compositeOutbreakRisk.toFixed(0)}
                              </Text>
                            </HStack>
                          </TableCell>
                          <TableCell>
                            <Button
                              label={isCurrent ? "Active" : "Inspect"}
                              variant={isCurrent ? "primary" : "ghost"}
                              size="sm"
                              onClick={() => selectDisease(disease.slug)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </VStack>
            </Card>
          </Grid>

          <PharmaBasketTable
            diseaseSlug={activeSlug}
            diseaseName={profile.name}
            tickers={tickerSummaries}
          />
        </VStack>
      </LayoutContent>
    </Layout>
  );
}
