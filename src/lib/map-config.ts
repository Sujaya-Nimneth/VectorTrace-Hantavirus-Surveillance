type EnvLike = Record<string, string | undefined>;

export type MapTileConfig = {
  url: string;
  attribution: string;
  maxNativeZoom: number;
};

export const DEFAULT_MAP_TILE_URL =
  "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";

export const DEFAULT_MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, &copy; OpenStreetMap contributors';

function envValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseMaxNativeZoom(value: string | undefined): number {
  if (!value?.trim()) return 16;
  const zoom = Number(value);
  return Number.isInteger(zoom) && zoom >= 0 && zoom <= 24 ? zoom : 16;
}

export function computeMapTileConfig(env: EnvLike): MapTileConfig {
  return {
    url: envValue(env.VITE_MAP_TILE_URL) ?? DEFAULT_MAP_TILE_URL,
    attribution: envValue(env.VITE_MAP_TILE_ATTRIBUTION) ?? DEFAULT_MAP_TILE_ATTRIBUTION,
    maxNativeZoom: parseMaxNativeZoom(env.VITE_MAP_TILE_MAX_NATIVE_ZOOM),
  };
}

export function getMapTileConfig(): MapTileConfig {
  return computeMapTileConfig((import.meta as unknown as { env?: EnvLike }).env ?? {});
}
