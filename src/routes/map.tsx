import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const MapView = lazy(() => import("@/components/MapView"));

export const Route = createFileRoute("/map")({
  component: MapPage,
  head: () => ({ meta: [{ title: "Geospatial Tracker · VectorTrace" }] }),
});

function MapPage() {
  return (
    <Suspense fallback={<div className="h-full grid place-items-center bg-[#0b1220] text-white/60 text-sm">Loading geospatial layer…</div>}>
      <MapView />
    </Suspense>
  );
}
