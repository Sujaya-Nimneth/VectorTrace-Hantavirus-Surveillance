import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { useNavigate, useSearch } from "@tanstack/react-router";

import { Layout, LayoutContent, LayoutFooter, LayoutHeader } from "@astryxdesign/core/Layout";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { ToggleButton, ToggleButtonGroup } from "@astryxdesign/core/ToggleButton";
import { Selector } from "@astryxdesign/core/Selector";
import { Drawer, DrawerHeader } from "@astryxdesign/core/Drawer";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Token } from "@astryxdesign/core/Token";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { List, ListItem } from "@astryxdesign/core/List";
import { Banner } from "@astryxdesign/core/Banner";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Divider } from "@astryxdesign/core/Divider";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";

import { useCases, useRodents } from "@/hooks/use-surveillance";
import { useDiseaseFilter } from "@/hooks/use-disease-filter";
import { useNow } from "@/hooks/use-now";
import { getDiseaseProfile, type SentinelType } from "@/lib/diseases";
import { REGIONS, type Case, type RodentSite } from "@/lib/mock-data";
import { DAY_MS } from "@/lib/time";
import { getMapTileConfig } from "@/lib/map-config";
import { isPlottable } from "@/lib/geo";
import { QueryError } from "@/components/QueryError";

const mapTile = getMapTileConfig();

type HeatLayerInstance = L.Layer & {
  setLatLngs: (latlngs: [number, number, number][]) => void;
};

type LeafletWithHeat = typeof L & {
  heatLayer: (
    latlngs: [number, number, number][],
    options?: Record<string, unknown>,
  ) => HeatLayerInstance;
};

const RANGES: Array<{ days: 7 | 30 | 90; label: string }> = [
  { days: 7, label: "7D" },
  { days: 30, label: "30D" },
  { days: 90, label: "90D" },
];

function createSentinelIcon(shapeSvg: string) {
  return L.divIcon({
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">${shapeSvg}</svg>`,
  });
}

const SENTINEL_ICONS: Record<SentinelType, L.DivIcon> = {
  rodent_trap: createSentinelIcon(
    `<polygon points="10,2 18,16 2,16" fill="#0d9488" stroke="#f8fafc" stroke-width="1.5"/>`,
  ),
  mosquito_ovitrap: createSentinelIcon(
    `<rect x="4" y="4" width="12" height="12" rx="2" fill="#0284c7" stroke="#f8fafc" stroke-width="1.5"/>`,
  ),
  avian_sentinel: createSentinelIcon(
    `<polygon points="10,2 18,10 10,18 2,10" fill="#d97706" stroke="#f8fafc" stroke-width="1.5"/>`,
  ),
  wastewater_node: createSentinelIcon(
    `<polygon points="10,2 17,6 17,14 10,18 3,14 3,6" fill="#7c3aed" stroke="#f8fafc" stroke-width="1.5"/>`,
  ),
};

function HeatLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();
  const layerRef = useRef<HeatLayerInstance | null>(null);

  useEffect(() => {
    const Lheat = L as LeafletWithHeat;
    if (!Lheat.heatLayer) return;
    if (!layerRef.current) {
      layerRef.current = Lheat.heatLayer(points, {
        radius: 28,
        blur: 20,
        maxZoom: 11,
        gradient: { 0.2: "#0d9488", 0.55: "#f59e0b", 0.9: "#dc2626" },
      }).addTo(map);
    } else {
      layerRef.current.setLatLngs(points);
    }
  }, [map, points]);

  useEffect(() => {
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map]);

  return null;
}

function MapController({
  targetCase,
  targetSite,
  targetRegion,
}: {
  targetCase?: Case;
  targetSite?: RodentSite;
  targetRegion?: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (targetCase && isPlottable(targetCase)) {
      map.flyTo([targetCase.lat, targetCase.lng], 8, { duration: 0.7 });
      return;
    }
    if (targetSite && isPlottable(targetSite)) {
      map.flyTo([targetSite.lat, targetSite.lng], 9, { duration: 0.7 });
      return;
    }
    if (targetRegion) {
      const found = REGIONS.find((r) => r.name === targetRegion);
      if (found) {
        map.flyTo([found.lat, found.lng], 6, { duration: 0.7 });
      }
    }
  }, [map, targetCase, targetSite, targetRegion]);

  return null;
}

type PlottedCase = Case & { lat: number; lng: number };

