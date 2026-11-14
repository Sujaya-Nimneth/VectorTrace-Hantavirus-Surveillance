import { useEffect, useMemo, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { TopNav, TopNavHeading } from "@astryxdesign/core/TopNav";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { CommandPalette } from "@astryxdesign/core/CommandPalette";
import { createStaticSource, type SearchableItem } from "@astryxdesign/core/Typeahead";
import { Popover } from "@astryxdesign/core/Popover";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Icon } from "@astryxdesign/core/Icon";
import { Badge } from "@astryxdesign/core/Badge";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { Avatar } from "@astryxdesign/core/Avatar";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Divider } from "@astryxdesign/core/Divider";
import { List, ListItem } from "@astryxdesign/core/List";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Timestamp } from "@astryxdesign/core/Timestamp";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Kbd } from "@astryxdesign/core/Kbd";
import { Selector } from "@astryxdesign/core/Selector";
import { Activity, Bell, LogIn, LogOut, MapPin, Moon, Search, Sun } from "lucide-react";

import { useCases, useRodents, useAlerts } from "@/hooks/use-surveillance";
import { useDiseaseFilter } from "@/hooks/use-disease-filter";
import { DISEASES, PHARMA_TICKERS, getDiseaseProfile, isDiseaseSlug } from "@/lib/diseases";
import { REGIONS } from "@/lib/mock-data";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { useTheme } from "@/hooks/use-theme";

const ALERTS_READ_KEY = "vectortrace_alerts_last_read";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Surveillance Dashboard",
  "/predictions": "Outbreak Predictor",
  "/map": "Geospatial Tracker",
  "/intake": "Rapid Case Intake",
  "/admin": "System Infrastructure",
};

type SearchTarget = {
  group: "Pages" | "Pathogens" | "Pharma Tickers" | "Regions" | "Cases" | "Sentinel Sites";
  subtitle: string;
  to: "/dashboard" | "/predictions" | "/map" | "/intake" | "/admin";
  search?: { case?: string; site?: string; region?: string; disease?: string };
  keywords: string[];
};

type PaletteItem = SearchableItem<SearchTarget>;

