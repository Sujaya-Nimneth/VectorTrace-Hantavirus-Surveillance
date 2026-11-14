import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { isDemoMode } from "@/lib/demo-mode";
import { getDiseaseProfile, isDiseaseSlug, type SentinelType } from "@/lib/diseases";
import type { Case, RodentSite, Alert } from "@/lib/mock-data";
import { CASES as MOCK_CASES } from "@/lib/mock-cases";
import { RODENTS as MOCK_RODENTS } from "@/lib/mock-rodents";
import { ALERTS as MOCK_ALERTS } from "@/lib/mock-alerts";
import type { DiseaseFilter } from "@/hooks/use-disease-filter";

/** Full row (authenticated) or the public projection (anonymous). */
type DbCase = Tables<"hanta_cases"> | Tables<"hanta_cases_public">;

type DbRodent = Tables<"rodent_sites">;

type DbAlert = Tables<"hanta_alerts">;

const VALID_SENTINEL_TYPES = new Set<SentinelType>([
  "rodent_trap",
  "mosquito_ovitrap",
  "avian_sentinel",
  "wastewater_node",
]);

const VALID_SIGNAL_SOURCES = new Set<NonNullable<Alert["signalSource"]>>([
  "clinical",
  "who_don",
  "market_divergence",
  "composite_nowcast",
]);

const mapCase = (r: DbCase): Case => {
  const diseaseSlug = isDiseaseSlug(r.disease_slug) ? r.disease_slug : "hantavirus";
  return {
    id: r.case_id,
    diseaseSlug,
    region: r.region,
    lat: r.lat ?? null,
    lng: r.lng ?? null,
    date: r.reported_at,
    syndrome: r.syndrome,
    status: r.status,
    age: "age" in r ? (r.age ?? null) : null,
    sex: "sex" in r ? (r.sex ?? null) : null,
    symptoms: "symptoms" in r ? (r.symptoms ?? []) : [],
    exposure: "exposure" in r ? (r.exposure ?? null) : null,
  };
};

const mapRodent = (r: DbRodent): RodentSite => {
  const diseaseSlug = isDiseaseSlug(r.disease_slug) ? r.disease_slug : "hantavirus";
  const sentinelType = VALID_SENTINEL_TYPES.has(r.sentinel_type as SentinelType)
    ? (r.sentinel_type as SentinelType)
    : getDiseaseProfile(diseaseSlug).sentinelType;
  return {
    id: r.site_id,
    diseaseSlug,
    sentinelType,
    region: r.region,
    lat: r.lat,
    lng: r.lng,
    date: r.sampled_at,
    positivity: Number(r.positivity),
    species: r.species,
  };
};

const mapAlert = (r: DbAlert): Alert => {
  const diseaseSlug = isDiseaseSlug(r.disease_slug) ? r.disease_slug : "hantavirus";
  const signalSource = VALID_SIGNAL_SOURCES.has(
    r.signal_source as NonNullable<Alert["signalSource"]>,
  )
    ? (r.signal_source as NonNullable<Alert["signalSource"]>)
    : "clinical";
  return {
    id: r.id,
    diseaseSlug,
    signalSource,
    createdAt: r.created_at,
    level: r.level,
    title: r.title,
    region: r.region,
  };
};

async function fetchCases(): Promise<Case[]> {
  if (isDemoMode()) return MOCK_CASES;
  const { data: sessionData } = await supabase.auth.getSession();
  const select =
    sessionData.session === null
      ? supabase.from("hanta_cases_public").select("*")
      : supabase.from("hanta_cases").select("*");
  const { data: rows, error } = await select.order("reported_at", { ascending: false }).limit(500);
  if (error) throw new Error(`Failed to load cases: ${error.message}`);
  return (rows as DbCase[]).map(mapCase);
}

