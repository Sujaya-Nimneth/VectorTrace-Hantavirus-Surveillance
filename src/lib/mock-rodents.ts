import type { RodentSite } from "./mock-data";
import { REGIONS } from "./mock-data";
import { DISEASES } from "./diseases";

let __s = 41;
function r() {
  __s = (__s * 9301 + 49297) % 233280;
  return __s / 233280;
}

const SPECIES_BY_DISEASE: Record<string, string[]> = {
  hantavirus: ["Oligoryzomys longicaudatus", "Calomys musculinus"],
  dengue: ["Aedes aegypti", "Aedes albopictus"],
  h5n1: ["Anas platyrhynchos (Wild Mallard)", "Gallus gallus (Backyard Flock)"],
  mpox: ["Municipal Sewer Catchment (OPXV)", "Regional Hospital Wastewater"],
  arbovirus: ["Aedes albopictus", "Aedes aegypti"],
  cholera: ["Vibrio cholerae O1 (Riverine)", "Municipal Water Treatment Intake"],
};

export const RODENTS: RodentSite[] = Array.from({ length: 84 }, (_, i) => {
  const disease = DISEASES[i % DISEASES.length];
  const reg = REGIONS[Math.floor(r() * REGIONS.length)];
  const daysAgo = Math.floor(r() * 90);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const speciesList = SPECIES_BY_DISEASE[disease.slug] ?? [disease.sentinelSpeciesDefault];

  return {
    id: `${disease.casePrefix.slice(0, 2)}S-${(8001 + i).toString()}`,
    diseaseSlug: disease.slug,
    sentinelType: disease.sentinelType,
    region: reg.name,
    lat: Number((reg.lat + (r() - 0.5) * 1.6).toFixed(4)),
    lng: Number((reg.lng + (r() - 0.5) * 1.6).toFixed(4)),
    date: d.toISOString(),
    positivity: Math.round(r() * 74),
    species: speciesList[Math.floor(r() * speciesList.length)],
  };
});
