/**
 * Supabase Edge Function: ingest-don-feed
 * --------------------------------------
 * Pulls WHO Disease Outbreak News (DONs) using Firecrawl, classifies items
 * across VectorTrace's active surveillance pathogens, and writes normalized
 * rows into `hanta_cases` and `hanta_alerts` (upsert on case_id), logging
 * each run to `infra_ingest_runs`.
 */

// deno-lint-ignore-file
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { geocodeRegion, isPlottableCoordinates } from "../_shared/geocoding.ts";

const FIRECRAWL_SCRAPE_ENDPOINT = "https://api.firecrawl.dev/v2/scrape";
const SOURCE_URL = "https://www.who.int/emergencies/disease-outbreak-news";
const INGEST_SOURCE = "WHO Disease Outbreak News";

type DiseaseSlug = "hantavirus" | "dengue" | "h5n1" | "mpox" | "arbovirus" | "cholera";

const DISEASE_MATCHERS: Array<{
  slug: DiseaseSlug;
  prefix: string;
  defaultSyndrome: string;
  allowedSyndromes: string[];
  keywords: string[];
}> = [
  {
    slug: "hantavirus",
    prefix: "HTV",
    defaultSyndrome: "HPS",
    allowedSyndromes: ["HPS", "HFRS"],
    keywords: [
      "hantavirus",
      "hanta",
      "hps",
      "hfrs",
      "hemorrhagic fever with renal syndrome",
      "hantavirus pulmonary syndrome",
    ],
  },
  {
    slug: "dengue",
    prefix: "DNV",
    defaultSyndrome: "DENV-Classic",
    allowedSyndromes: ["DENV-Classic", "DENV-Severe"],
    keywords: ["dengue", "denv", "dengue fever", "severe dengue"],
  },
  {
    slug: "h5n1",
    prefix: "H5N",
    defaultSyndrome: "H5N1-Avian",
    allowedSyndromes: ["H5N1-Avian", "H5N1-Mammalian"],
    keywords: ["h5n1", "avian influenza", "bird flu", "influenza a(h5"],
  },
  {
    slug: "mpox",
    prefix: "MPX",
    defaultSyndrome: "Clade-I",
    allowedSyndromes: ["Clade-I", "Clade-II"],
    keywords: ["mpox", "monkeypox", "clade i", "clade ii", "orthopox"],
  },
  {
    slug: "arbovirus",
    prefix: "ARV",
    defaultSyndrome: "CHIKV",
    allowedSyndromes: ["CHIKV", "ZIKV"],
    keywords: ["chikungunya", "chikv", "zika", "zikv"],
  },
  {
    slug: "cholera",
    prefix: "CHL",
    defaultSyndrome: "El-Tor",
    allowedSyndromes: ["El-Tor", "Classical"],
    keywords: ["cholera", "vibrio cholerae", "el tor"],
  },
];

async function authorize(req: Request): Promise<boolean> {
  const auth = req.headers.get("authorization") ?? "";
  const presented = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";
  if (!presented) return false;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) return false;

  const verifier = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await verifier.rpc("verify_function_token", {
    presented_token: presented,
  });
  if (error) {
    console.error("verify_function_token failed", error);
    return false;
  }
  return data === true;
}

type RawDonItem = {
  case_id?: string;
  external_id?: string;
  disease_slug?: string;
  region?: string;
  lat?: number;
  lng?: number;
  reported_at?: string;
  syndrome?: string;
  status?: "Confirmed" | "Suspected" | "Pending";
  summary?: string;
};

type NormalizedCase = {
  case_id: string;
  disease_slug: DiseaseSlug;
  region: string;
  lat: number;
  lng: number;
  reported_at: string;
  syndrome: string;
  status: "Confirmed" | "Suspected" | "Pending";
};

function classifyDisease(it: RawDonItem) {
  const explicit = (it.disease_slug ?? "").toLowerCase().trim();
  const bySlug = DISEASE_MATCHERS.find((m) => m.slug === explicit);
  if (bySlug) return bySlug;

  const haystack = `${it.syndrome ?? ""} ${it.summary ?? ""} ${it.case_id ?? ""}`.toLowerCase();
  for (const matcher of DISEASE_MATCHERS) {
    if (matcher.keywords.some((kw) => haystack.includes(kw))) {
      return matcher;
    }
  }
  return null;
}

function stableCaseId(prefix: string, seed: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `DON-${prefix}-${(h >>> 0).toString(36).toUpperCase().padStart(7, "0")}`;
}

