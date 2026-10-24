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

/** Constant-time bearer token check (compares SHA-256 digests). */
async function tokensMatch(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [da, db] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const va = new Uint8Array(da);
  const vb = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

async function authorize(req: Request): Promise<boolean> {
  const expected = INGEST_TOKEN;
  // Fail closed: without a configured token anyone could write bogus metrics.
  if (!expected) return false;
  const auth = req.headers.get("authorization") ?? "";
  const presented = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  if (!presented) return false;
  return tokensMatch(presented, expected);
}

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
    // The Supabase REST probe needs an apikey header — without one PostgREST
    // answers 401 and the service reads as permanently degraded.
    const headers: Record<string, string> =
      service.name === "Supabase REST"
        ? {
            apikey:
              Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
              Deno.env.get("SUPABASE_ANON_KEY") ??
              Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
              "",
          }
        : {};
    const res = await fetch(url, { method: "GET", headers });
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
  try {
    if (!(await authorize(req))) {
      return new Response(
        INGEST_TOKEN ? "Unauthorized" : "Unauthorized: INGEST_TOKEN secret is not configured",
        { status: 401 },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      return new Response("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY secrets must both be set", {
        status: 500,
      });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const apiChecks = await Promise.all(SERVICES.map(checkService));
    if (apiChecks.length) {
      const { error } = await supabase.from("infra_api_uptime").insert(
        apiChecks.map((c) => ({
          service: c.service,
          status: c.status,
          latency_ms: c.latency_ms,
          error_message: c.error_message,
        })),
      );
      if (error) console.error("Failed to record API uptime", error);
    }

    const dbStart = Date.now();
    const { error: probeError } = await supabase
      .from("hanta_cases")
      .select("id", { count: "exact", head: true });
    if (probeError) {
      // The DB probe itself failed: recording a fabricated 1ms latency row
      // would hide the outage, so fail the check instead.
      console.error("DB probe failed", probeError);
      return new Response(`db probe failed: ${probeError.message}`, { status: 500 });
    }
    const latencyMs = Date.now() - dbStart;

    // Pool numbers are only real when pg_stat_activity answers. Otherwise
    // leave them NULL rather than deriving a fake value from latency.
    let poolUsed: number | null = null;
    let poolMax: number | null = null;
    let source = "unavailable";

    const { data: poolHealth, error: rpcError } = await supabase.rpc("get_db_pool_health");
    if (rpcError) console.error("get_db_pool_health failed", rpcError);
    if (poolHealth && Array.isArray(poolHealth) && poolHealth.length) {
      poolUsed = poolHealth[0].active_connections ?? null;
      poolMax = poolHealth[0].max_connections ?? null;
      source = "pg_stat_activity";
    }

    const { error: metricsError } = await supabase.from("infra_db_metrics").insert({
      latency_ms: latencyMs,
      pool_used: poolUsed,
      pool_max: poolMax,
      source,
    });
    if (metricsError) console.error("Failed to record DB metrics", metricsError);

    return Response.json({ ok: true, apiChecks: apiChecks.length });
  } catch (e) {
    console.error(e);
    return new Response(`error: ${(e as Error).message}`, { status: 500 });
  }
});