export function TopBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useRoles();
  const { theme, toggle } = useTheme();
  const { disease, setDisease } = useDiseaseFilter();
  const { data: cases = [] } = useCases(disease);
  const { data: rodents = [] } = useRodents(disease);
  const { data: alerts = [] } = useAlerts(disease);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertsReadAt, setAlertsReadAt] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(ALERTS_READ_KEY));
      return Number.isFinite(saved) && saved > 0 ? saved : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const unreadAlerts = useMemo(
    () => alerts.filter((a) => +new Date(a.createdAt) > alertsReadAt),
    [alerts, alertsReadAt],
  );

  const markAllRead = () => {
    const latest = Math.max(Date.now(), ...alerts.map((a) => +new Date(a.createdAt)));
    setAlertsReadAt(latest);
    try {
      localStorage.setItem(ALERTS_READ_KEY, String(latest));
    } catch {
      // Storage disabled; read state persists for this session only.
    }
  };

  const paletteItems = useMemo<PaletteItem[]>(() => {
    const pages: PaletteItem[] = [
      {
        id: "page:/dashboard",
        label: "Surveillance Dashboard",
        auxiliaryData: {
          group: "Pages",
          subtitle: "KPIs, epidemic curve, regional risk",
          to: "/dashboard",
          keywords: ["dashboard", "kpi", "metrics", "overview"],
        },
      },
      {
        id: "page:/predictions",
        label: "Outbreak Predictor",
        auxiliaryData: {
          group: "Pages",
          subtitle: "Bio-financial pharma alpha, volume anomalies & lead-lag nowcasts",
          to: "/predictions",
          keywords: ["predictions", "predictor", "stocks", "pharma", "nowcast", "alpha"],
        },
      },
      {
        id: "page:/map",
        label: "Geospatial Tracker",
        auxiliaryData: {
          group: "Pages",
          subtitle: "Multi-pathogen clusters & adaptive sentinel proximity",
          to: "/map",
          keywords: ["map", "geo", "clusters", "heatmap", "sentinels"],
        },
      },
      {
        id: "page:/intake",
        label: "Rapid Case Intake",
        auxiliaryData: {
          group: "Pages",
          subtitle: "4-step multi-disease field notification wizard",
          to: "/intake",
          keywords: ["intake", "submit", "case", "report"],
        },
      },
    ];

    if (isAdmin) {
      pages.push({
        id: "page:/admin",
        label: "System Infrastructure",
        auxiliaryData: {
          group: "Pages",
          subtitle: "Health checks, latency SLO, feed logs",
          to: "/admin",
          keywords: ["admin", "infra", "health", "logs"],
        },
      });
    }

    const pathogenItems: PaletteItem[] = DISEASES.map((d) => ({
      id: `pathogen:${d.slug}`,
      label: d.name,
      auxiliaryData: {
        group: "Pathogens",
        subtitle: `${d.casePrefix} · ICD-11 ${d.icd11} · ${d.category}`,
        to: "/predictions",
        search: { disease: d.slug },
        keywords: ["pathogen", "disease", d.slug, d.name, d.shortName, d.casePrefix, d.icd11],
      },
    }));

    const tickerItems: PaletteItem[] = PHARMA_TICKERS.map((t) => ({
      id: `ticker:${t.ticker}`,
      label: `${t.ticker} · ${t.companyName}`,
      auxiliaryData: {
        group: "Pharma Tickers",
        subtitle: `${t.sectorRole.replace("_", " ")} · ${t.exchange}`,
        to: "/predictions",
        keywords: ["stock", "pharma", "ticker", t.ticker, t.companyName, t.sectorRole],
      },
    }));

    const regionItems: PaletteItem[] = REGIONS.map((r) => ({
      id: `region:${r.name}`,
      label: r.name,
      auxiliaryData: {
        group: "Regions",
        subtitle: `Focus region · pop ${(r.pop / 1_000_000).toFixed(2)}M`,
        to: "/map",
        search: { region: r.name },
        keywords: ["region", r.name],
      },
    }));

    const caseItems: PaletteItem[] = cases.map((c) => {
      const profile = getDiseaseProfile(c.diseaseSlug);
      return {
        id: `case:${c.id}`,
        label: `${c.id} · ${c.region}`,
        auxiliaryData: {
          group: "Cases",
          subtitle: `${profile.shortName} · ${c.syndrome} · ${c.status} · ${c.date}`,
          to: "/map",
          search: { case: c.id },
          keywords: [c.id, profile.name, profile.shortName, c.region, c.syndrome, c.status],
        },
      };
    });

    const siteItems: PaletteItem[] = rodents.map((r) => {
      const profile = getDiseaseProfile(r.diseaseSlug);
      return {
        id: `site:${r.id}`,
        label: `${r.id} · ${r.species}`,
        auxiliaryData: {
          group: "Sentinel Sites",
          subtitle: `${profile.sentinelSingular} · ${r.region} · ${(r.positivity * 100).toFixed(0)}% positivity`,
          to: "/map",
          search: { site: r.id },
          keywords: [r.id, r.region, r.species, profile.shortName, profile.sentinelSingular],
        },
      };
    });

    return [...pages, ...pathogenItems, ...tickerItems, ...regionItems, ...caseItems, ...siteItems];
  }, [cases, rodents, isAdmin]);

  const searchSource = useMemo(
    () =>
      createStaticSource(paletteItems, {
        keywords: (item) => item.auxiliaryData?.keywords ?? [],
      }),
    [paletteItems],
  );

  const handlePaletteSelect = (id: string) => {
    const selected = paletteItems.find((item) => item.id === id);
    if (!selected?.auxiliaryData) return;
    setPaletteOpen(false);
    const { to, search } = selected.auxiliaryData;
    if (isDiseaseSlug(search?.disease)) {
      setDisease(search.disease);
    }
    void navigate({ to, search });
  };

  const diseaseFilterOptions = useMemo(
    () => [
      { value: "all", label: "All pathogens" },
      ...DISEASES.map((d) => ({ value: d.slug, label: `${d.shortName} (${d.casePrefix})` })),
    ],
    [],
  );

  const handleDiseaseChange = (val: string) => {
    const next = isDiseaseSlug(val) ? val : "all";
    setDisease(next);
    if (pathname === "/predictions" && next !== "all") {
      void navigate({ to: "/predictions", search: { disease: next }, replace: true });
    }
  };

  const pageTitle = ROUTE_TITLES[pathname] ?? "Workspace";

  return (
    <>
      <TopNav
        label="Application header"
        heading={
          <TopNavHeading
            logo={<Icon icon={Activity} size="md" color="accent" />}
            heading="VectorTrace"
            headingHref="/"
          />
        }
        startContent={
          <Breadcrumbs variant="supporting">
            <BreadcrumbItem href="/dashboard">Surveillance</BreadcrumbItem>
            <BreadcrumbItem isCurrent>{pageTitle}</BreadcrumbItem>
          </Breadcrumbs>
        }
        endContent={
          <HStack gap={2} align="center">
            <HStack align="center" className="hidden md:flex">
              <Selector
                label="Global pathogen filter"
                isLabelHidden
                variant="secondary"
                size="sm"
                width={184}
                options={diseaseFilterOptions}
                value={disease}
                onChange={handleDiseaseChange}
              />
            </HStack>
            <HStack gap={1.5} align="center" className="hidden sm:flex">
              <Button
                label="Search…"
                variant="secondary"
                size="sm"
                icon={<Icon icon={Search} size="sm" />}
                onClick={() => setPaletteOpen(true)}
              />
              <Kbd keys="mod+k" />
            </HStack>
            <HStack className="sm:hidden" align="center">
              <IconButton
                label="Search surveillance records"
                tooltip="Search (⌘K)"
                variant="secondary"
                size="sm"
                icon={<Icon icon={Search} size="sm" />}
                onClick={() => setPaletteOpen(true)}
              />
            </HStack>

            <Popover
              isOpen={alertsOpen}
              onOpenChange={setAlertsOpen}
              placement="below"
              alignment="end"
              padding={0}
              width={360}
              label="Surveillance alerts"
              content={
                <VStack gap={0}>
                  <HStack justify="between" align="center" paddingInline={3} paddingBlock={2}>
                    <Heading level={4}>Alerts</Heading>
                    {unreadAlerts.length > 0 && (
                      <Button label="Mark read" variant="ghost" size="sm" onClick={markAllRead} />
                    )}
                  </HStack>
                  <Divider />
                  {alerts.length === 0 ? (
                    <EmptyState
                      isCompact
                      title="No active alerts"
                      description="Regional surveillance feeds are nominal."
                    />
                  ) : (
                    <List edge="bleed" density="compact">
                      {alerts.slice(0, 6).map((alert) => {
                        const dotVariant =
                          alert.level === "critical"
                            ? "error"
                            : alert.level === "warning"
                              ? "warning"
                              : "accent";
                        const profile = getDiseaseProfile(alert.diseaseSlug);
                        const sourceLabel =
                          alert.signalSource === "market_divergence"
                            ? "Market Signal"
                            : alert.signalSource === "who_don"
                              ? "WHO DON"
                              : alert.signalSource === "composite_nowcast"
                                ? "Nowcast"
                                : "Field Sentinel";
                        const alertHref =
                          alert.signalSource === "market_divergence" ||
                          alert.signalSource === "composite_nowcast"
                            ? `/predictions?disease=${profile.slug}`
                            : `/map?region=${encodeURIComponent(alert.region)}`;
                        return (
                          <ListItem
                            key={alert.id}
                            align="start"
                            startContent={<StatusDot variant={dotVariant} label={alert.level} />}
                            label={alert.title}
                            description={`${profile.shortName} · ${alert.region} · ${sourceLabel}`}
                            endContent={
                              <Timestamp value={alert.createdAt} format="relative_short" />
                            }
                            href={alertHref}
                            onClick={() => setAlertsOpen(false)}
                          />
                        );
                      })}
                    </List>
                  )}
                </VStack>
              }
            >
              <Button
                label="Alerts"
                variant="ghost"
                size="sm"
                icon={<Icon icon={Bell} size="sm" />}
                endContent={
                  unreadAlerts.length > 0 ? (
                    <Badge variant="error" label={unreadAlerts.length} />
                  ) : undefined
                }
              />
            </Popover>

            <IconButton
              label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              tooltip={theme === "dark" ? "Light mode" : "Dark mode"}
              variant="ghost"
              size="sm"
              icon={<Icon icon={theme === "dark" ? Sun : Moon} size="sm" />}
              onClick={toggle}
            />

            {user ? (
              <DropdownMenu
                alignment="end"
                placement="below"
                renderTrigger={(triggerProps) => (
                  <IconButton
                    {...triggerProps}
                    label={user.email ?? "Account menu"}
                    variant="ghost"
                    size="sm"
                    icon={<Avatar name={user.email ?? "Operator"} size="sm" />}
                  />
                )}
                items={[
                  {
                    id: "account",
                    label: user.email ?? "Authenticated operator",
                    description: isAdmin ? "Administrator" : "Field epidemiologist",
                    isDisabled: true,
                  },
                  { type: "divider" },
                  {
                    id: "sign-out",
                    label: "Sign out",
                    icon: LogOut,
                    variant: "destructive",
                    onClick: () => {
                      void signOut();
                    },
                  },
                ]}
              />
            ) : (
              <Button
                label="Sign in"
                variant="secondary"
                size="sm"
                icon={<Icon icon={LogIn} size="sm" />}
                href="/login"
              />
            )}
          </HStack>
        }
      />

      <CommandPalette
        isOpen={paletteOpen}
        onOpenChange={setPaletteOpen}
        searchSource={searchSource}
        onValueChange={handlePaletteSelect}
        label="Search pathogens, pharma tickers, regions, cases, sentinel sites, and pages"
        emptySearchText="No matching surveillance records."
        renderItem={(item) => (
          <HStack justify="between" align="center" gap={3} width="100%">
            <HStack gap={2} align="center">
              <Icon icon={MapPin} size="sm" color="secondary" />
              <Text type="body" weight="medium">
                {item.label}
              </Text>
            </HStack>
            {item.auxiliaryData?.subtitle && (
              <Text type="supporting">{item.auxiliaryData.subtitle}</Text>
            )}
          </HStack>
        )}
      />
    </>
  );
}
