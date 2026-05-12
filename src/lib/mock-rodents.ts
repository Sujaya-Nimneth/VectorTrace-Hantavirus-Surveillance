import type { RodentSite, Alert } from "./mock-data";
import { REGIONS } from "./mock-data";

let __s = 41;
function r() { __s = (__s * 9301 + 49297) % 233280; return __s / 233280; }

export const RODENTS: RodentSite[] = Array.from({ length: 54 }, (_, i) => {
  const reg = REGIONS[Math.floor(r() * REGIONS.length)];
  const daysAgo = Math.floor(r() * 90);
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return {
    id: `RV-${(8001 + i).toString()}`,
    region: reg.name,
    lat: reg.lat + (r() - 0.5) * 1.6,
    lng: reg.lng + (r() - 0.5) * 1.6,
    date: d.toISOString(),
    positivity: Math.round(r() * 65),
    species: r() > 0.4 ? "Oligoryzomys longicaudatus" : "Calomys musculinus",
  };
});
