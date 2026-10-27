import { describe, expect, it } from "vitest";
import {
  computeMapTileConfig,
  DEFAULT_MAP_TILE_ATTRIBUTION,
  DEFAULT_MAP_TILE_URL,
} from "./map-config";

describe("computeMapTileConfig", () => {
  it("uses the keyless Esri dark basemap by default", () => {
    expect(computeMapTileConfig({})).toEqual({
      url: DEFAULT_MAP_TILE_URL,
      attribution: DEFAULT_MAP_TILE_ATTRIBUTION,
      maxNativeZoom: 16,
    });
  });

  it("supports a build-time tile provider override", () => {
    expect(
      computeMapTileConfig({
        VITE_MAP_TILE_URL: " https://tiles.example.com/{z}/{x}/{y}.png ",
        VITE_MAP_TILE_ATTRIBUTION: " Example Maps ",
        VITE_MAP_TILE_MAX_NATIVE_ZOOM: "14",
      }),
    ).toEqual({
      url: "https://tiles.example.com/{z}/{x}/{y}.png",
      attribution: "Example Maps",
      maxNativeZoom: 14,
    });
  });

  it("falls back when optional overrides are blank or invalid", () => {
    expect(
      computeMapTileConfig({
        VITE_MAP_TILE_URL: " ",
        VITE_MAP_TILE_ATTRIBUTION: "",
        VITE_MAP_TILE_MAX_NATIVE_ZOOM: "not-a-zoom",
      }),
    ).toEqual({
      url: DEFAULT_MAP_TILE_URL,
      attribution: DEFAULT_MAP_TILE_ATTRIBUTION,
      maxNativeZoom: 16,
    });
  });
});
