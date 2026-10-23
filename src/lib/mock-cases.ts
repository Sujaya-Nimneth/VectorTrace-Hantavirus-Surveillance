import type { Case } from "./mock-data";
import { REGIONS } from "./mock-data";

let __s = 7;
function r() {
  __s = (__s * 9301 + 49297) % 233280;
  return __s / 233280;
}

export const CASES: Case[] = Array.from({ length: 96 }, (_, i) => {
  const reg = REGIONS[Math.floor(r() * REGIONS.length)];
  const daysAgo = Math.floor(r() * 90);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const stat = r();
  return {
    id: `HCV-${(2025001 + i).toString()}`,
    region: reg.name,
    lat: reg.lat + (r() - 0.5) * 1.4,
    lng: reg.lng + (r() - 0.5) * 1.4,
    date: d.toISOString(),
    syndrome: r() > 0.18 ? "HPS" : "HFRS",
    status: stat > 0.55 ? "Confirmed" : stat > 0.2 ? "Suspected" : "Pending",
    age: 18 + Math.floor(r() * 60),
    sex: r() > 0.5 ? "M" : "F",
    symptoms: r() > 0.4 ? ["fever", "myalgia"] : ["fever"],
    exposure: r() > 0.5 ? "Rural lodging with suspected rodent infestation" : null,
  };
});
