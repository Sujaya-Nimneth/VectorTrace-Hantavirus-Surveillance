import { useEffect, useMemo, useRef, useState, useCallback, memo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { useCases, useRodents } from "@/hooks/use-surveillance";
import { useNow } from "@/hooks/use-now";
import { REGIONS, type Case, type RodentSite } from "@/lib/mock-data";
import { Layers, Calendar, X, MapPin, AlertTriangle, Rat, Activity, Loader2 } from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { DAY_MS } from "@/lib/time";
import { cn } from "@/lib/utils";
import { QueryError } from "@/components/QueryError";

type HeatLayerInstance = L.Layer & {
  setLatLngs: (latlngs: [number, number, number][]) => HeatLayerInstance;
};

type LeafletWithHeat = typeof L & {
  heatLayer: (
    latlngs: [number, number, number][],
    options?: {
      radius?: number;
      blur?: number;
      maxZoom?: number;
      minOpacity?: number;
      gradient?: Record<number, string>;
    },
  ) => HeatLayerInstance;
};

function HeatLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();
  const layerRef = useRef<HeatLayerInstance | null>(null);

  useEffect(() => {
    const layer = (L as LeafletWithHeat).heatLayer([], {
      radius: 28,
      blur: 22,
      maxZoom: 9,
      minOpacity: 0.25,
      gradient: { 0.2: "#fbbf24", 0.5: "#f97316", 0.8: "#ef4444", 1.0: "#dc2626" },
    });
    layer.addTo(map);
    layerRef.current = layer;
    return () => {
      try {
        map.removeLayer(layer);
      } catch {
        /* ignore */
      }
      layerRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setLatLngs(points);
    }
  }, [points]);

  return null;
}

const rodentIcon = L.divIcon({
  className: "",
  html: `<div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:14px solid var(--map-rodent);filter:drop-shadow(0 0 4px color-mix(in oklch, var(--map-rodent) 60%, transparent));"></div>`,
  iconSize: [16, 14],
  iconAnchor: [8, 14],
});

