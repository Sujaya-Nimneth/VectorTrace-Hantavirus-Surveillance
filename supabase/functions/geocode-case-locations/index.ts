// deno-lint-ignore-file
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { geocodeRegion, isAggregateRegion } from "../_shared/geocoding.ts";

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

Deno.serve(async (req) => {
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

  const supabase = createClient(supabaseUrl, supabaseKey);
  const requestedLimit = Number(new URL(req.url).searchParams.get("limit") ?? "100");
  const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 100;

  const { data: cases, error: readError } = await supabase
    .from("hanta_cases")
    .select("id, case_id, region")
    .or("lat.eq.0,lng.eq.0")
    .limit(limit);
  if (readError) {
    return new Response(`case lookup failed: ${readError.message}`, { status: 500 });
  }

  const byRegion = new Map<string, string[]>();
  for (const item of cases ?? []) {
    const ids = byRegion.get(item.region) ?? [];
    ids.push(item.id);
    byRegion.set(item.region, ids);
  }

  let updated = 0;
  const unresolved: string[] = [];
  const aggregate: string[] = [];
  const resolved: Array<{ region: string; lat: number; lng: number; source: string }> = [];

  for (const [region, ids] of byRegion) {
    const coordinates = await geocodeRegion(region);
    if (!coordinates) {
      if (isAggregateRegion(region)) {
        const { error: aggregateError } = await supabase
          .from("hanta_cases")
          .update({ lat: null, lng: null })
          .in("id", ids);
        if (aggregateError) {
          console.error(`Failed to mark aggregate region ${region}`, aggregateError);
          unresolved.push(region);
        } else {
          updated += ids.length;
          aggregate.push(region);
        }
      } else {
        unresolved.push(region);
      }
      continue;
    }

    const { error: updateError } = await supabase
      .from("hanta_cases")
      .update({ lat: coordinates.lat, lng: coordinates.lng })
      .in("id", ids);
    if (updateError) {
      console.error(`Failed to update coordinates for ${region}`, updateError);
      unresolved.push(region);
      continue;
    }

    updated += ids.length;
    resolved.push({ region, ...coordinates });
  }

  return Response.json({
    ok: unresolved.length === 0,
    scanned: cases?.length ?? 0,
    updated,
    resolved,
    aggregate,
    unresolved,
  });
});
