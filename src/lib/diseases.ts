export type DiseaseSlug = "hantavirus" | "dengue" | "h5n1" | "mpox" | "arbovirus" | "cholera";

export type SentinelType =
  "rodent_trap" | "mosquito_ovitrap" | "avian_sentinel" | "wastewater_node";

export type SectorRole =
  "vaccine" | "antiviral" | "diagnostics" | "consumables" | "vector_control" | "benchmark";

export type DiseaseCategory = "zoonotic" | "vector_borne" | "respiratory" | "waterborne";

export type TokenColor =
  | "default"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "cyan"
  | "blue"
  | "purple"
  | "pink"
  | "gray";

export type SyndromeSpec = {
  code: string;
  label: string;
  description: string;
};

export type DiseaseProfile = {
  slug: DiseaseSlug;
  name: string;
  shortName: string;
  icd11: string;
  casePrefix: string;
  category: DiseaseCategory;
  syndromes: SyndromeSpec[];
  symptoms: string[];
  sentinelType: SentinelType;
  sentinelLabel: string;
  sentinelSingular: string;
  sentinelSpeciesDefault: string;
  proximityRadiusKm: number;
  incubationDaysMax: number;
  wikiArticles: string[];
  chartColor: string;
  tokenColor: TokenColor;
};

export const DISEASES: DiseaseProfile[] = [
  {
    slug: "hantavirus",
    name: "Hantavirus",
    shortName: "Hantavirus",
    icd11: "1D62",
    casePrefix: "HTV",
    category: "zoonotic",
    syndromes: [
      { code: "HPS", label: "HPS — Pulmonary", description: "Hantavirus Pulmonary Syndrome" },
      {
        code: "HFRS",
        label: "HFRS — Renal",
        description: "Hemorrhagic Fever with Renal Syndrome",
      },
    ],
    symptoms: ["fever", "myalgia", "cough", "headache", "nausea", "thrombo"],
    sentinelType: "rodent_trap",
    sentinelLabel: "Rodent traps",
    sentinelSingular: "rodent trap",
    sentinelSpeciesDefault: "Oligoryzomys longicaudatus",
    proximityRadiusKm: 5,
    incubationDaysMax: 42,
    wikiArticles: ["Hantavirus", "Hantavirus_pulmonary_syndrome"],
    chartColor: "var(--color-data-blue-4)",
    tokenColor: "blue",
  },
  {
    slug: "dengue",
    name: "Dengue Fever",
    shortName: "Dengue",
    icd11: "1D2Z",
    casePrefix: "DNV",
    category: "vector_borne",
    syndromes: [
      {
        code: "DENV-Classic",
        label: "DENV — Classic",
        description: "Acute febrile dengue without warning signs",
      },
      {
        code: "DENV-Severe",
        label: "DENV — Severe",
        description: "Plasma leakage, hemorrhage, or organ impairment",
      },
    ],
    symptoms: ["fever", "headache", "retro_orbital", "myalgia", "rash", "thrombo", "nausea"],
    sentinelType: "mosquito_ovitrap",
    sentinelLabel: "Aedes ovitraps",
    sentinelSingular: "Aedes ovitrap",
    sentinelSpeciesDefault: "Aedes aegypti",
    proximityRadiusKm: 1.5,
    incubationDaysMax: 10,
    wikiArticles: ["Dengue_fever", "Dengue_vaccine"],
    chartColor: "var(--color-data-orange-4)",
    tokenColor: "orange",
  },
  {
    slug: "h5n1",
    name: "Avian Influenza (H5N1)",
    shortName: "H5N1 Flu",
    icd11: "1E31",
    casePrefix: "H5N",
    category: "respiratory",
    syndromes: [
      {
        code: "H5N1-Avian",
        label: "H5N1 — Avian Spillover",
        description: "Direct poultry/wild bird exposure cluster",
      },
      {
        code: "H5N1-Mammalian",
        label: "H5N1 — Mammalian Adapted",
        description: "Suspected mammal-to-human or livestock spillover",
      },
    ],
    symptoms: ["fever", "cough", "myalgia", "conjunctivitis", "hypoxia", "headache"],
    sentinelType: "avian_sentinel",
    sentinelLabel: "Avian sentinels",
    sentinelSingular: "avian sentinel site",
    sentinelSpeciesDefault: "Anas platyrhynchos / Poultry",
    proximityRadiusKm: 10,
    incubationDaysMax: 8,
    wikiArticles: ["Avian_influenza", "Oseltamivir"],
    chartColor: "var(--color-data-red-4)",
    tokenColor: "red",
  },
  {
    slug: "mpox",
    name: "Mpox (Monkeypox)",
    shortName: "Mpox",
    icd11: "1E71",
    casePrefix: "MPX",
    category: "zoonotic",
    syndromes: [
      {
        code: "Clade-I",
        label: "Mpox — Clade I",
        description: "Central African clade with elevated severity",
      },
      {
        code: "Clade-II",
        label: "Mpox — Clade II",
        description: "West African / global transmission clade",
      },
    ],
    symptoms: ["fever", "rash", "lymphadenopathy", "headache", "myalgia"],
    sentinelType: "wastewater_node",
    sentinelLabel: "Wastewater nodes",
    sentinelSingular: "wastewater node",
    sentinelSpeciesDefault: "Municipal Sewer Catchment",
    proximityRadiusKm: 5,
    incubationDaysMax: 21,
    wikiArticles: ["Mpox", "Tecovirimat"],
    chartColor: "var(--color-data-purple-4)",
    tokenColor: "purple",
  },
  {
    slug: "arbovirus",
    name: "Chikungunya / Zika",
    shortName: "CHIKV/ZIKV",
    icd11: "1D40",
    casePrefix: "ARV",
    category: "vector_borne",
    syndromes: [
      {
        code: "CHIKV",
        label: "CHIKV — Chikungunya",
        description: "Alphavirus polyarthralgia syndrome",
      },
      {
        code: "ZIKV",
        label: "ZIKV — Zika",
        description: "Flavivirus rash & neuro-teratogenic surveillance",
      },
    ],
    symptoms: ["fever", "arthralgia", "rash", "conjunctivitis", "headache", "myalgia"],
    sentinelType: "mosquito_ovitrap",
    sentinelLabel: "Aedes ovitraps",
    sentinelSingular: "Aedes ovitrap",
    sentinelSpeciesDefault: "Aedes albopictus",
    proximityRadiusKm: 1.5,
    incubationDaysMax: 12,
    wikiArticles: ["Chikungunya", "Zika_fever"],
    chartColor: "var(--color-data-teal-4)",
    tokenColor: "teal",
  },
  {
    slug: "cholera",
    name: "Cholera",
    shortName: "Cholera",
    icd11: "1A00",
    casePrefix: "CHL",
    category: "waterborne",
    syndromes: [
      {
        code: "El-Tor",
        label: "Vibrio O1 El Tor",
        description: "Acute watery diarrhea pandemic biotype",
      },
      {
        code: "Classical",
        label: "Vibrio O1/O139",
        description: "Severe dehydration & hypovolemic cluster",
      },
    ],
    symptoms: ["watery_diarrhea", "dehydration", "nausea", "hypotension"],
    sentinelType: "wastewater_node",
    sentinelLabel: "Water / sewage nodes",
    sentinelSingular: "water sentinel node",
    sentinelSpeciesDefault: "Vibrio cholerae O1",
    proximityRadiusKm: 3,
    incubationDaysMax: 5,
    wikiArticles: ["Cholera", "Oral_rehydration_therapy"],
    chartColor: "var(--color-data-shamrock-4)",
    tokenColor: "green",
  },
];

