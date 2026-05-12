/**
 * Supabase Edge Function: ingest-don-feed
 * --------------------------------------
 * Pulls WHO Disease Outbreak News (DONs) using Firecrawl and writes
 * normalized rows into `hanta_cases` and `hanta_alerts`.
 *
 * Required tables (run as a migration in your Supabase project):
 *
 *   create table public.hanta_cases (
 *     id uuid primary key default gen_random_uuid(),
 *     external_id text unique,
 *     region text not null,
 *     lat double precision,
 *     lng double precision,
 *     reported_at timestamptz not null,
 *     syndrome text check (syndrome in ('HPS','HFRS')),
 *     status text check (status in ('Confirmed','Suspected','Pending')),
 *     source text,
 *     raw jsonb,
 *     created_at timestamptz default now()
 *   );
 *   alter table public.hanta_cases enable row level security;
 *
 *   create table public.hanta_alerts (
 *     id uuid primary key default gen_random_uuid(),
 *     level text check (level in ('critical','warning','info')),
 *     title text not null,
 *     region text,
 *     emitted_at timestamptz default now()
 *   );
 *   alter table public.hanta_alerts enable row level security;
 *
 * Required secrets (set via Supabase Dashboard or .env):
 *   FIRECRAWL_API_KEY          – Firecrawl bearer token
 *   SUPABASE_URL               – auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY  – auto-injected
 * Optional:
 *   INGEST_TOKEN               – bearer token to protect the endpoint
 *
 * Schedule via pg_cron (twice daily, 02:00 and 14:00 UTC):
 *
 *   select cron.schedule(
 *     'sync_don_twice_daily',
 *     '0 2,14 * * *',
 *     $$ select net.http_post(
 *          url := 'https://<PROJECT_REF>.supabase.co/functions/v1/ingest-don-feed',
 *          headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_token'))
 *        ); $$
 *   );
 */

// deno-lint-ignore-file
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FIRECRAWL_SCRAPE_ENDPOINT = "https://api.firecrawl.dev/v2/scrape";
const SOURCE_URL = "https://www.who.int/emergencies/disease-outbreak-news";

const INGEST_SOURCE = "WHO Disease Outbreak News";
const INGEST_TOKEN = Deno.env.get("INGEST_TOKEN");

Deno.serve(async (req) => {
  const startedAt = new Date();
  let ingestedCount = 0;
  let supabase: ReturnType<typeof createClient> | null = null;
  try {
    if (INGEST_TOKEN) {
      const auth = req.headers.get("authorization") ?? "";
      const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
      if (!token || token !== INGEST_TOKEN) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // --- Step 1: Scrape the WHO DON page using Firecrawl ---
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response("FIRECRAWL_API_KEY secret is not set", { status: 500 });
    }

    const scrape = await fetch(FIRECRAWL_SCRAPE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({
        url: SOURCE_URL,
        formats: [
          "markdown",
          {
            type: "json",
            schema: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      case_id: { type: "string", description: "A unique identifier for the DON item, e.g. slug or URL path segment" },
                      region: { type: "string", description: "Country or region name" },
                      lat: { type: "number", description: "Approximate latitude of the region" },
                      lng: { type: "number", description: "Approximate longitude of the region" },
                      reported_at: { type: "string", description: "Date of the report in ISO 8601 format" },
                      syndrome: { type: "string", enum: ["HPS", "HFRS"], description: "Hantavirus syndrome type" },
                      status: { type: "string", enum: ["Confirmed", "Suspected", "Pending"], description: "Case status" },
                      summary: { type: "string", description: "Brief summary of the outbreak news item" },
                    },
                    required: ["case_id", "region", "reported_at"],
                  },
                },
              },
              required: ["items"],
            },
          },
        ],
        onlyMainContent: true,
        timeout: 120000,
      }),
    });

    if (!scrape.ok) {
      const errText = await scrape.text();
      return new Response(`scrape failed: ${scrape.status} – ${errText}`, { status: 502 });
    }

    const scrapeResult = await scrape.json();

    // Firecrawl returns { success, data: { json: { ... }, markdown, ... } }
    const jsonData = scrapeResult?.data?.json ?? scrapeResult?.data ?? {};
    const rawItems: any[] = Array.isArray(jsonData)
      ? jsonData
      : jsonData?.items ?? [];

    // Filter for hantavirus-related items only
    const hantaKeywords = ["hantavirus", "hanta", "hps", "hfrs", "hemorrhagic fever with renal syndrome", "hantavirus pulmonary syndrome"];
    const items = rawItems.filter((it) => {
      const text = JSON.stringify(it).toLowerCase();
      return hantaKeywords.some((kw) => text.includes(kw));
    });

    const cases = items.map((it) => ({
      case_id: it.case_id ?? it.external_id ?? `don-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      region: it.region ?? "Unknown",
      lat: it.lat ?? 0,
      lng: it.lng ?? 0,
      reported_at: it.reported_at ?? new Date().toISOString(),
      syndrome: it.syndrome ?? "HPS",
      status: it.status ?? "Suspected",
    }));

    if (cases.length === 0) {
      // No hantavirus items found – log the run but don't error
      try {
        await supabase.from("infra_ingest_runs").insert({
          source: INGEST_SOURCE,
          status: "success",
          started_at: startedAt.toISOString(),
          finished_at: new Date().toISOString(),
          records_ingested: 0,
          error_message: null,
        });
      } catch (logError) {
        console.error("Failed to record ingest run", logError);
      }

      return Response.json({
        ok: true,
        ingested: 0,
        alerts: 0,
        note: `Scraped ${rawItems.length} DON items, none matched hantavirus keywords.`,
      });
    }

    const { data: inserted, error } = await supabase
      .from("hanta_cases")
      .upsert(cases, { onConflict: "case_id", ignoreDuplicates: true })
      .select("id, region, status");

    if (error) throw error;
    ingestedCount = inserted?.length ?? 0;

    // Emit a critical alert for every confirmed case ingested in this run.
    const alerts = (inserted ?? [])
      .filter((c) => c.status === "Confirmed")
      .map((c) => ({
        level: "critical",
        title: `New confirmed hantavirus case ingested from WHO DON`,
        region: c.region,
      }));
    if (alerts.length) await supabase.from("hanta_alerts").insert(alerts);

    try {
      await supabase.from("infra_ingest_runs").insert({
        source: INGEST_SOURCE,
        status: "success",
        started_at: startedAt.toISOString(),
        finished_at: new Date().toISOString(),
        records_ingested: ingestedCount,
        error_message: null,
      });
    } catch (logError) {
      console.error("Failed to record ingest run", logError);
    }

    return Response.json({
      ok: true,
      ingested: ingestedCount,
      alerts: alerts.length,
    });
  } catch (e) {
    console.error(e);
    if (supabase) {
      try {
        await supabase.from("infra_ingest_runs").insert({
          source: INGEST_SOURCE,
          status: "failed",
          started_at: startedAt.toISOString(),
          finished_at: new Date().toISOString(),
          records_ingested: ingestedCount,
          error_message: (e as Error).message,
        });
      } catch (logError) {
        console.error("Failed to record ingest run", logError);
      }
    }
    return new Response(`error: ${(e as Error).message}`, { status: 500 });
  }
});
