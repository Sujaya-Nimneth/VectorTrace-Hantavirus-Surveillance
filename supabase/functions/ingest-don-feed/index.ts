/**
 * Supabase Edge Function: ingest-don-feed
 * --------------------------------------
 * Pulls WHO Disease Outbreak News (DONs) using Firecrawl and writes
 * normalized rows into `hanta_cases` and `hanta_alerts` (upsert on case_id),
 * logging each run to `infra_ingest_runs`.
 *
 * Expected tables (see supabase/migrations): public.hanta_cases, public.hanta_alerts,
 * public.infra_ingest_runs — all with RLS enabled.
 *
 * Required secrets (set via Supabase Dashboard):
 *   FIRECRAWL_API_KEY           – Firecrawl bearer token
 *   INGEST_TOKEN                – bearer token that callers must present.
 *                                 The endpoint fails CLOSED while unset.
 *   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY – auto-injected
 *
 * Scheduling is configured by the infra_cron_schedule migration (pg_cron
 * `ingest_don_twice_daily` at 02:00 and 14:00 UTC, reading its invocation URL
 * and token from public.infra_config).
 */

// deno-lint-ignore-file
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FIRECRAWL_SCRAPE_ENDPOINT = "https://api.firecrawl.dev/v2/scrape";
const SOURCE_URL = "https://www.who.int/emergencies/disease-outbreak-news";

const INGEST_SOURCE = "WHO Disease Outbreak News";
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
  // Fail closed: without a configured token the endpoint stays locked so
  // anonymous callers can't burn Firecrawl credits.
  if (!expected) return false;
  const auth = req.headers.get("authorization") ?? "";
  const presented = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  if (!presented) return false;
  return tokensMatch(presented, expected);
}

type RawDonItem = {
  case_id?: string;
  external_id?: string;
  region?: string;
  lat?: number;
  lng?: number;
  reported_at?: string;
  syndrome?: "HPS" | "HFRS";
  status?: "Confirmed" | "Suspected" | "Pending";
  summary?: string;
};

type NormalizedCase = {
  case_id: string;
  region: string;
  lat: number;
  lng: number;
  reported_at: string;
  syndrome: "HPS" | "HFRS";
  status: "Confirmed" | "Suspected" | "Pending";
};

/**
 * Deterministic fallback id (FNV-1a) so re-ingesting the same DON item
 * dedupes via the case_id unique constraint instead of inserting duplicates.
 */
function stableCaseId(seed: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `DON-${(h >>> 0).toString(36).toUpperCase().padStart(7, "0")}`;
}

function normalizeItem(
  it: RawDonItem,
): { ok: true; value: NormalizedCase } | { ok: false; reason: string } {
  const region = typeof it.region === "string" && it.region.trim() ? it.region.trim() : "Unknown";

  const lat = it.lat;
  const lng = it.lng;
  if (typeof lat !== "number" || !Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { ok: false, reason: `item for ${region}: missing or invalid lat` };
  }
  if (typeof lng !== "number" || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    return { ok: false, reason: `item for ${region}: missing or invalid lng` };
  }

  let reportedAt = new Date().toISOString();
  if (it.reported_at != null) {
    const d = new Date(it.reported_at);
    if (Number.isNaN(d.getTime())) {
      return { ok: false, reason: `item for ${region}: invalid reported_at "${it.reported_at}"` };
    }
    reportedAt = d.toISOString();
  }

  const syndrome = it.syndrome ?? "HPS";
  const status = it.status ?? "Suspected";
  if (syndrome !== "HPS" && syndrome !== "HFRS") {
    return { ok: false, reason: `item for ${region}: invalid syndrome "${String(it.syndrome)}"` };
  }
  if (status !== "Confirmed" && status !== "Suspected" && status !== "Pending") {
    return { ok: false, reason: `item for ${region}: invalid status "${String(it.status)}"` };
  }

  const caseId =
    it.case_id?.trim() ||
    it.external_id?.trim() ||
    stableCaseId(`${region}|${reportedAt}|${it.summary ?? ""}`);

  return {
    ok: true,
    value: { case_id: caseId, region, lat, lng, reported_at: reportedAt, syndrome, status },
  };
}

