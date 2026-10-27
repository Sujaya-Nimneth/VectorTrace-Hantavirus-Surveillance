const GEOCODING_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";

export type Coordinates = {
  lat: number;
  lng: number;
  source: "open-meteo" | "fallback";
};

const REGION_ALIASES: Record<string, string> = {
  "african region (afro)": "Africa",
  "democratic republic of the congo & uganda": "Democratic Republic of the Congo",
  "democratic republic of the congo, kenya and nigeria": "Democratic Republic of the Congo",
  "kingdom of saudi arabia": "Saudi Arabia",
  "mauritania and senegal": "Mauritania",
  "russian federation": "Russia",
  "united states of america": "United States",
};

// Country/region centroids keep the map useful during a geocoder outage.
const FALLBACK_COORDINATES: Record<string, Omit<Coordinates, "source">> = {
  africa: { lat: 8.7832, lng: 34.5085 },
  bangladesh: { lat: 23.685, lng: 90.3563 },
  cambodia: { lat: 12.5657, lng: 104.991 },
  "democratic republic of the congo": { lat: 4.4411, lng: 15.2663 },
  ethiopia: { lat: 9.145, lng: 40.489673 },
  india: { lat: 20.5937, lng: 78.9629 },
  israel: { lat: 31.0461, lng: 34.8516 },
  italy: { lat: 41.8719, lng: 12.5674 },
  kenya: { lat: -0.0236, lng: 37.9062 },
  mauritania: { lat: 21.0079, lng: -10.9408 },
  nigeria: { lat: 9.082, lng: 8.6753 },
  "papua new guinea": { lat: -6.314993, lng: 143.9555 },
  russia: { lat: 61.524, lng: 105.3188 },
  "saudi arabia": { lat: 23.8859, lng: 45.0792 },
  senegal: { lat: 14.4974, lng: -14.4524 },
  thailand: { lat: 15.87, lng: 100.9925 },
  "timor-leste": { lat: -8.8746, lng: 125.7275 },
  uganda: { lat: 1.3733, lng: 32.2903 },
  "united states": { lat: 37.0902, lng: -95.7129 },
};

const UNPLOTTABLE_REGIONS = new Set(["global", "multi-country", "multi-locations", "unknown"]);

export function isAggregateRegion(region: string): boolean {
  return UNPLOTTABLE_REGIONS.has(region.trim().toLowerCase());
}

export function isPlottableCoordinates(
  lat: number | null | undefined,
  lng: number | null | undefined,
): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

function fallbackFor(region: string): Coordinates | null {
  const normalized = region.trim().toLowerCase();
  const fallback = FALLBACK_COORDINATES[normalized];
  return fallback ? { ...fallback, source: "fallback" } : null;
}

function candidateNames(region: string): string[] {
  const normalized = region.trim().toLowerCase();
  const alias = REGION_ALIASES[normalized];
  return [...new Set([alias, region.trim()].filter((value): value is string => !!value))];
}

export async function geocodeRegion(region: string): Promise<Coordinates | null> {
  const normalized = region.trim().toLowerCase();
  if (!normalized || UNPLOTTABLE_REGIONS.has(normalized)) return null;

  for (const name of candidateNames(region)) {
    const url = new URL(GEOCODING_ENDPOINT);
    url.searchParams.set("name", name);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
      if (!response.ok) continue;
      const payload = (await response.json()) as {
        results?: Array<{ latitude?: number; longitude?: number }>;
      };
      const result = payload.results?.[0];
      if (
        typeof result?.latitude === "number" &&
        typeof result.longitude === "number" &&
        isPlottableCoordinates(result.latitude, result.longitude)
      ) {
        return { lat: result.latitude, lng: result.longitude, source: "open-meteo" };
      }
    } catch {
      // Try the next candidate or the deterministic centroid below.
    }
  }

  return fallbackFor(REGION_ALIASES[normalized] ?? region);
}
