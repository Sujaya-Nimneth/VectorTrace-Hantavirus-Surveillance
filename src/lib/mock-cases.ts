import type { Case } from "./mock-data";
import { REGIONS } from "./mock-data";
import { DISEASES, DISEASE_BY_SLUG, type DiseaseSlug } from "./diseases";

let __s = 7;
function r() {
  __s = (__s * 9301 + 49297) % 233280;
  return __s / 233280;
}

const EXPOSURE_NOTES: Record<DiseaseSlug, string[]> = {
  hantavirus: [
    "Rural lodging with suspected rodent infestation",
    "Agricultural grain shed clean-up without respiratory PPE",
    "Patagonian trail cabin maintenance",
  ],
  dengue: [
    "Standing rainwater containers near peri-urban residence",
    "Recent travel through high-index Aedes aegypti corridor",
    "Outdoor occupational exposure at dusk",
  ],
  h5n1: [
    "Backyard poultry mortality cluster handling",
    "Wetland migratory waterfowl surveillance contact",
    "Dairy / livestock barn aerosol exposure",
  ],
  mpox: [
    "Close household skin-to-skin contact with confirmed case",
    "Travel-linked clade investigation",
    "Clinical laboratory specimen processing exposure",
  ],
  arbovirus: [
    "Peri-urban Aedes albopictus breeding corridor",
    "Subtropical riverbank agricultural labor",
    "Municipal park cluster without repellent barrier",
  ],
  cholera: [
    "Untreated municipal well water following heavy rainfall",
    "Riverine shellfish consumption near port node",
    "Flooded sanitation drainage corridor",
  ],
};

// Bias waves so Dengue & Mpox surge recently, Hantavirus stays steady, etc.
const DISEASE_WEIGHTS: Array<{ slug: DiseaseSlug; count: number; recentBias: number }> = [
  { slug: "hantavirus", count: 42, recentBias: 0.35 },
  { slug: "dengue", count: 52, recentBias: 0.72 },
  { slug: "h5n1", count: 24, recentBias: 0.55 },
  { slug: "mpox", count: 30, recentBias: 0.78 },
  { slug: "arbovirus", count: 24, recentBias: 0.45 },
  { slug: "cholera", count: 20, recentBias: 0.4 },
];

const DISEASE_REGION_PREF: Record<DiseaseSlug, number[]> = {
  hantavirus: [0, 1, 3, 2, 5, 4], // Patagonia Norte, Cuyo, Pampeana...
  dengue: [4, 5, 2, 1, 3, 0], // NEA, Centro, NOA...
  h5n1: [3, 2, 5, 0, 4, 1], // Pampeana, NOA, Centro...
  mpox: [5, 3, 1, 4, 2, 0], // Centro, Pampeana, Cuyo...
  arbovirus: [4, 2, 5, 1, 3, 0], // NEA, NOA, Centro...
  cholera: [4, 1, 2, 5, 3, 0], // NEA, Cuyo, NOA...
};

export const CASES: Case[] = (() => {
  const rows: Case[] = [];
  let seq = 1;
  const now = new Date();

  for (const cfg of DISEASE_WEIGHTS) {
    const profile = DISEASE_BY_SLUG[cfg.slug] ?? DISEASES[0];
    const prefIndices = DISEASE_REGION_PREF[cfg.slug];

    for (let i = 0; i < cfg.count; i++) {
      // Pick preferred region ~70% of the time to form authentic regional corridors
      const regIdx =
        r() < 0.72 ? prefIndices[Math.floor(r() * 3)] : Math.floor(r() * REGIONS.length);
      const reg = REGIONS[regIdx];

      // Shape temporal distribution: recentBias concentrates cases in last 14 days
      const daysAgo = r() < cfg.recentBias ? Math.floor(r() * 14) : 14 + Math.floor(r() * 76);

      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);

      const stat = r();
      const synIdx = r() > 0.25 ? 0 : Math.min(1, profile.syndromes.length - 1);
      const symCount = Math.min(profile.symptoms.length, 2 + Math.floor(r() * 3));
      const symptoms = profile.symptoms.slice(0, symCount);
      const notes = EXPOSURE_NOTES[cfg.slug];

      rows.push({
        id: `${profile.casePrefix}-${(2026000 + seq++).toString()}`,
        diseaseSlug: cfg.slug,
        region: reg.name,
        lat: Number((reg.lat + (r() - 0.5) * 1.4).toFixed(4)),
        lng: Number((reg.lng + (r() - 0.5) * 1.4).toFixed(4)),
        date: d.toISOString(),
        syndrome: profile.syndromes[synIdx].code,
        status: stat > 0.48 ? "Confirmed" : stat > 0.18 ? "Suspected" : "Pending",
        age: 14 + Math.floor(r() * 64),
        sex: r() > 0.5 ? "M" : "F",
        symptoms,
        exposure: r() > 0.42 ? notes[Math.floor(r() * notes.length)] : null,
      });
    }
  }

  return rows.sort((a, b) => +new Date(b.date) - +new Date(a.date));
})();