function MapController({
  points,
  range,
  cases,
  rodents,
  onSelectCase,
}: {
  points: [number, number][];
  range: number;
  cases: Case[];
  rodents: RodentSite[];
  onSelectCase: (c: Case) => void;
}) {
  const map = useMap();
  const fittedRangeRef = useRef<number | null>(null);
  // Focus targets arrive as URL search params (?case= / ?site= / ?region=),
  // so deep links are shareable and survive refresh.
  const search = useSearch({ strict: false }) as { case?: string; site?: string; region?: string };

  // Refs so the focus effect below registers once instead of re-subscribing
  // every time the data arrays change.
  const casesRef = useRef(cases);
  casesRef.current = cases;
  const rodentsRef = useRef(rodents);
  rodentsRef.current = rodents;
  const selectRef = useRef(onSelectCase);
  selectRef.current = onSelectCase;

  useEffect(() => {
    if (points.length > 0 && fittedRangeRef.current !== range) {
      try {
        map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
        fittedRangeRef.current = range;
      } catch {
        /* ignore */
      }
    }
  }, [map, points, range]);

  const focusKey = `${search.case ?? ""}|${search.site ?? ""}|${search.region ?? ""}`;
  const hasFocus = focusKey.replace(/\|/g, "").length > 0;
  useEffect(() => {
    if (!hasFocus) return;
    try {
      if (search.case) {
        const found = casesRef.current.find((c) => c.id === search.case);
        if (found) {
          map.flyTo([found.lat, found.lng], 8, { duration: 0.8 });
          selectRef.current(found);
        }
      } else if (search.site) {
        const site = rodentsRef.current.find((r) => r.id === search.site);
        if (site) map.flyTo([site.lat, site.lng], 8, { duration: 0.8 });
      } else if (search.region) {
        const region = REGIONS.find((r) => r.name === search.region);
        if (region) map.flyTo([region.lat, region.lng], 6, { duration: 0.8 });
      }
      // Focus should win over the initial fitBounds once a target exists.
      fittedRangeRef.current = range;
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, map, range]);

  return null;
}

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

// Memoized per-marker components: a realtime INSERT produces a new array but
// reuses the existing item objects, so only the new marker renders.
const CaseDot = memo(function CaseDot({
  c,
  pulse,
  onSelect,
}: {
  c: Case;
  pulse: boolean;
  onSelect: (c: Case) => void;
}) {
  return (
    <CircleMarker
      center={[c.lat, c.lng]}
      radius={6}
      pathOptions={{
        color: "oklch(0.98 0 0)",
        weight: 1.5,
        fillColor: c.status === "Confirmed" ? "oklch(0.58 0.24 25)" : "oklch(0.7 0.18 50)",
        fillOpacity: 0.85,
        className: pulse ? "pulse-marker" : undefined,
      }}
      eventHandlers={{ click: () => onSelect(c) }}
    >
      <Tooltip>
        {c.id} · {c.region}
      </Tooltip>
    </CircleMarker>
  );
});

const RodentPin = memo(function RodentPin({ r }: { r: RodentSite }) {
  return (
    <Marker position={[r.lat, r.lng]} icon={rodentIcon}>
      <Popup>
        <div className="text-[12px]">
          <div className="font-semibold">{r.id}</div>
          <div>{r.species}</div>
          <div className="text-warning">Positivity: {r.positivity}%</div>
        </div>
      </Popup>
    </Marker>
  );
});

export default function MapView() {
  const [layers, setLayers] = useState({ cases: true, rodents: true, density: true });
  const [range, setRange] = useState(30);
  const [selected, setSelected] = useState<Case | null>(null);
  const {
    data: CASES,
    loading: casesLoading,
    error: casesError,
    refetch: refetchCases,
  } = useCases();
  const {
    data: RODENTS,
    loading: rodentsLoading,
    error: rodentsError,
    refetch: refetchRodents,
  } = useRodents();
  const now = useNow();
  const navigate = useNavigate({ from: "/map" });
  const loadError = casesError ?? rodentsError ?? null;
  const loading = casesLoading || rodentsLoading;

  const visibleCases = useMemo(() => {
    return CASES.filter((c) => now - +new Date(c.date) <= range * DAY_MS);
  }, [range, CASES, now]);

  const visibleRodents = useMemo(() => {
    return RODENTS.filter((r) => now - +new Date(r.date) <= range * DAY_MS);
  }, [range, RODENTS, now]);

  const points: [number, number][] = useMemo(
    () => [...visibleCases, ...visibleRodents].map((p) => [p.lat, p.lng]),
    [visibleCases, visibleRodents],
  );

  const heatPoints: [number, number, number][] = useMemo(
    () => visibleCases.map((c) => [c.lat, c.lng, c.status === "Confirmed" ? 1 : 0.6]),
    [visibleCases],
  );

  const proxRodents = useMemo(() => {
    if (!selected) return [];
    return RODENTS.filter((r) => {
      const d = haversine(selected.lat, selected.lng, r.lat, r.lng);
      return d < 5 && r.positivity > 30;
    });
  }, [selected, RODENTS]);

  // Escape closes the case detail drawer.
  const closeDrawer = useCallback(() => {
    setSelected(null);
    // Drop the ?case= focus param so the URL matches the closed drawer.
    navigate({ search: {} });
  }, [navigate]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, closeDrawer]);

  return (
    <div className="relative h-full w-full bg-map-canvas">
      {loadError ? (
        <div className="absolute inset-0 z-[600] grid place-items-center bg-map-canvas p-6">
          <div className="w-full max-w-md">
            <QueryError
              what="surveillance map data"
              error={loadError}
              onRetry={() => {
                void refetchCases();
                void refetchRodents();
              }}
            />
          </div>
        </div>
      ) : loading ? (
        <div
          className="absolute inset-0 z-[600] grid place-items-center bg-map-canvas"
          role="status"
        >
          <span className="sr-only">Loading map data…</span>
          <Loader2 className="size-6 animate-spin text-white/70" />
        </div>
      ) : (
        <>
          <MapContainer
            center={[-34, -64]}
            zoom={4}
            className="h-full w-full z-0"
            style={{ background: "var(--map-canvas)" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap, &copy; CARTO"
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <MapController
              points={points}
              range={range}
              cases={CASES}
              rodents={RODENTS}
              onSelectCase={setSelected}
            />
            {layers.density && heatPoints.length > 0 && <HeatLayer points={heatPoints} />}
            {layers.cases &&
              visibleCases.map((c, i) => (
                <CaseDot key={c.id} c={c} pulse={i < 25} onSelect={setSelected} />
              ))}
            {layers.rodents && visibleRodents.map((r) => <RodentPin key={r.id} r={r} />)}
          </MapContainer>

          {/* Layer switcher */}
          <div className="absolute top-4 right-4 z-[400] bg-map-panel/95 backdrop-blur border border-white/10 rounded-lg p-3 shadow-xl text-white w-52 sm:w-56">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/60 mb-2.5">
              <Layers className="size-3.5" /> Data Layers
            </div>
            {(
              [
                { k: "cases", label: "Human Cases", color: "bg-alert", icon: AlertTriangle },
                { k: "rodents", label: "Rodent Vectors", color: "bg-map-rodent", icon: Rat },
                { k: "density", label: "Risk Density", color: "bg-warning", icon: Activity },
              ] as const
            ).map((l) => {
              const Icon = l.icon;
              return (
                <label
                  key={l.k}
                  className="flex items-center gap-2.5 py-1.5 cursor-pointer hover:bg-white/5 px-1.5 rounded"
                >
                  <input
                    type="checkbox"
                    checked={layers[l.k]}
                    onChange={(e) => setLayers((s) => ({ ...s, [l.k]: e.target.checked }))}
                    className="accent-teal size-3.5"
                  />
                  <span className={cn("size-2 rounded-full", l.color)} />
                  <Icon className="size-3.5 text-white/60" />
                  <span className="text-[12px] flex-1">{l.label}</span>
                </label>
              );
            })}
          </div>

          {/* Time slider */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[400] max-w-[calc(100vw-2rem)] bg-map-panel/95 backdrop-blur border border-white/10 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 shadow-xl text-white flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4 text-teal" />
              <span className="text-[11px] uppercase tracking-wider text-white/60 hidden sm:inline">
                Time window
              </span>
            </div>
            <div className="flex gap-1">
              {RANGES.map((r) => (
                <button
                  key={r.days}
                  type="button"
                  aria-pressed={range === r.days}
                  onClick={() => setRange(r.days)}
                  className={cn(
                    "px-2.5 sm:px-3 py-1 rounded text-[12px] font-semibold transition-colors",
                    range === r.days ? "bg-teal text-white" : "text-white/60 hover:bg-white/5",
                  )}
                >
                  Last {r.label}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-white/60 sm:border-l sm:border-white/10 sm:pl-3">
              {visibleCases.length} cases · {visibleRodents.length} sites
            </div>
          </div>

          {/* Heat density legend */}
          <div
            className="absolute bottom-4 right-4 z-[400] bg-map-panel/95 backdrop-blur border border-white/10 rounded-lg px-3 py-2.5 shadow-xl text-white"
            aria-hidden="true"
          >
            <div className="text-[10px] uppercase tracking-wider text-white/60 mb-1.5">
              Case density
            </div>
            <div className="h-2 w-32 rounded-full bg-gradient-to-r from-[#fbbf24] via-[#f97316] to-[#dc2626]" />
            <div className="flex justify-between text-[10px] text-white/60 mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Empty state: data loaded but nothing in range */}
          {visibleCases.length === 0 && visibleRodents.length === 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-map-panel/95 backdrop-blur border border-white/10 rounded-lg px-4 py-2.5 text-white/80 text-[12px] flex items-center gap-2 shadow-xl">
              <AlertTriangle className="size-3.5 text-warning" />
              No surveillance data within the last {range} days.
            </div>
          )}

          {/* Detail drawer */}
          {selected && (
            <div className="absolute top-0 right-0 bottom-0 w-full sm:w-[380px] z-[500] bg-card border-l border-border shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="p-5 border-b border-border flex items-start justify-between bg-primary text-primary-foreground">
                <div>
                  <div className="text-[11px] uppercase tracking-wider opacity-70">Case Detail</div>
                  <div className="text-lg font-bold mt-0.5">{selected.id}</div>
                  <div className="text-[12px] opacity-80 mt-1 flex items-center gap-1.5">
                    <MapPin className="size-3" /> {selected.region}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  aria-label="Close case details"
                  className="p-1.5 rounded hover:bg-white/10"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <Field
                    label="Status"
                    value={selected.status}
                    accent={selected.status === "Confirmed" ? "alert" : "warning"}
                  />
                  <Field label="Syndrome" value={selected.syndrome} />
                  <Field label="Age" value={selected.age != null ? `${selected.age}y` : "—"} />
                  <Field label="Sex" value={selected.sex ?? "Unknown"} />
                  <Field label="Reported" value={new Date(selected.date).toLocaleDateString()} />
                  <Field
                    label="Coords"
                    value={`${selected.lat.toFixed(2)}, ${selected.lng.toFixed(2)}`}
                  />
                </div>

                {(selected.symptoms.length > 0 || selected.exposure) && (
                  <div className="rounded-md border border-border p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                      Clinical Notes
                    </div>
                    {selected.symptoms.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selected.symptoms.map((s) => (
                          <span
                            key={s}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {selected.exposure && (
                      <p className="text-[11.5px] text-muted-foreground mt-2 leading-snug">
                        {selected.exposure}
                      </p>
                    )}
                  </div>
                )}

                {proxRodents.length > 0 ? (
                  <div className="rounded-md border border-alert/30 bg-alert/10 p-3">
                    <div className="flex items-center gap-1.5 text-alert font-semibold text-[12px] mb-1.5">
                      <AlertTriangle className="size-3.5" /> Proximity Alert
                    </div>
                    <div className="text-[11.5px] text-foreground">
                      {proxRodents.length} positive rodent site{proxRodents.length > 1 ? "s" : ""}{" "}
                      within 5km radius.
                    </div>
                    <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                      {proxRodents.slice(0, 3).map((r) => (
                        <li key={r.id} className="flex justify-between">
                          <span>
                            {r.id} · {r.species}
                          </span>
                          <span className="text-alert font-semibold">{r.positivity}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-md border border-success/30 bg-success/10 p-3 text-[12px] text-success">
                    No high-positivity rodent sites within 5km radius.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        .pulse-marker { animation: pulseMarker 1.8s ease-out infinite; }
        @keyframes pulseMarker {
          0%, 100% { fill-opacity: 0.85; }
          50% { fill-opacity: 0.4; }
        }
        .leaflet-container { font-family: 'Inter', sans-serif; background: var(--map-canvas); }
        .leaflet-popup-content-wrapper, .leaflet-popup-tip { background: var(--map-panel); color: #fff; border: 1px solid rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}

function Field({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "alert" | "warning";
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={cn(
          "font-semibold mt-0.5",
          accent === "alert" && "text-alert",
          accent === "warning" && "text-warning",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
