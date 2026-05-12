/**
 * Supabase Edge Function: ingest-don-feed
 * --------------------------------------
 * Pulls WHO Disease Outbreak News (DONs) using ScrapeGraphAI and writes
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
 *   SCRAPEGRAPH_API_KEY    – ScrapeGraphAI bearer token
 *   SUPABASE_URL           – auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY – auto-injected
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

const SCRAPE_ENDPOINT = "https://api.scrapegraphai.com/v1/smartscraper";
const SOURCE_URL = "https://www.who.int/emergencies/disease-outbreak-news";

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const scrape = await fetch(SCRAPE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SCRAPEGRAPH_API_KEY")}`,
      },
      body: JSON.stringify({
        website_url: SOURCE_URL,
        user_prompt:
          "Extract every Disease Outbreak News item mentioning hantavirus. " +
          "Return a JSON array with: external_id, region, lat, lng, " +
          "reported_at (ISO8601), syndrome (HPS|HFRS), status (Confirmed|Suspected|Pending), summary.",
      }),
    });

    if (!scrape.ok) {
      return new Response(`scrape failed: ${scrape.status}`, { status: 502 });
    }
    const { result } = await scrape.json();
    const items: any[] = Array.isArray(result) ? result : result?.items ?? [];

    const cases = items.map((it) => ({
      external_id: it.external_id,
      region: it.region ?? "Unknown",
      lat: it.lat ?? null,
      lng: it.lng ?? null,
      reported_at: it.reported_at ?? new Date().toISOString(),
      syndrome: it.syndrome ?? "HPS",
      status: it.status ?? "Suspected",
      source: "WHO_DON",
      raw: it,
    }));

    const { data: inserted, error } = await supabase
      .from("hanta_cases")
      .upsert(cases, { onConflict: "external_id", ignoreDuplicates: true })
      .select("id, region, status");

    if (error) throw error;

    // Emit a critical alert for every confirmed case ingested in this run.
    const alerts = (inserted ?? [])
      .filter((c) => c.status === "Confirmed")
      .map((c) => ({
        level: "critical",
        title: `New confirmed hantavirus case ingested from WHO DON`,
        region: c.region,
      }));
    if (alerts.length) await supabase.from("hanta_alerts").insert(alerts);

    return Response.json({
      ok: true,
      ingested: inserted?.length ?? 0,
      alerts: alerts.length,
    });
  } catch (e) {
    console.error(e);
    return new Response(`error: ${(e as Error).message}`, { status: 500 });
  }
});
