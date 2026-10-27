import { useEffect } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { isDemoMode } from "@/lib/demo-mode";
import type { Case, RodentSite, Alert } from "@/lib/mock-data";
import { CASES as MOCK_CASES } from "@/lib/mock-cases";
import { RODENTS as MOCK_RODENTS } from "@/lib/mock-rodents";
import { ALERTS as MOCK_ALERTS } from "@/lib/mock-alerts";

/** Full row (authenticated) or the public projection (anonymous). */
type DbCase = Tables<"hanta_cases"> | Tables<"hanta_cases_public">;

type DbRodent = Tables<"rodent_sites">;

type DbAlert = Tables<"hanta_alerts">;

const mapCase = (r: DbCase): Case => ({
  id: r.case_id,
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
});

const mapRodent = (r: DbRodent): RodentSite => ({
  id: r.site_id,
  region: r.region,
  lat: r.lat,
  lng: r.lng,
  date: r.sampled_at,
  positivity: Number(r.positivity),
  species: r.species,
});

const mapAlert = (r: DbAlert): Alert => ({
  id: r.id,
  createdAt: r.created_at,
  level: r.level,
  title: r.title,
  region: r.region,
});

async function fetchCases(): Promise<Case[]> {
  if (isDemoMode()) return MOCK_CASES;
  // Anonymous sessions read the public view (no clinical columns);
  // signed-in readers get the full table through RLS.
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
  if (error) throw new Error(`Failed to load rodent sites: ${error.message}`);
  return (rows as DbRodent[]).map(mapRodent);
}

async function fetchAlerts(): Promise<Alert[]> {
  if (isDemoMode()) return MOCK_ALERTS;
  const { data: rows, error } = await supabase
    .from("hanta_alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(`Failed to load alerts: ${error.message}`);
  return (rows as DbAlert[]).map(mapAlert);
}

// Track active realtime subscriptions per QueryClient so we only open 1 channel per table
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
            [added, ...prev.filter((a) => a.id !== added.id)].slice(0, 20),
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

export function useCases() {
  useRealtime("hanta_cases");

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["hanta_cases"],
    queryFn: fetchCases,
    staleTime: 60_000,
  });

  return { data: data ?? [], loading: isPending, error, refetch };
}

export function useRodents() {
  useRealtime("rodent_sites");

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["rodent_sites"],
    queryFn: fetchRodents,
    staleTime: 60_000,
  });

  return { data: data ?? [], loading: isPending, error, refetch };
}

export function useAlerts() {
  useRealtime("hanta_alerts");

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["hanta_alerts"],
    queryFn: fetchAlerts,
    staleTime: 60_000,
  });

  return { data: data ?? [], loading: isPending, error, refetch };
}
