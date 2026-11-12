import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";

const MapView = lazy(() => import("@/components/MapView").then((m) => ({ default: m.MapView })));

export type MapSearch = { case?: string; site?: string; region?: string };

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
    <Center height="100%" minHeight={480}>
      <Spinner size="lg" label="Loading geospatial layer…" />
    </Center>
  );

  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <MapView />
      </Suspense>
    </ClientOnly>
  );
}
