import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";

const MapView = lazy(() => import("@/components/MapView"));

export type MapSearch = {
  case?: string;
  site?: string;
  region?: string;
};

export const Route = createFileRoute("/map")({
  component: MapPage,
  head: () => ({ meta: [{ title: "Geospatial Tracker · VectorTrace" }] }),
  ssr: false,
  validateSearch: (search: Record<string, unknown>): MapSearch => ({
    case: typeof search.case === "string" ? search.case : undefined,
    site: typeof search.site === "string" ? search.site : undefined,
    region: typeof search.region === "string" ? search.region : undefined,
  }),
});

function MapPage() {
  const fallback = (
    <div className="h-full grid place-items-center bg-map-canvas text-white/60 text-sm">
      Loading geospatial layer…
    </div>
  );
  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <MapView />
      </Suspense>
    </ClientOnly>
  );
}