const CaseDot = memo(function CaseDot({
  c,
  isSelected,
  onSelect,
}: {
  c: PlottedCase;
  isSelected: boolean;
  onSelect: (c: Case) => void;
}) {
  const fillColor =
    c.status === "Confirmed" ? "#dc2626" : c.status === "Suspected" ? "#d97706" : "#2563eb";

  return (
    <CircleMarker
      center={[c.lat, c.lng]}
      radius={isSelected ? 8 : 6}
      pathOptions={{
        color: isSelected ? "#ffffff" : "#f8fafc",
        weight: isSelected ? 2.5 : 1.5,
        fillColor,
        fillOpacity: 0.9,
      }}
      eventHandlers={{ click: () => onSelect(c) }}
    />
  );
});

const SentinelPin = memo(function SentinelPin({ r }: { r: RodentSite }) {
  const profile = getDiseaseProfile(r.diseaseSlug);
  const sentinelType = r.sentinelType ?? profile.sentinelType;
  return (
    <Marker position={[r.lat, r.lng]} icon={SENTINEL_ICONS[sentinelType]}>
      <Popup>
        <VStack gap={1}>
          <Text type="label" weight="semibold">
            {r.id} · {r.region}
          </Text>
          <Text type="supporting">
            {profile.sentinelSingular} · {r.species} · {(r.positivity * 100).toFixed(0)}% positive
          </Text>
          <Text type="supporting">
            {profile.shortName} · Sampled {r.date}
          </Text>
        </VStack>
      </Popup>
    </Marker>
  );
});

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function MapView() {
  const search = useSearch({ from: "/map" });
  const navigate = useNavigate();
  const now = useNow();
  const { disease } = useDiseaseFilter();

  const {
    data: cases = [],
    loading: casesLoading,
    error: casesError,
    refetch: refetchCases,
  } = useCases(disease);
  const {
    data: rodents = [],
    loading: rodentsLoading,
    error: rodentsError,
    refetch: refetchRodents,
  } = useRodents(disease);

  const [days, setDays] = useState<7 | 30 | 90>(90);
  const selectedRegion = search.region ?? "all";
  const [activeLayers, setActiveLayers] = useState<string[]>(["cases", "rodents", "heat"]);
  const [lastViewedCase, setLastViewedCase] = useState<Case | null>(null);

  const urlCase = useMemo(
    () => (search.case ? (cases.find((c) => c.id === search.case) ?? null) : null),
    [search.case, cases],
  );
  const drawerOpen = Boolean(urlCase);
  const selectedCase = urlCase ?? lastViewedCase;

  const targetCase = useMemo(
    () => (search.case ? cases.find((c) => c.id === search.case) : undefined),
    [cases, search.case],
  );
  const targetSite = useMemo(
    () => (search.site ? rodents.find((r) => r.id === search.site) : undefined),
    [rodents, search.site],
  );

  const cutoff = now - days * DAY_MS;

  const visibleCases = useMemo(() => {
    return cases.filter((c): c is PlottedCase => {
      if (!isPlottable(c)) return false;
      if (+new Date(c.date) < cutoff) return false;
      if (selectedRegion !== "all" && c.region !== selectedRegion) return false;
      return true;
    });
  }, [cases, cutoff, selectedRegion]);

  const visibleRodents = useMemo(() => {
    return rodents.filter((r) => {
      if (!isPlottable(r)) return false;
      if (selectedRegion !== "all" && r.region !== selectedRegion) return false;
      return true;
    });
  }, [rodents, selectedRegion]);

  const heatPoints = useMemo<[number, number, number][]>(() => {
    const casePts: [number, number, number][] = visibleCases.map((c) => [
      c.lat,
      c.lng,
      c.status === "Confirmed" ? 0.95 : 0.65,
    ]);
    const rodentPts: [number, number, number][] = visibleRodents.map((r) => [
      r.lat,
      r.lng,
      Math.max(0.35, r.positivity),
    ]);
    return [...casePts, ...rodentPts];
  }, [visibleCases, visibleRodents]);

  const handleSelectCase = useCallback(
    (c: Case) => {
      setLastViewedCase(c);
      void navigate({
        to: "/map",
        search: { case: c.id, region: selectedRegion !== "all" ? selectedRegion : undefined },
        replace: true,
      });
    },
    [navigate, selectedRegion],
  );

  const handleDrawerOpenChange = useCallback(
    (open: boolean) => {
      if (!open && urlCase) {
        setLastViewedCase(urlCase);
        void navigate({
          to: "/map",
          search: selectedRegion !== "all" ? { region: selectedRegion } : {},
          replace: true,
        });
      }
    },
    [navigate, urlCase, selectedRegion],
  );

  const handleRegionChange = useCallback(
    (region: string) => {
      void navigate({
        to: "/map",
        search: region === "all" ? {} : { region },
        replace: true,
      });
    },
    [navigate],
  );

  const selectedProfile = selectedCase ? getDiseaseProfile(selectedCase.diseaseSlug) : null;
  const proximityKm = selectedProfile?.proximityRadiusKm ?? 5;

  const nearbyRodents = useMemo(() => {
    if (!selectedCase || !isPlottable(selectedCase)) return [];
    const lat = selectedCase.lat;
    const lng = selectedCase.lng;
    const radiusKm = getDiseaseProfile(selectedCase.diseaseSlug).proximityRadiusKm;
    return rodents
      .filter(isPlottable)
      .map((site) => ({
        site,
        distanceKm: haversineKm(lat, lng, site.lat, site.lng),
      }))
      .filter((entry) => entry.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [selectedCase, rodents]);

  const showCases = activeLayers.includes("cases");
  const showRodents = activeLayers.includes("rodents");
  const showHeat = activeLayers.includes("heat");

  const queryError = casesError || rodentsError;
  const loading = casesLoading || rodentsLoading;

  const regionOptions = [
    { value: "all", label: "All regions" },
    ...REGIONS.map((r) => ({ value: r.name, label: r.name })),
  ];

  const statusTokenColor =
    selectedCase?.status === "Confirmed"
      ? "red"
      : selectedCase?.status === "Suspected"
        ? "orange"
        : "blue";

  return (
    <Layout height="fill" padding={0}>
      <LayoutHeader hasDivider>
        <HStack
          justify="between"
          align="center"
          gap={3}
          wrap="wrap"
          paddingInline={4}
          paddingBlock={2}
        >
          <HStack gap={3} align="center" wrap="wrap">
            <Heading level={1}>Geospatial Tracker</Heading>
            <SegmentedControl
              label="Date window"
              size="sm"
              value={String(days)}
              onChange={(v) => setDays(Number(v) as 7 | 30 | 90)}
            >
              {RANGES.map((r) => (
                <SegmentedControlItem key={r.days} value={String(r.days)} label={r.label} />
              ))}
            </SegmentedControl>

            <Selector
              label="Focus region"
              isLabelHidden
              variant="secondary"
              size="sm"
              width={168}
              options={regionOptions}
              value={selectedRegion}
              onChange={handleRegionChange}
            />
          </HStack>

          <ToggleButtonGroup
            type="multiple"
            label="Map data layers"
            size="sm"
            value={activeLayers}
            onChange={(vals) => setActiveLayers((vals as string[]) ?? [])}
          >
            <ToggleButton value="cases" label="Human cases">
              Cases
            </ToggleButton>
            <ToggleButton value="rodents" label="Sentinel sites">
              Sentinels
            </ToggleButton>
            <ToggleButton value="heat" label="Density heat">
              Heat
            </ToggleButton>
          </ToggleButtonGroup>
        </HStack>
      </LayoutHeader>

      <LayoutContent padding={0} isScrollable={false}>
        <VStack width="100%" height="100%" minHeight={480}>
          {queryError && (
            <VStack padding={3}>
              <QueryError
                what="geospatial telemetry"
                error={queryError}
                onRetry={() => {
                  void refetchCases();
                  void refetchRodents();
                }}
              />
            </VStack>
          )}

          {loading ? (
            <Center height="100%" minHeight={480}>
              <Spinner size="lg" label="Loading case & reservoir coordinates…" />
            </Center>
          ) : (
            <MapContainer center={[-34, -64]} zoom={4} className="h-full w-full z-0 bg-map-canvas">
              <TileLayer
                attribution={mapTile.attribution}
                url={mapTile.url}
                maxNativeZoom={mapTile.maxNativeZoom}
              />

              <MapController
                targetCase={targetCase}
                targetSite={targetSite}
                targetRegion={selectedRegion !== "all" ? selectedRegion : undefined}
              />

              {showHeat && <HeatLayer points={heatPoints} />}

              {showCases &&
                visibleCases.map((c) => (
                  <CaseDot
                    key={c.id}
                    c={c}
                    isSelected={selectedCase?.id === c.id && drawerOpen}
                    onSelect={handleSelectCase}
                  />
                ))}

              {showCases && selectedCase && isPlottable(selectedCase) && drawerOpen && (
                <Circle
                  center={[selectedCase.lat, selectedCase.lng]}
                  radius={proximityKm * 1000}
                  pathOptions={{
                    color: selectedProfile?.chartColor ?? "#0d9488",
                    weight: 1.5,
                    dashArray: "4 4",
                    fillColor: selectedProfile?.chartColor ?? "#0d9488",
                    fillOpacity: 0.08,
                  }}
                />
              )}

              {showRodents && visibleRodents.map((r) => <SentinelPin key={r.id} r={r} />)}
            </MapContainer>
          )}
        </VStack>
      </LayoutContent>

      <LayoutFooter hasDivider>
        <HStack
          justify="between"
          align="center"
          gap={4}
          wrap="wrap"
          paddingInline={4}
          paddingBlock={2}
        >
          <HStack gap={4} align="center" wrap="wrap">
            <HStack gap={1.5} align="center">
              <StatusDot variant="error" label="Confirmed case" />
              <Text type="supporting">Confirmed</Text>
            </HStack>
            <HStack gap={1.5} align="center">
              <StatusDot variant="warning" label="Suspected case" />
              <Text type="supporting">Suspected</Text>
            </HStack>
            <HStack gap={1.5} align="center">
              <StatusDot variant="accent" label="Pending lab" />
              <Text type="supporting">Pending</Text>
            </HStack>
            <HStack gap={1.5} align="center">
              <StatusDot variant="success" label="Sentinel site" />
              <Text type="supporting">Sentinel site</Text>
            </HStack>
          </HStack>

          <Text type="supporting" hasTabularNumbers>
            {visibleCases.length} plotted cases · {visibleRodents.length} sentinel sites ·{" "}
            {selectedProfile ? `${proximityKm} km (${selectedProfile.shortName})` : "1.5–10 km"}{" "}
            proximity check
          </Text>
        </HStack>
      </LayoutFooter>

      <Drawer
        isOpen={drawerOpen && Boolean(selectedCase)}
        onOpenChange={handleDrawerOpenChange}
        label="Case epidemiological details"
        side="end"
        width={400}
        hasScrim={false}
        padding={4}
      >
        {selectedCase && selectedProfile && (
          <VStack gap={4}>
            <DrawerHeader
              title={selectedCase.id}
              subtitle={`${selectedCase.region} · Onset ${selectedCase.date}`}
              onOpenChange={handleDrawerOpenChange}
              hasDivider
            />

            <HStack gap={2} align="center" wrap="wrap">
              <Token color={statusTokenColor} label={selectedCase.status} />
              <Token color="teal" label={selectedProfile.shortName} />
              <Token color="blue" label={selectedCase.syndrome} />
            </HStack>

            <MetadataList columns={2} title="Patient & exposure">
              <MetadataListItem label="Pathogen">{selectedProfile.name}</MetadataListItem>
              <MetadataListItem label="Syndrome">{selectedCase.syndrome}</MetadataListItem>
              <MetadataListItem label="Onset date">{selectedCase.date}</MetadataListItem>
              <MetadataListItem label="Age / Sex">
                {selectedCase.age != null ? `${selectedCase.age}y` : "Unknown"} ·{" "}
                {selectedCase.sex ?? "—"}
              </MetadataListItem>
              <MetadataListItem label="Exposure">
                {selectedCase.exposure ?? "Not recorded"}
              </MetadataListItem>
            </MetadataList>

            <VStack gap={2}>
              <Heading level={3}>Clinical symptoms</Heading>
              {selectedCase.symptoms.length > 0 ? (
                <HStack gap={1.5} wrap="wrap">
                  {selectedCase.symptoms.map((sym) => (
                    <Token key={sym} size="sm" label={sym} />
                  ))}
                </HStack>
              ) : (
                <Text type="supporting">No symptoms recorded.</Text>
              )}
            </VStack>

            <Divider />

            <VStack gap={3}>
              <Heading level={3}>Sentinel proximity (&le; {proximityKm} km)</Heading>
              {nearbyRodents.length > 0 ? (
                <VStack gap={2}>
                  <Banner
                    status="warning"
                    title={`${nearbyRodents.length} positive ${selectedProfile.sentinelSingular.toLowerCase()}(s) within ${proximityKm} km`}
                    description={`Coordinates intersect active ${selectedProfile.shortName} (${selectedProfile.category}) monitoring radius.`}
                  />
                  <List edge="outset" density="compact">
                    {nearbyRodents.map(({ site, distanceKm }) => (
                      <ListItem
                        key={site.id}
                        label={site.id}
                        description={`${site.species} · ${distanceKm.toFixed(1)} km away`}
                        endContent={
                          <Text type="supporting" weight="semibold" hasTabularNumbers>
                            {(site.positivity * 100).toFixed(0)}%
                          </Text>
                        }
                        href={`/map?site=${encodeURIComponent(site.id)}`}
                      />
                    ))}
                  </List>
                </VStack>
              ) : (
                <EmptyState
                  isCompact
                  title={`No sentinels within ${proximityKm} km`}
                  description={`No recorded ${selectedProfile.sentinelLabel.toLowerCase()} fall inside the ${proximityKm} km monitoring radius of this case.`}
                />
              )}
            </VStack>
          </VStack>
        )}
      </Drawer>
    </Layout>
  );
}