async function normalizeItem(
  it: RawDonItem,
  matcher: (typeof DISEASE_MATCHERS)[number],
): Promise<{ ok: true; value: NormalizedCase } | { ok: false; reason: string }> {
  const region = typeof it.region === "string" && it.region.trim() ? it.region.trim() : "Unknown";

  let coordinates =
    typeof it.lat === "number" &&
    typeof it.lng === "number" &&
    isPlottableCoordinates(it.lat, it.lng)
      ? { lat: it.lat, lng: it.lng }
      : null;

  if (!coordinates) {
    coordinates = await geocodeRegion(region);
  }
  if (!coordinates) {
    return { ok: false, reason: `item for ${region}: no plottable coordinates` };
  }

  let reportedAt = new Date().toISOString();
  let reportedAtDefaulted = true;
  if (it.reported_at != null) {
    const d = new Date(it.reported_at);
    if (Number.isNaN(d.getTime())) {
      return { ok: false, reason: `item for ${region}: invalid reported_at "${it.reported_at}"` };
    }
    reportedAt = d.toISOString();
    reportedAtDefaulted = false;
  }

  const candidateSyn = typeof it.syndrome === "string" ? it.syndrome.trim() : "";
  const syndrome = matcher.allowedSyndromes.includes(candidateSyn)
    ? candidateSyn
    : matcher.defaultSyndrome;

  const status = it.status ?? "Suspected";
  if (status !== "Confirmed" && status !== "Suspected" && status !== "Pending") {
    return { ok: false, reason: `item for ${region}: invalid status "${String(it.status)}"` };
  }

  const caseId =
    it.case_id?.trim() ||
    it.external_id?.trim() ||
    stableCaseId(
      matcher.prefix,
      reportedAtDefaulted
        ? `${matcher.slug}|${region}|${it.summary ?? ""}`
        : `${matcher.slug}|${region}|${reportedAt}|${it.summary ?? ""}`,
    );

  return {
    ok: true,
    value: {
      case_id: caseId,
      disease_slug: matcher.slug,
      region,
      lat: coordinates.lat,
      lng: coordinates.lng,
      reported_at: reportedAt,
      syndrome,
      status,
    },
  };
}

Deno.serve(async (req) => {
  const startedAt = new Date();
  let ingestedCount = 0;
  let supabase: ReturnType<typeof createClient> | null = null;
  try {
    if (!(await authorize(req))) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      return new Response("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY secrets must both be set", {
        status: 500,
      });
    }
    supabase = createClient(supabaseUrl, supabaseKey);

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response("FIRECRAWL_API_KEY secret is not set", { status: 500 });
    }

    const scrapeBody = JSON.stringify({
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
                    case_id: { type: "string" },
                    disease_slug: {
                      type: "string",
                      enum: ["hantavirus", "dengue", "h5n1", "mpox", "arbovirus", "cholera"],
                    },
                    region: { type: "string" },
                    lat: { type: "number" },
                    lng: { type: "number" },
                    reported_at: { type: "string" },
                    syndrome: { type: "string" },
                    status: { type: "string", enum: ["Confirmed", "Suspected", "Pending"] },
                    summary: { type: "string" },
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
    });

    let scrape: Response | null = null;
    let lastErrText = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
      const res = await fetch(FIRECRAWL_SCRAPE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${firecrawlKey}`,
        },
        body: scrapeBody,
      });
      if (res.ok || (res.status !== 429 && res.status < 500)) {
        scrape = res;
        break;
      }
      lastErrText = await res.text();
      scrape = res;
    }
    if (!scrape) {
      return new Response("scrape failed: no response", { status: 502 });
    }
    if (!scrape.ok) {
      const errText =
        scrape.status === 429 || scrape.status >= 500 ? lastErrText : await scrape.text();
      return new Response(`scrape failed: ${scrape.status} – ${errText}`, { status: 502 });
    }

    const scrapeResult = await scrape.json();
    if (scrapeResult?.success === false) {
      throw new Error(`firecrawl reported failure: ${JSON.stringify(scrapeResult?.error ?? "")}`);
    }
    const jsonData = scrapeResult?.data?.json ?? scrapeResult?.data;
    const rawItems: RawDonItem[] | null = Array.isArray(jsonData)
      ? jsonData
      : Array.isArray(jsonData?.items)
        ? jsonData.items
        : null;
    if (rawItems === null) {
      throw new Error("malformed firecrawl payload: expected data.json or data.json.items array");
    }

    const matched: Array<{ item: RawDonItem; matcher: (typeof DISEASE_MATCHERS)[number] }> = [];
    for (const it of rawItems) {
      const matcher = classifyDisease(it);
      if (matcher) matched.push({ item: it, matcher });
    }

    const rejected: string[] = [];
    const cases: NormalizedCase[] = [];
    for (const { item, matcher } of matched) {
      const res = await normalizeItem(item, matcher);
      if (res.ok) cases.push(res.value);
      else rejected.push(res.reason);
    }

    if (cases.length === 0) {
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
        note: `Scraped ${rawItems.length} DON items, ${matched.length} matched monitored pathogens, 0 passed validation.`,
        rejected,
      });
    }

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
      .select("id, case_id, disease_slug, region, status");

    if (error) throw error;
    ingestedCount = (upserted ?? []).filter((c) => !existingStatusById.has(c.case_id)).length;

    const alerts = (upserted ?? [])
      .filter((c) => {
        if (c.status !== "Confirmed") return false;
        const prev = existingStatusById.get(c.case_id);
        return prev === undefined || prev !== "Confirmed";
      })
      .map((c) => ({
        level: "critical" as const,
        disease_slug: c.disease_slug,
        signal_source: "who_don" as const,
        title:
          existingStatusById.has(c.case_id) && existingStatusById.get(c.case_id) !== "Confirmed"
            ? `WHO DON ${c.disease_slug.toUpperCase()} status changed to Confirmed`
            : `New confirmed ${c.disease_slug.toUpperCase()} case ingested from WHO DON`,
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
