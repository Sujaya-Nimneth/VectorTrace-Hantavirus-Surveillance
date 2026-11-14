import { Banner } from "@astryxdesign/core/Banner";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";
import { VStack } from "@astryxdesign/core/VStack";

import type { DiseaseNowcastResult } from "@/lib/market-prediction";

export function SignalAttributionCard({
  diseaseName,
  nowcast,
}: {
  diseaseName: string;
  nowcast: DiseaseNowcastResult;
}) {
  const factors = [
    {
      label: "Market-Neutral Pharma α (CAR 7d)",
      weightPct: Math.round(nowcast.attribution.weights.pharmaAlpha * 100),
      score: nowcast.attribution.pharmaAlphaScore,
      detail: `${(nowcast.latestCar7d * 100).toFixed(1)}% vs SPY/XBI`,
    },
    {
      label: "Institutional Volume Anomaly Z",
      weightPct: Math.round(nowcast.attribution.weights.volumeAnomaly * 100),
      score: nowcast.attribution.volumeAnomalyScore,
      detail: `${nowcast.latestVolZScore >= 0 ? "+" : ""}${nowcast.latestVolZScore.toFixed(2)}σ vs 30d`,
    },
    {
      label: "Wikimedia Syndromic Search Attention",
      weightPct: Math.round(nowcast.attribution.weights.wikiAttention * 100),
      score: nowcast.attribution.wikiAttentionScore,
      detail: "Localized disease & antiviral queries",
    },
    {
      label: "Open-Meteo Climate Vector Suitability",
      weightPct: Math.round(nowcast.attribution.weights.climateSuitability * 100),
      score: nowcast.attribution.climateSuitabilityScore,
      detail: "14d thermal & precipitation index",
    },
  ];

  const bannerStatus =
    nowcast.riskTier === "Critical" ? "error" : nowcast.riskTier === "High" ? "warning" : "info";

  const tierTokenColor =
    nowcast.riskTier === "Critical"
      ? "red"
      : nowcast.riskTier === "High"
        ? "orange"
        : nowcast.riskTier === "Moderate"
          ? "yellow"
          : "teal";

  return (
    <Card padding={5}>
      <VStack gap={4}>
        <HStack justify="between" align="center" gap={2} wrap="wrap">
          <VStack gap={0.5}>
            <Heading level={2}>Multi-Signal Risk Attribution</Heading>
            <Text type="supporting">
              Fusing market-neutral healthcare alpha with digital &amp; eco-climatic telemetry
            </Text>
          </VStack>
          <Token size="sm" color={tierTokenColor} label={`${nowcast.riskTier} Risk`} />
        </HStack>

        <VStack gap={3}>
          {factors.map((f) => {
            const variant =
              f.score >= 75
                ? "error"
                : f.score >= 55
                  ? "warning"
                  : f.score >= 35
                    ? "accent"
                    : "success";
            return (
              <VStack key={f.label} gap={1}>
                <HStack justify="between" align="center" gap={2}>
                  <Text type="body" weight="medium">
                    {f.label} ({f.weightPct}%)
                  </Text>
                  <Text type="supporting" hasTabularNumbers>
                    {f.detail} · {f.score.toFixed(0)}/100
                  </Text>
                </HStack>
                <ProgressBar
                  label={f.label}
                  value={f.score}
                  max={100}
                  variant={variant}
                  isLabelHidden
                />
              </VStack>
            );
          })}
        </VStack>

        <Banner
          status={bannerStatus}
          title={`${diseaseName} 14-day trajectory: ~${Math.round(nowcast.forecastTotal14d)} projected notifications`}
          description={
            nowcast.latestPharmaZScore >= 1.5
              ? "Pure-play diagnostics and therapeutic equities exhibit elevated abnormal accumulation ahead of regional confirmations."
              : "Equity and syndromic channels currently remain near seasonal baseline variance."
          }
        />
      </VStack>
    </Card>
  );
}
