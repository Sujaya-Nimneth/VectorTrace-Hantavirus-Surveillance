import { useEffect } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Case, RodentSite, Alert } from "@/lib/mock-data";
import { CASES as MOCK_CASES } from "@/lib/mock-cases";
import { RODENTS as MOCK_RODENTS } from "@/lib/mock-rodents";
import { ALERTS as MOCK_ALERTS } from "@/lib/mock-alerts";

type DbCase = {
  id: string;
  case_id: string;
  region: string;
  lat: number;
  lng: number;
  reported_at: string;
  syndrome: "HPS" | "HFRS";
  status: "Confirmed" | "Suspected" | "Pending";
  age: number | null;
  sex: "M" | "F" | null;
};

type DbRodent = {
  id: string;
  site_id: string;
  region: string;
  lat: number;
  lng: number;
  sampled_at: string;
  positivity: number;
  species: string;
};

type DbAlert = {
  id: string;
  level: "critical" | "warning" | "info";
  title: string;
  region: string;
  created_at: string;
};

const mapCase = (r: DbCase): Case => ({
  id: r.case_id,
  region: r.region,
  lat: r.lat,
  lng: r.lng,
  date: r.reported_at,
  syndrome: r.syndrome,
  status: r.status,
  age: r.age ?? 0,
  sex: r.sex ?? "M",
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

function relativeTime(iso: string) {
  const diff = Math.max(0, (Date.now() - +new Date(iso)) / 1000);
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const mapAlert = (r: DbAlert): Alert => ({
  id: r.id,
  ts: relativeTime(r.created_at),
  level: r.level,
  title: r.title,
  region: r.region,
});

function mergeById<T extends { id: string }>(live: T[], fallback: T[], minCount: number): T[] {
  if (live.length >= minCount) return live;
  const seen = new Set(live.map((item) => item.id));
  return [...live, ...fallback.filter((item) => !seen.has(item.id))];
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
          queryClient.setQueryData<Case[]>(["hanta_cases"], (prev = MOCK_CASES) => [
            added,
            ...prev.filter((c) => c.id !== added.id),
          ]);
        } else if (table === "rodent_sites" && payload.eventType === "INSERT") {
          const added = mapRodent(payload.new as DbRodent);
          queryClient.setQueryData<RodentSite[]>(["rodent_sites"], (prev = MOCK_RODENTS) => [
            added,
            ...prev.filter((r) => r.id !== added.id),
          ]);
        } else if (table === "hanta_alerts" && payload.eventType === "INSERT") {
          const added = mapAlert(payload.new as DbAlert);
          queryClient.setQueryData<Alert[]>(["hanta_alerts"], (prev = MOCK_ALERTS) =>
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

export function useCases() {
  const queryClient = useQueryClient();

  useEffect(() => {
    ensureRealtimeSubscription(queryClient, "hanta_cases");
  }, [queryClient]);

  const { data = MOCK_CASES, isLoading } = useQuery({
    queryKey: ["hanta_cases"],
    queryFn: async (): Promise<Case[]> => {
      try {
        const { data: rows, error } = await supabase
          .from("hanta_cases")
          .select("*")
          .order("reported_at", { ascending: false })
          .limit(500);
        if (error || !rows) return MOCK_CASES;
        const mapped = (rows as DbCase[]).map(mapCase);
        return mergeById(mapped, MOCK_CASES, 25);
      } catch {
        return MOCK_CASES;
      }
    },
    initialData: MOCK_CASES,
    staleTime: 60_000,
  });

  return { data, loading: isLoading };
}

export function useRodents() {
  const queryClient = useQueryClient();

  useEffect(() => {
    ensureRealtimeSubscription(queryClient, "rodent_sites");
  }, [queryClient]);

  const { data = MOCK_RODENTS } = useQuery({
    queryKey: ["rodent_sites"],
    queryFn: async (): Promise<RodentSite[]> => {
      try {
        const { data: rows, error } = await supabase
          .from("rodent_sites")
          .select("*")
          .order("sampled_at", { ascending: false })
          .limit(500);
        if (error || !rows) return MOCK_RODENTS;
        const mapped = (rows as DbRodent[]).map(mapRodent);
        return mergeById(mapped, MOCK_RODENTS, 15);
      } catch {
        return MOCK_RODENTS;
      }
    },
    initialData: MOCK_RODENTS,
    staleTime: 60_000,
  });

  return data;
}

export function useAlerts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    ensureRealtimeSubscription(queryClient, "hanta_alerts");
  }, [queryClient]);

  const { data = MOCK_ALERTS, isLoading } = useQuery({
    queryKey: ["hanta_alerts"],
    queryFn: async (): Promise<Alert[]> => {
      try {
        const { data: rows, error } = await supabase
          .from("hanta_alerts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);
        if (error || !rows) return MOCK_ALERTS;
        const mapped = (rows as DbAlert[]).map(mapAlert);
        return mergeById(mapped, MOCK_ALERTS, 4).slice(0, 20);
      } catch {
        return MOCK_ALERTS;
      }
    },
    initialData: MOCK_ALERTS,
    staleTime: 60_000,
  });

  return { data, loading: isLoading };
}
