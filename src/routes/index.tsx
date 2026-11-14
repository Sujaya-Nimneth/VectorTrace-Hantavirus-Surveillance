import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopNav, TopNavHeading, TopNavItem } from "@astryxdesign/core/TopNav";
import { Layout, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { Center } from "@astryxdesign/core/Center";
import { Section } from "@astryxdesign/core/Section";
import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Icon } from "@astryxdesign/core/Icon";
import { Link } from "@astryxdesign/core/Link";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Token } from "@astryxdesign/core/Token";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@astryxdesign/core/Table";
import { Activity, ArrowRight, MapPin, Moon, Sun, TrendingUp } from "lucide-react";

import { useCases, useRodents } from "@/hooks/use-surveillance";
import { useAllDiseaseNowcasts } from "@/hooks/use-market-signals";
import { useTheme } from "@/hooks/use-theme";
import { getDiseaseProfile } from "@/lib/diseases";
import { REGIONS } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [{ title: "VectorTrace · Multi-Disease Surveillance & Outbreak Predictor" }],
  }),
});

const SUBSYSTEMS = [
  {
    name: "Surveillance Overview",
    cadence: "30s poll",
    contract: "30d / 90d multi-pathogen epidemic curves & regional incidence / 100k",
    href: "/dashboard",
    cta: "Open overview",
  },
  {
    name: "Bio-Financial Outbreak Predictor",
    cadence: "Daily sync",
    contract: "Market-neutral pharma & diagnostics CAR, volume Z-scores & +7–21d lead-lag nowcasts",
    href: "/predictions",
    cta: "Open predictor",
  },
  {
    name: "Geospatial Proximity Tracker",
    cadence: "On focus",
    contract: "Adaptive 2–15 km Haversine overlap across 4 vector & wastewater sentinel types",
    href: "/map",
    cta: "Open map",
  },
  {
    name: "Rapid Case Intake",
    cadence: "Real-time",
    contract: "4-step multi-pathogen validated notification with draft recovery",
    href: "/intake",
    cta: "Submit case",
  },
  {
    name: "Infrastructure Diagnostics",
    cadence: "30s probe",
    contract: "Cron cadence, 220ms DB latency SLO & Yahoo Finance / Wikimedia / WHO probes",
    href: "/admin",
    cta: "Inspect ops",
  },
];