export const DISEASE_SLUGS = DISEASES.map((d) => d.slug) as [DiseaseSlug, ...DiseaseSlug[]];

export const DISEASE_BY_SLUG: Record<DiseaseSlug, DiseaseProfile> = Object.fromEntries(
  DISEASES.map((d) => [d.slug, d]),
) as Record<DiseaseSlug, DiseaseProfile>;

export function isDiseaseSlug(value: string | null | undefined): value is DiseaseSlug {
  if (!value) return false;
  return value in DISEASE_BY_SLUG;
}

export function getDiseaseProfile(slug?: string | null): DiseaseProfile {
  if (isDiseaseSlug(slug)) return DISEASE_BY_SLUG[slug];
  return DISEASE_BY_SLUG.hantavirus;
}

export type PharmaTickerMeta = {
  ticker: string;
  companyName: string;
  exchange: string;
  sectorRole: SectorRole;
  isPurePlay: boolean;
};

export const PHARMA_TICKERS: PharmaTickerMeta[] = [
  {
    ticker: "SPY",
    companyName: "SPDR S&P 500 ETF Trust",
    exchange: "NYSE",
    sectorRole: "benchmark",
    isPurePlay: false,
  },
  {
    ticker: "XBI",
    companyName: "SPDR S&P Biotech ETF",
    exchange: "NYSE",
    sectorRole: "benchmark",
    isPurePlay: false,
  },
  {
    ticker: "DHR",
    companyName: "Danaher (Cepheid PCR)",
    exchange: "NYSE",
    sectorRole: "diagnostics",
    isPurePlay: false,
  },
  {
    ticker: "ABT",
    companyName: "Abbott Laboratories (Rapid Tests)",
    exchange: "NYSE",
    sectorRole: "diagnostics",
    isPurePlay: false,
  },
  {
    ticker: "QGEN",
    companyName: "Qiagen N.V. (Molecular Diagnostics)",
    exchange: "NYSE",
    sectorRole: "diagnostics",
    isPurePlay: true,
  },
  {
    ticker: "BIM.PA",
    companyName: "bioMérieux SA (Multiplex Syndromic)",
    exchange: "EPA",
    sectorRole: "diagnostics",
    isPurePlay: true,
  },
  {
    ticker: "TAK",
    companyName: "Takeda Pharmaceutical (Qdenga)",
    exchange: "NYSE",
    sectorRole: "vaccine",
    isPurePlay: false,
  },
  {
    ticker: "SNY",
    companyName: "Sanofi (Dengvaxia / Vaccines)",
    exchange: "NASDAQ",
    sectorRole: "vaccine",
    isPurePlay: false,
  },
  {
    ticker: "VALN",
    companyName: "Valneva SE (Ixchiq Chikungunya)",
    exchange: "NASDAQ",
    sectorRole: "vaccine",
    isPurePlay: true,
  },
  {
    ticker: "BAVA.CO",
    companyName: "Bavarian Nordic A/S (Jynneos Mpox)",
    exchange: "CPH",
    sectorRole: "vaccine",
    isPurePlay: true,
  },
  {
    ticker: "SIGA",
    companyName: "SIGA Technologies (Tpoxx Tecovirimat)",
    exchange: "NASDAQ",
    sectorRole: "antiviral",
    isPurePlay: true,
  },
  {
    ticker: "EBS",
    companyName: "Emergent BioSolutions (ACAM2000)",
    exchange: "NYSE",
    sectorRole: "vaccine",
    isPurePlay: true,
  },
  {
    ticker: "MRNA",
    companyName: "Moderna (mRNA-1018 Pandemic Flu)",
    exchange: "NASDAQ",
    sectorRole: "vaccine",
    isPurePlay: true,
  },
  {
    ticker: "CSL.AX",
    companyName: "CSL Seqirus (H5N1 Vaccine)",
    exchange: "ASX",
    sectorRole: "vaccine",
    isPurePlay: false,
  },
  {
    ticker: "RHHBY",
    companyName: "Roche Holding (Oseltamivir / Xofluza)",
    exchange: "OTC",
    sectorRole: "antiviral",
    isPurePlay: false,
  },
  {
    ticker: "BAX",
    companyName: "Baxter International (IV Fluids / CRRT)",
    exchange: "NYSE",
    sectorRole: "consumables",
    isPurePlay: false,
  },
  {
    ticker: "BDX",
    companyName: "Becton Dickinson (Acute Infusion)",
    exchange: "NYSE",
    sectorRole: "consumables",
    isPurePlay: false,
  },
  {
    ticker: "GETI-B.ST",
    companyName: "Getinge AB (ECMO / ICU Life Support)",
    exchange: "STO",
    sectorRole: "consumables",
    isPurePlay: false,
  },
  {
    ticker: "RTO",
    companyName: "Rentokil Initial (Vector & Rodent Control)",
    exchange: "NYSE",
    sectorRole: "vector_control",
    isPurePlay: true,
  },
];

