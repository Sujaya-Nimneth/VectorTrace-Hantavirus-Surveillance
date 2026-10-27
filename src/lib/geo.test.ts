import { describe, expect, it } from "vitest";
import { isPlottable, isPlottableCoordinates } from "./geo";

describe("map coordinate validation", () => {
  it("accepts in-range coordinates", () => {
    expect(isPlottableCoordinates(4.4411, 15.2663)).toBe(true);
    expect(isPlottable({ lat: -41.13, lng: -71.31 })).toBe(true);
  });

  it("rejects the zero sentinel and invalid values", () => {
    expect(isPlottableCoordinates(0, 0)).toBe(false);
    expect(isPlottableCoordinates(null, null)).toBe(false);
    expect(isPlottableCoordinates(4.4, null)).toBe(false);
    expect(isPlottableCoordinates(91, 10)).toBe(false);
    expect(isPlottableCoordinates(10, -181)).toBe(false);
    expect(isPlottableCoordinates(Number.NaN, 10)).toBe(false);
  });
});
