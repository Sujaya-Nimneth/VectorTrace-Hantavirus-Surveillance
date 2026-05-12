import type { Alert } from "./mock-data";
export const ALERTS: Alert[] = [
  { id: "a1", ts: "2m ago", level: "critical", title: "Cluster detected: 4 new HPS cases within 12km", region: "Patagonia Norte" },
  { id: "a2", ts: "18m ago", level: "warning", title: "Rodent positivity spike (62%) at LR-04", region: "Cuyo" },
  { id: "a3", ts: "1h ago", level: "info", title: "WHO DON ingest complete", region: "Global" },
  { id: "a4", ts: "3h ago", level: "warning", title: "Lab backlog exceeds 48h", region: "NEA" },
  { id: "a5", ts: "5h ago", level: "critical", title: "Confirmed HPS fatality", region: "NOA" },
  { id: "a6", ts: "8h ago", level: "info", title: "ScrapeGraphAI cron OK", region: "Global" },
  { id: "a7", ts: "11h ago", level: "warning", title: "New rodent positivity hit", region: "Centro" },
  { id: "a8", ts: "1d ago", level: "info", title: "Quarantine zone updated", region: "Pampeana" },
];
