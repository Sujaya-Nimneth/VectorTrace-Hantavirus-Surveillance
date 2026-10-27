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

export function isPlottable<T extends { lat: number | null; lng: number | null }>(
  point: T,
): point is T & { lat: number; lng: number } {
  return isPlottableCoordinates(point.lat, point.lng);
}
