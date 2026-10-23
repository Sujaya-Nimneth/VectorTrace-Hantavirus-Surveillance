import type { Alert } from "./mock-data";

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

export const ALERTS: Alert[] = [
  {
    id: "a1",
    createdAt: ago(2),
    level: "critical",
    title: "Cluster detected: 4 new HPS cases within 12km",
    region: "Patagonia Norte",
  },
  {
    id: "a2",
    createdAt: ago(18),
    level: "warning",
    title: "Rodent positivity spike (62%) at LR-04",
    region: "Cuyo",
  },
  {
    id: "a3",
    createdAt: ago(60),
    level: "info",
    title: "WHO DON ingest complete",
    region: "Global",
  },
  {
    id: "a4",
    createdAt: ago(180),
    level: "warning",
    title: "Lab backlog exceeds 48h",
    region: "NEA",
  },
  {
    id: "a5",
    createdAt: ago(300),
    level: "critical",
    title: "Confirmed HPS fatality",
    region: "NOA",
  },
  {
    id: "a6",
    createdAt: ago(480),
    level: "info",
    title: "ScrapeGraphAI cron OK",
    region: "Global",
  },
  {
    id: "a7",
    createdAt: ago(660),
    level: "warning",
    title: "New rodent positivity hit",
    region: "Centro",
  },
  {
    id: "a8",
    createdAt: ago(1440),
    level: "info",
    title: "Quarantine zone updated",
    region: "Pampeana",
  },
];
