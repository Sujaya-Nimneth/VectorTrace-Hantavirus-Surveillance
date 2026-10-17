// deno-lint-ignore-file
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SERVICES = [
  { name: "Firecrawl", url: "https://api.firecrawl.dev" },
  {
    name: "WHO Disease Outbreak News",
    url: "https://www.who.int/emergencies/disease-outbreak-news",
  },
  { name: "Supabase REST", url: "{{SUPABASE_URL}}/rest/v1/" },
];

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const INGEST_TOKEN = Deno.env.get("INGEST_TOKEN");

function mapStatus(code: number | null, error: string | null) {
  if (error) return "down";
  if (code === null) return "down";
  if (code >= 500) return "down";
  if (code >= 400) return "warn";
  return "ok";
}

async function checkService(service: { name: string; url: string }) {
  const url = service.url.replace("{{SUPABASE_URL}}", SUPABASE_URL);
  const start = Date.now();
  try {
    const res = await fetch(url, { method: "GET" });
    const latency = Date.now() - start;
    return {
      service: service.name,
      status: mapStatus(res.status, null),
      latency_ms: latency,
      error_message: res.ok ? null : `HTTP ${res.status}`,
    };
  } catch (e) {
    return {
      service: service.name,
      status: "down",
      latency_ms: null,
      error_message: (e as Error).message,
    };
  }
}

Deno.serve(async (req) => {
  if (INGEST_TOKEN) {
    const auth = req.headers.get("authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
    if (!token || token !== INGEST_TOKEN) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const apiChecks = await Promise.all(SERVICES.map(checkService));
  if (apiChecks.length) {
    await supabase.from("infra_api_uptime").insert(
      apiChecks.map((c) => ({
        service: c.service,
        status: c.status,
        latency_ms: c.latency_ms,
        error_message: c.error_message,
      })),
    );
  }

  const dbStart = Date.now();
  await supabase.from("hanta_cases").select("id", { count: "exact", head: true });
  const latencyMs = Math.max(1, Date.now() - dbStart);

  let poolUsed = Math.max(1, Math.round(latencyMs / 4));
  let poolMax = 100;
  let source = "simulated";

  const { data: poolHealth } = await supabase.rpc("get_db_pool_health");
  if (poolHealth && Array.isArray(poolHealth) && poolHealth.length) {
    poolUsed = poolHealth[0].active_connections ?? poolUsed;
    poolMax = poolHealth[0].max_connections ?? poolMax;
    source = "pg_stat_activity";
  }

  await supabase.from("infra_db_metrics").insert({
    latency_ms: latencyMs,
    pool_used: poolUsed,
    pool_max: poolMax,
    source,
  });

  return Response.json({ ok: true, apiChecks: apiChecks.length });
});