function LandingPage() {
  const { theme, toggle } = useTheme();
  const { data: cases = [] } = useCases();
  const { data: rodents = [] } = useRodents();
  const { data: nowcasts } = useAllDiseaseNowcasts();
  const [previewTab, setPreviewTab] = useState<"corridors" | "forecast" | "cases">("corridors");

  const forecastRows = useMemo(
    () =>
      [...nowcasts]
        .sort((a, b) => b.nowcast.compositeOutbreakRisk - a.nowcast.compositeOutbreakRisk)
        .slice(0, 6),
    [nowcasts],
  );

  const corridorRows = useMemo(() => {
    return REGIONS.map((region) => {
      const regionCases = cases.filter((c) => c.region === region.name);
      const regionSites = rodents.filter((r) => r.region === region.name);
      const confirmed = regionCases.filter((c) => c.status === "Confirmed").length;
      const rate = region.pop > 0 ? (regionCases.length / region.pop) * 100_000 : 0;
      return {
        region: region.name,
        total: regionCases.length,
        confirmed,
        sites: regionSites.length,
        rate,
      };
    })
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);
  }, [cases, rodents]);

  const recentCases = useMemo(() => cases.slice(0, 5), [cases]);

  return (
    <Layout height="auto" padding={0}>
      <TopNav
        label="Public surveillance header"
        heading={
          <TopNavHeading
            logo={<Icon icon={Activity} size="md" color="accent" />}
            heading="VectorTrace"
            headingHref="/"
          />
        }
        startContent={
          <HStack gap={1} align="center">
            <TopNavItem label="Dashboard" href="/dashboard" />
            <TopNavItem label="Outbreak Predictor" href="/predictions" />
            <TopNavItem label="Geo Tracker" href="/map" />
            <TopNavItem label="Case Intake" href="/intake" />
          </HStack>
        }
        endContent={
          <HStack gap={2} align="center">
            <IconButton
              label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              tooltip={theme === "dark" ? "Light mode" : "Dark mode"}
              variant="ghost"
              size="sm"
              icon={<Icon icon={theme === "dark" ? Sun : Moon} size="sm" />}
              onClick={toggle}
            />
            <Button label="Sign in" variant="secondary" size="sm" href="/login" />
            <Button label="Open console" variant="primary" size="sm" href="/dashboard" />
          </HStack>
        }
      />

      <LayoutContent padding={0} isScrollable={false}>
        <Section paddingInline={6} paddingBlock={8}>
          <Center axis="horizontal" width="100%">
            <VStack maxWidth={1160} width="100%">
              <Grid columns={{ minWidth: 320, max: 2, repeat: "fit" }} gap={8} align="center">
                <VStack gap={5}>
                  <Heading level={1} type="display-1">
                    VectorTrace Surveillance
                  </Heading>

                  <Text type="large" color="secondary">
                    Monitor six epidemiologically distinct pathogens across Southern Cone sentinel
                    corridors — fusing human clinical intake, adaptive vector radii, and
                    market-neutral pharmaceutical alpha nowcasts.
                  </Text>

                  <HStack gap={3} align="center" wrap="wrap">
                    <Button
                      label="Open dashboard"
                      variant="primary"
                      size="lg"
                      endContent={<Icon icon={ArrowRight} size="sm" />}
                      href="/dashboard"
                    />
                    <Button
                      label="Outbreak predictor"
                      variant="secondary"
                      size="lg"
                      icon={<Icon icon={TrendingUp} size="sm" />}
                      href="/predictions"
                    />
                    <Button
                      label="Explore map"
                      variant="ghost"
                      size="lg"
                      icon={<Icon icon={MapPin} size="sm" />}
                      href="/map"
                    />
                  </HStack>

                  <MetadataList columns={3} orientation="horizontal">
                    <MetadataListItem label="Monitored pathogens">
                      6 active diseases
                    </MetadataListItem>
                    <MetadataListItem label="Spatial check">2–15 km vector radii</MetadataListItem>
                    <MetadataListItem label="Market nowcast">17 equity tickers</MetadataListItem>
                  </MetadataList>
                </VStack>

                <Card padding={5} data-ui="live-surveillance-preview">
                  <VStack gap={4}>
                    <HStack justify="between" align="center" gap={3} wrap="wrap">
                      <HStack gap={2} align="center">
                        <StatusDot variant="success" label="Live surveillance preview" isPulsing />
                        <Heading level={2}>Live Corridor Snapshot</Heading>
                      </HStack>
                      <SegmentedControl
                        label="Preview dataset"
                        size="sm"
                        value={previewTab}
                        onChange={(v) => setPreviewTab(v as "corridors" | "forecast" | "cases")}
                      >
                        <SegmentedControlItem value="corridors" label="Corridors" />
                        <SegmentedControlItem value="forecast" label="Risk forecast" />
                        <SegmentedControlItem value="cases" label="Recent cases" />
                      </SegmentedControl>
                    </HStack>

                    {previewTab === "corridors" ? (
                      <Table density="compact" dividers="rows" hasHover>
                        <TableHeader>
                          <TableRow>
                            <TableHeaderCell>Corridor</TableHeaderCell>
                            <TableHeaderCell>Cases</TableHeaderCell>
                            <TableHeaderCell>Sentinel sites</TableHeaderCell>
                            <TableHeaderCell>Incidence / 100k</TableHeaderCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {corridorRows.map((row) => (
                            <TableRow key={row.region}>
                              <TableCell>
                                <Link
                                  href={`/map?region=${encodeURIComponent(row.region)}`}
                                  isStandalone={false}
                                >
                                  <Text type="body" weight="medium">
                                    {row.region}
                                  </Text>
                                </Link>
                              </TableCell>
                              <TableCell>
                                <Text type="body" hasTabularNumbers weight="semibold">
                                  {row.total}
                                </Text>
                              </TableCell>
                              <TableCell>
                                <Text type="body" hasTabularNumbers color="secondary">
                                  {row.sites}
                                </Text>
                              </TableCell>
                              <TableCell>
                                <Token
                                  size="sm"
                                  color={row.rate >= 2 ? "red" : row.rate >= 1 ? "orange" : "teal"}
                                  label={row.rate.toFixed(2)}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : previewTab === "forecast" ? (
                      <Table density="compact" dividers="rows" hasHover>
                        <TableHeader>
                          <TableRow>
                            <TableHeaderCell>Pathogen</TableHeaderCell>
                            <TableHeaderCell>7d Pharma alpha</TableHeaderCell>
                            <TableHeaderCell>Lead</TableHeaderCell>
                            <TableHeaderCell>Risk score</TableHeaderCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {forecastRows.map(({ disease: d, nowcast }) => (
                            <TableRow key={d.slug}>
                              <TableCell>
                                <Link
                                  href={`/predictions?disease=${encodeURIComponent(d.slug)}`}
                                  isStandalone={false}
                                >
                                  <Text type="body" weight="medium">
                                    {d.shortName}
                                  </Text>
                                </Link>
                              </TableCell>
                              <TableCell>
                                <Text type="body" hasTabularNumbers weight="semibold">
                                  {nowcast.latestCar7d >= 0 ? "+" : ""}
                                  {(nowcast.latestCar7d * 100).toFixed(1)}%
                                </Text>
                              </TableCell>
                              <TableCell>
                                <Text type="body" hasTabularNumbers color="secondary">
                                  +{nowcast.optimalLeadDays}d
                                </Text>
                              </TableCell>
                              <TableCell>
                                <Token
                                  size="sm"
                                  color={
                                    nowcast.compositeOutbreakRisk >= 70
                                      ? "red"
                                      : nowcast.compositeOutbreakRisk >= 45
                                        ? "orange"
                                        : "teal"
                                  }
                                  label={`${nowcast.compositeOutbreakRisk.toFixed(0)}/100`}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <Table density="compact" dividers="rows" hasHover>
                        <TableHeader>
                          <TableRow>
                            <TableHeaderCell>Case ID</TableHeaderCell>
                            <TableHeaderCell>Pathogen</TableHeaderCell>
                            <TableHeaderCell>Region</TableHeaderCell>
                            <TableHeaderCell>Status</TableHeaderCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentCases.map((c) => {
                            const profile = getDiseaseProfile(c.diseaseSlug);
                            return (
                              <TableRow key={c.id}>
                                <TableCell>
                                  <Link
                                    href={`/map?case=${encodeURIComponent(c.id)}`}
                                    isStandalone={false}
                                  >
                                    <Text type="code" weight="medium">
                                      {c.id}
                                    </Text>
                                  </Link>
                                </TableCell>
                                <TableCell>{profile.shortName}</TableCell>
                                <TableCell>{c.region}</TableCell>
                                <TableCell>
                                  <Token
                                    size="sm"
                                    color={
                                      c.status === "Confirmed"
                                        ? "red"
                                        : c.status === "Suspected"
                                          ? "orange"
                                          : "blue"
                                    }
                                    label={c.status}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </VStack>
                </Card>
              </Grid>
            </VStack>
          </Center>
        </Section>

        <Section variant="muted" paddingInline={6} paddingBlock={8}>
          <Center axis="horizontal" width="100%">
            <VStack gap={5} maxWidth={1160} width="100%">
              <VStack gap={1}>
                <Heading level={2}>Operational Surveillance Modules</Heading>
                <Text type="supporting">
                  Direct entry points into regional analytics, cluster mapping, field intake, and
                  pipeline observability.
                </Text>
              </VStack>

              <Card padding={0}>
                <Table density="balanced" dividers="rows" hasHover>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Module</TableHeaderCell>
                      <TableHeaderCell>Refresh cadence</TableHeaderCell>
                      <TableHeaderCell>Operational contract</TableHeaderCell>
                      <TableHeaderCell>Destination</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SUBSYSTEMS.map((sub) => (
                      <TableRow key={sub.name}>
                        <TableCell>
                          <Text type="body" weight="semibold">
                            {sub.name}
                          </Text>
                        </TableCell>
                        <TableCell>
                          <Text type="supporting" hasTabularNumbers>
                            {sub.cadence}
                          </Text>
                        </TableCell>
                        <TableCell>
                          <Text type="body" color="secondary">
                            {sub.contract}
                          </Text>
                        </TableCell>
                        <TableCell>
                          <Link href={sub.href} isStandalone={false}>
                            {sub.cta}
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </VStack>
          </Center>
        </Section>
      </LayoutContent>

      <LayoutFooter>
        <HStack
          justify="between"
          align="center"
          gap={4}
          wrap="wrap"
          paddingInline={6}
          paddingBlock={4}
        >
          <Text type="supporting">
            VectorTrace · Multi-Disease Epidemiological Surveillance &amp; Outbreak Predictor
          </Text>
          <HStack gap={4}>
            <Link href="/dashboard" isStandalone={false}>
              Dashboard
            </Link>
            <Link href="/predictions" isStandalone={false}>
              Outbreak Predictor
            </Link>
            <Link href="/map" isStandalone={false}>
              Geo Tracker
            </Link>
            <Link href="/intake" isStandalone={false}>
              Case Intake
            </Link>
          </HStack>
        </HStack>
      </LayoutFooter>
    </Layout>
  );
}