Deno.serve(async (req) => {
  const startedAt = new Date();
  let ingestedCount = 0;
  let supabase: ReturnType<typeof createClient> | null = null;
  try {
    if (!(await authorize(req))) {
      return new Response(
        INGEST_TOKEN ? "Unauthorized" : "Unauthorized: INGEST_TOKEN secret is not configured",
        { status: 401 },
      );
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
        Authorization: `Bearer ${firecrawlKey}`,
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
                      case_id: {
                        type: "string",
                        description:
                          "A unique identifier for the DON item, e.g. slug or URL path segment",
                      },
                      region: { type: "string", description: "Country or region name" },
                      lat: { type: "number", description: "Approximate latitude of the region" },
                      lng: { type: "number", description: "Approximate longitude of the region" },
                      reported_at: {
                        type: "string",
                        description: "Date of the report in ISO 8601 format",
                      },
                      syndrome: {
                        type: "string",
                        enum: ["HPS", "HFRS"],
                        description: "Hantavirus syndrome type",
                      },
                      status: {
                        type: "string",
                        enum: ["Confirmed", "Suspected", "Pending"],
                        description: "Case status",
                      },
                      summary: {
                        type: "string",
                        description: "Brief summary of the outbreak news item",
                      },
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
    const rawItems: RawDonItem[] = Array.isArray(jsonData) ? jsonData : (jsonData?.items ?? []);

    // Filter for hantavirus-related items only
    const hantaKeywords = [
      "hantavirus",
      "hanta",
      "hps",
      "hfrs",
      "hemorrhagic fever with renal syndrome",
      "hantavirus pulmonary syndrome",
    ];
    const items = rawItems.filter((it) => {
      const text = JSON.stringify(it).toLowerCase();
      return hantaKeywords.some((kw) => text.includes(kw));
    });

    // Validate and normalize; drop rows with unusable geo/dates instead of
    // writing 0,0 coordinates or malformed timestamps into the registry.
    const rejected: string[] = [];
    const cases: NormalizedCase[] = [];
    for (const it of items) {
      const res = normalizeItem(it);
      if (res.ok) cases.push(res.value);
      else rejected.push(res.reason);
    }

    if (cases.length === 0) {
      // No usable hantavirus items – log the run but don't error
      try {
        await supabase.from("infra_ingest_runs").insert({
          source: INGEST_SOURCE,
          status: "success",
          started_at: startedAt.toISOString(),
          finished_at: new Date().toISOString(),
          records_ingested: 0,
          error_message: rejected.length ? `rejected rows: ${rejected.join("; ")}` : null,
        });
      } catch (logError) {
        console.error("Failed to record ingest run", logError);
      }

      return Response.json({
        ok: true,
        ingested: 0,
        alerts: 0,
        note: `Scraped ${rawItems.length} DON items, ${items.length} matched hantavirus keywords, 0 passed validation.`,
        rejected,
      });
    }

    // Fetch current statuses so the upsert can tell new rows apart from
    // status transitions (a DON item first seen as Suspected that later
    // becomes Confirmed must update the existing row, not be skipped).
    const caseIds = cases.map((c) => c.case_id);
    const { data: existing, error: fetchError } = await supabase
      .from("hanta_cases")
      .select("case_id, status")
      .in("case_id", caseIds);
    if (fetchError) throw fetchError;
    const existingStatusById = new Map((existing ?? []).map((r) => [r.case_id, r.status]));

    const { data: upserted, error } = await supabase
      .from("hanta_cases")
      .upsert(cases, { onConflict: "case_id" })
      .select("id, case_id, region, status");

    if (error) throw error;
    ingestedCount = (upserted ?? []).filter((c) => !existingStatusById.has(c.case_id)).length;

    // Alert on confirmed cases that are new or just transitioned to Confirmed.
    const alerts = (upserted ?? [])
      .filter((c) => {
        if (c.status !== "Confirmed") return false;
        const prev = existingStatusById.get(c.case_id);
        return prev === undefined || prev !== "Confirmed";
      })
      .map((c) => ({
        level: "critical" as const,
        title:
          existingStatusById.has(c.case_id) && existingStatusById.get(c.case_id) !== "Confirmed"
            ? "WHO DON case status changed to Confirmed"
            : "New confirmed hantavirus case ingested from WHO DON",
        region: c.region,
      }));
    if (alerts.length) {
      const { error: alertError } = await supabase.from("hanta_alerts").insert(alerts);
      if (alertError) console.error("Failed to insert alerts", alertError);
    }

    try {
      await supabase.from("infra_ingest_runs").insert({
        source: INGEST_SOURCE,
        status: "success",
        started_at: startedAt.toISOString(),
        finished_at: new Date().toISOString(),
        records_ingested: ingestedCount,
        error_message: rejected.length ? `rejected rows: ${rejected.join("; ")}` : null,
      });
    } catch (logError) {
      console.error("Failed to record ingest run", logError);
    }

    return Response.json({
      ok: true,
      ingested: ingestedCount,
      alerts: alerts.length,
      rejected,
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