export const PHARMA_TICKER_BY_SYMBOL: Record<string, PharmaTickerMeta> = Object.fromEntries(
  PHARMA_TICKERS.map((t) => [t.ticker, t]),
);

export type DiseaseTickerMappingMeta = {
  diseaseSlug: DiseaseSlug;
  ticker: string;
  weight: number;
  leadRole: string;
  rationale: string;
};

export const DISEASE_TICKER_MAPPINGS: DiseaseTickerMappingMeta[] = [
  {
    diseaseSlug: "hantavirus",
    ticker: "GETI-B.ST",
    weight: 0.3,
    leadRole: "Acute ECMO & cardiopulmonary support",
    rationale: "HPS outbreaks drive sudden ICU ECMO/ventilator utilization spikes.",
  },
  {
    diseaseSlug: "hantavirus",
    ticker: "BAX",
    weight: 0.25,
    leadRole: "Renal CRRT & IV fluid management",
    rationale: "HFRS renal failure & HPS fluid resuscitation drive acute Baxter hospital demand.",
  },
  {
    diseaseSlug: "hantavirus",
    ticker: "DHR",
    weight: 0.25,
    leadRole: "Cepheid molecular differential PCR",
    rationale: "Rule-out respiratory/hemorrhagic panels surge prior to confirmed HPS/HFRS.",
  },
  {
    diseaseSlug: "hantavirus",
    ticker: "RTO",
    weight: 0.2,
    leadRole: "Commercial rodent control & remediation",
    rationale: "Rural agricultural & lodging outbreaks spike rodent biosecurity contracts.",
  },
  {
    diseaseSlug: "dengue",
    ticker: "TAK",
    weight: 0.35,
    leadRole: "Qdenga (TAK-003) dengue vaccine",
    rationale: "Primary global dengue vaccine supplier; public procurement follows epidemic waves.",
  },
  {
    diseaseSlug: "dengue",
    ticker: "ABT",
    weight: 0.25,
    leadRole: "Panbio Dengue NS1/IgM rapid tests",
    rationale: "Rapid antigen procurement leads official ministry confirmations by 7-14 days.",
  },
  {
    diseaseSlug: "dengue",
    ticker: "BAX",
    weight: 0.25,
    leadRole: "IV crystalloid fluid resuscitation",
    rationale: "Severe dengue plasma leakage creates rapid hospital IV fluid shortages.",
  },
  {
    diseaseSlug: "dengue",
    ticker: "RTO",
    weight: 0.15,
    leadRole: "Aedes vector abatement services",
    rationale:
      "Municipal larvicide and vector fogging contracts expand during transmission spikes.",
  },
  {
    diseaseSlug: "h5n1",
    ticker: "CSL.AX",
    weight: 0.3,
    leadRole: "Seqirus pre-pandemic H5N1 stockpiles",
    rationale: "Direct government contracts for zoonotic influenza preparedness.",
  },
  {
    diseaseSlug: "h5n1",
    ticker: "MRNA",
    weight: 0.25,
    leadRole: "mRNA-1018 pandemic influenza candidate",
    rationale: "High-beta institutional proxy for avian flu spillover headlines and BARDA awards.",
  },
  {
    diseaseSlug: "h5n1",
    ticker: "RHHBY",
    weight: 0.25,
    leadRole: "Oseltamivir (Tamiflu) & Xofluza",
    rationale: "First-line neuraminidase & endonuclease antiviral stockpiling.",
  },
  {
    diseaseSlug: "h5n1",
    ticker: "QGEN",
    weight: 0.2,
    leadRole: "QIAstat-Dx respiratory PCR panels",
    rationale: "Hospital & veterinary lab surveillance testing demand.",
  },
  {
    diseaseSlug: "mpox",
    ticker: "BAVA.CO",
    weight: 0.4,
    leadRole: "Jynneos / Imvanex MVA-BN vaccine",
    rationale: "Sole global WHO-prequalified Mpox vaccine pure-play supplier.",
  },
  {
    diseaseSlug: "mpox",
    ticker: "SIGA",
    weight: 0.35,
    leadRole: "Tpoxx (tecovirimat) antiviral",
    rationale: "Pure-play orthopox antiviral; extreme sensitivity to Clade-I declarations.",
  },
  {
    diseaseSlug: "mpox",
    ticker: "DHR",
    weight: 0.15,
    leadRole: "Cepheid Xpert Mpox PCR cartridges",
    rationale: "Point-of-care multiplex orthopox diagnostic cartridge procurement.",
  },
  {
    diseaseSlug: "mpox",
    ticker: "EBS",
    weight: 0.1,
    leadRole: "ACAM2000 & biodefense countermeasures",
    rationale: "Secondary orthopox stockpile supplier.",
  },
  {
    diseaseSlug: "arbovirus",
    ticker: "VALN",
    weight: 0.45,
    leadRole: "Ixchiq (VLA1553) chikungunya vaccine",
    rationale: "Pure-play chikungunya vaccine leader sensitive to tropical/Southern Cone spikes.",
  },
  {
    diseaseSlug: "arbovirus",
    ticker: "BIM.PA",
    weight: 0.25,
    leadRole: "BioFire/multiplex arbovirus diagnostics",
    rationale: "Co-circulating Dengue/Zika/Chikungunya differential PCR demand.",
  },
  {
    diseaseSlug: "arbovirus",
    ticker: "ABT",
    weight: 0.15,
    leadRole: "Point-of-care febrile lateral flow assays",
    rationale: "Clinic-level differential triage testing.",
  },
  {
    diseaseSlug: "arbovirus",
    ticker: "RTO",
    weight: 0.15,
    leadRole: "Aedes vector suppression",
    rationale: "Shared Aedes vector control demand.",
  },
  {
    diseaseSlug: "cholera",
    ticker: "BAX",
    weight: 0.4,
    leadRole: "Lactated Ringer's & IV hydration",
    rationale: "Acute cholera dehydration triggers immediate IV fluid replenishment orders.",
  },
  {
    diseaseSlug: "cholera",
    ticker: "BIM.PA",
    weight: 0.25,
    leadRole: "FilmArray GI enteric panels",
    rationale: "Wastewater and clinical diarrheal cluster identification.",
  },
  {
    diseaseSlug: "cholera",
    ticker: "BDX",
    weight: 0.2,
    leadRole: "Acute infusion catheters & diagnostics",
    rationale: "High-volume emergency triage consumable utilization.",
  },
  {
    diseaseSlug: "cholera",
    ticker: "ABT",
    weight: 0.15,
    leadRole: "Field waterborne triage & electrolyte testing",
    rationale: "i-STAT point-of-care electrolyte monitoring in severe dehydration.",
  },
];

export function getTickersForDisease(diseaseSlug: DiseaseSlug): Array<
  DiseaseTickerMappingMeta & {
    meta: PharmaTickerMeta;
  }
> {
  return DISEASE_TICKER_MAPPINGS.filter((m) => m.diseaseSlug === diseaseSlug).map((m) => ({
    ...m,
    meta: PHARMA_TICKER_BY_SYMBOL[m.ticker],
  }));
}