async function fetchRodents(): Promise<RodentSite[]> {
  if (isDemoMode()) return MOCK_RODENTS;
  const { data: rows, error } = await supabase
    .from("rodent_sites")
    .select("*")
    .order("sampled_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(`Failed to load sentinel sites: ${error.message}`);
  return (rows as DbRodent[]).map(mapRodent);
}

async function fetchAlerts(): Promise<Alert[]> {
  if (isDemoMode()) return MOCK_ALERTS;
  const { data: rows, error } = await supabase
    .from("hanta_alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw new Error(`Failed to load alerts: ${error.message}`);
  return (rows as DbAlert[]).map(mapAlert);
}

const subscribedClients = new WeakMap<QueryClient, Set<string>>();

function ensureRealtimeSubscription(
  queryClient: QueryClient,
  table: "hanta_cases" | "rodent_sites" | "hanta_alerts",
) {
  if (typeof window === "undefined") return;
  let tables = subscribedClients.get(queryClient);
  if (!tables) {
    tables = new Set();
    subscribedClients.set(queryClient, tables);
  }
  if (tables.has(table)) return;
  tables.add(table);

  try {
    supabase
      .channel(`rt-shared-${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
        if (table === "hanta_cases" && payload.eventType === "INSERT") {
          const added = mapCase(payload.new as DbCase);
          queryClient.setQueryData<Case[]>(["hanta_cases"], (prev = []) => [
            added,
            ...prev.filter((c) => c.id !== added.id),
          ]);
        } else if (table === "rodent_sites" && payload.eventType === "INSERT") {
          const added = mapRodent(payload.new as DbRodent);
          queryClient.setQueryData<RodentSite[]>(["rodent_sites"], (prev = []) => [
            added,
            ...prev.filter((r) => r.id !== added.id),
          ]);
        } else if (table === "hanta_alerts" && payload.eventType === "INSERT") {
          const added = mapAlert(payload.new as DbAlert);
          queryClient.setQueryData<Alert[]>(["hanta_alerts"], (prev = []) =>
            [added, ...prev.filter((a) => a.id !== added.id)].slice(0, 30),
          );
        } else {
          queryClient.invalidateQueries({ queryKey: [table] });
        }
      })
      .subscribe();
  } catch {
    // Ignore realtime subscription errors when offline or unconfigured
  }
}

function useRealtime(table: "hanta_cases" | "rodent_sites" | "hanta_alerts") {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isDemoMode()) ensureRealtimeSubscription(queryClient, table);
  }, [queryClient, table]);
}

function filterByDisease<T extends { diseaseSlug?: string }>(
  items: T[],
  diseaseFilter?: DiseaseFilter,
): T[] {
  if (!diseaseFilter || diseaseFilter === "all") return items;
  return items.filter((item) => (item.diseaseSlug ?? "hantavirus") === diseaseFilter);
}

export function useCases(diseaseFilter: DiseaseFilter = "all") {
  useRealtime("hanta_cases");

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["hanta_cases"],
    queryFn: fetchCases,
    staleTime: 60_000,
  });

  const filtered = useMemo(() => filterByDisease(data ?? [], diseaseFilter), [data, diseaseFilter]);

  return { data: filtered, allCases: data ?? [], loading: isPending, error, refetch };
}

export function useRodents(diseaseFilter: DiseaseFilter = "all") {
  useRealtime("rodent_sites");

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["rodent_sites"],
    queryFn: fetchRodents,
    staleTime: 60_000,
  });

  const filtered = useMemo(() => filterByDisease(data ?? [], diseaseFilter), [data, diseaseFilter]);

  return { data: filtered, allSites: data ?? [], loading: isPending, error, refetch };
}

export const useSentinels = useRodents;

export function useAlerts(diseaseFilter: DiseaseFilter = "all") {
  useRealtime("hanta_alerts");

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["hanta_alerts"],
    queryFn: fetchAlerts,
    staleTime: 60_000,
  });

  const filtered = useMemo(() => filterByDisease(data ?? [], diseaseFilter), [data, diseaseFilter]);

  return { data: filtered, allAlerts: data ?? [], loading: isPending, error, refetch };
}
