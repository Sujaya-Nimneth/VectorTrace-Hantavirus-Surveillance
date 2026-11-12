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
import { Activity, ArrowRight, FilePlus2, MapPin, Moon, Sun } from "lucide-react";

import { useCases, useRodents } from "@/hooks/use-surveillance";
import { useTheme } from "@/hooks/use-theme";
import { REGIONS } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({ meta: [{ title: "VectorTrace · Hantavirus Epidemiological Surveillance" }] }),
});

const SUBSYSTEMS = [
  {
    name: "Surveillance Overview",
    cadence: "30s poll",
    contract: "30d / 90d epidemic curve & regional incidence / 100k",
    href: "/dashboard",
    cta: "Open overview",
  },
  {
    name: "Geospatial Proximity Tracker",
    cadence: "On focus",
    contract: "5 km Haversine overlap against Sigmodontinae trap sites",
    href: "/map",
    cta: "Open map",
  },
  {
    name: "Rapid Case Intake",
    cadence: "Real-time",
    contract: "4-step validated notification with browser draft recovery",
    href: "/intake",
    cta: "Submit case",
  },
  {
    name: "Infrastructure Diagnostics",
    cadence: "30s probe",
    contract: "Cron cadence, 220ms DB latency SLO & system feed logs",
    href: "/admin",
    cta: "Inspect ops",
  },
];

function LandingPage() {
  const { theme, toggle } = useTheme();
  const { data: cases = [] } = useCases();
  const { data: rodents = [] } = useRodents();
  const [previewTab, setPreviewTab] = useState<"corridors" | "cases">("corridors");

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
        <Section padding={8}>
          <Center axis="horizontal" width="100%">
            <VStack maxWidth={1160} width="100%">
              <Grid columns={{ minWidth: 320, max: 2, repeat: "fit" }} gap={8} align="center">
                <VStack gap={5}>
                  <Heading level={1} type="display-1">
                    Regional Hantavirus Vector &amp; Case Surveillance
                  </Heading>

                  <Text type="large" color="secondary">
                    Monitor six Southern Cone health corridors in real time — pairing human syndrome
                    notifications with Sigmodontinae reservoir trapping data inside 5 km proximity
                    radii.
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
                      label="Explore cluster map"
                      variant="secondary"
                      size="lg"
                      icon={<Icon icon={MapPin} size="sm" />}
                      href="/map"
                    />
                    <Button
                      label="Submit case"
                      variant="ghost"
                      size="lg"
                      icon={<Icon icon={FilePlus2} size="sm" />}
                      href="/intake"
                    />
                  </HStack>

                  <MetadataList columns={3} orientation="horizontal">
                    <MetadataListItem label="Sentinel regions">6 active corridors</MetadataListItem>
                    <MetadataListItem label="Spatial check">5 km vector radius</MetadataListItem>
                    <MetadataListItem label="Telemetry sync">30s feed cadence</MetadataListItem>
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
                        onChange={(v) => setPreviewTab(v as "corridors" | "cases")}
                      >
                        <SegmentedControlItem value="corridors" label="Corridors" />
                        <SegmentedControlItem value="cases" label="Recent cases" />
                      </SegmentedControl>
                    </HStack>

                    {previewTab === "corridors" ? (
                      <Table density="compact" dividers="rows" hasHover>
                        <TableHeader>
                          <TableRow>
                            <TableHeaderCell>Corridor</TableHeaderCell>
                            <TableHeaderCell>Cases</TableHeaderCell>
                            <TableHeaderCell>Trap sites</TableHeaderCell>
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
                    ) : (
                      <Table density="compact" dividers="rows" hasHover>
                        <TableHeader>
                          <TableRow>
                            <TableHeaderCell>Case ID</TableHeaderCell>
                            <TableHeaderCell>Region</TableHeaderCell>
                            <TableHeaderCell>Syndrome</TableHeaderCell>
                            <TableHeaderCell>Status</TableHeaderCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentCases.map((c) => (
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
                              <TableCell>{c.region}</TableCell>
                              <TableCell>{c.syndrome}</TableCell>
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
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </VStack>
                </Card>
              </Grid>
            </VStack>
          </Center>
        </Section>

        <Section variant="muted" padding={8} dividers={["top"]}>
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

      <LayoutFooter hasDivider>
        <HStack
          justify="between"
          align="center"
          gap={4}
          wrap="wrap"
          paddingInline={6}
          paddingBlock={4}
        >
          <Text type="supporting" size="xsm">
            VectorTrace · Hantavirus Epidemiological Surveillance
          </Text>
          <HStack gap={4}>
            <Link href="/dashboard" isStandalone={false}>
              Dashboard
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
