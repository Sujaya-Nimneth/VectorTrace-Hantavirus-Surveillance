import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Case, RodentSite, Alert } from "@/lib/mock-data";

type DbCase = {
  id: string; case_id: string; region: string; lat: number; lng: number;
  reported_at: string; syndrome: "HPS" | "HFRS";
  status: "Confirmed" | "Suspected" | "Pending";
  age: number | null; sex: "M" | "F" | null;
};
type DbRodent = {
  id: string; site_id: string; region: string; lat: number; lng: number;
  sampled_at: string; positivity: number; species: string;
};
type DbAlert = {
  id: string; level: "critical" | "warning" | "info";
  title: string; region: string; created_at: string;
};

const mapCase = (r: DbCase): Case => ({
  id: r.case_id, region: r.region, lat: r.lat, lng: r.lng,
  date: r.reported_at, syndrome: r.syndrome, status: r.status,
  age: r.age ?? 0, sex: (r.sex ?? "M") as "M" | "F",
});
const mapRodent = (r: DbRodent): RodentSite => ({
  id: r.site_id, region: r.region, lat: r.lat, lng: r.lng,
  date: r.sampled_at, positivity: Number(r.positivity), species: r.species,
});

function relativeTime(iso: string) {
  const diff = (Date.now() - +new Date(iso)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
const mapAlert = (r: DbAlert): Alert => ({
  id: r.id, ts: relativeTime(r.created_at),
  level: r.level, title: r.title, region: r.region,
});

export function useCases() {
  const [data, setData] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("hanta_cases").select("*").order("reported_at", { ascending: false }).limit(500)
      .then(({ data: rows }) => { setData((rows ?? []).map(mapCase as any)); setLoading(false); });
    const ch = supabase.channel("rt-cases")
      .on("postgres_changes", { event: "*", schema: "public", table: "hanta_cases" }, payload => {
        if (payload.eventType === "INSERT") setData(d => [mapCase(payload.new as DbCase), ...d]);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  return { data, loading };
}

export function useRodents() {
  const [data, setData] = useState<RodentSite[]>([]);
  useEffect(() => {
    supabase.from("rodent_sites").select("*").order("sampled_at", { ascending: false }).limit(500)
      .then(({ data: rows }) => setData((rows ?? []).map(mapRodent as any)));
    const ch = supabase.channel("rt-rodents")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "rodent_sites" }, payload => {
        setData(d => [mapRodent(payload.new as DbRodent), ...d]);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  return data;
}

export function useAlerts() {
  const [data, setData] = useState<Alert[]>([]);
  useEffect(() => {
    supabase.from("hanta_alerts").select("*").order("created_at", { ascending: false }).limit(20)
      .then(({ data: rows }) => setData((rows ?? []).map(mapAlert as any)));
    const ch = supabase.channel("rt-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "hanta_alerts" }, payload => {
        setData(d => [mapAlert(payload.new as DbAlert), ...d].slice(0, 20));
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  return data;
}
