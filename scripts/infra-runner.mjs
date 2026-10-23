const ingestUrl = process.env.INGEST_URL || "";
const ingestInterval = Number.parseInt(process.env.INGEST_INTERVAL_SECONDS || "43200", 10);
const healthUrl = process.env.HEALTHCHECK_URL || "";
const healthInterval = Number.parseInt(process.env.HEALTHCHECK_INTERVAL_SECONDS || "300", 10);
const ingestToken = process.env.INGEST_TOKEN || "";

const timers = [];

async function callEndpoint(url, label, token) {
  if (!url) return;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const ms = Date.now() - start;
    if (!res.ok) {
      const text = await res.text();
      console.error(`[infra-runner] ${label} failed ${res.status} in ${ms}ms: ${text}`);
      return;
    }
    console.log(`[infra-runner] ${label} ok in ${ms}ms`);
  } catch (err) {
    console.error(`[infra-runner] ${label} error:`, err?.message || err);
  }
}

function schedule(url, intervalSeconds, label, token) {
  if (!url) {
    console.warn(`[infra-runner] ${label} disabled (missing URL)`);
    return;
  }
  const interval = Math.max(30, intervalSeconds || 60) * 1000;
  let inFlight = false;
  const run = async () => {
    // Skip when the previous tick is still running (Firecrawl scrapes can
    // take up to 120s) so intervals can't pile up.
    if (inFlight) {
      console.warn(`[infra-runner] ${label} skipped: previous run still in flight`);
      return;
    }
    inFlight = true;
    try {
      await callEndpoint(url, label, token);
    } finally {
      inFlight = false;
    }
  };
  timers.push(setInterval(run, interval));
  console.log(`[infra-runner] ${label} scheduled every ${interval / 1000}s`);
}

schedule(ingestUrl, ingestInterval, "ingest-don-feed", ingestToken);
schedule(healthUrl, healthInterval, "infra-health-check", ingestToken);

function shutdown(signal) {
  console.log(`[infra-runner] received ${signal}, shutting down`);
  for (const t of timers) clearInterval(t);
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
