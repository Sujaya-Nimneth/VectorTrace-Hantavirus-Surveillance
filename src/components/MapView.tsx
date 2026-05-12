import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { useCases, useRodents } from "@/hooks/use-surveillance";
import type { Case } from "@/lib/mock-data";
import { Layers, Calendar, X, MapPin, AlertTriangle, Rat, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

function HeatLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();
  useEffect(() => {
    const layer = (L as any).heatLayer(points, {
      radius: 28, blur: 22, maxZoom: 9, minOpacity: 0.25,
      gradient: { 0.2: "#fbbf24", 0.5: "#f97316", 0.8: "#ef4444", 1.0: "#dc2626" },
    });
    layer.addTo(map);
    return () => { map.removeLayer(layer); };
  }, [map, points]);
  return null;
}

const rodentIcon = L.divIcon({
  className: "",
  html: '<div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:14px solid oklch(0.55 0.22 295);filter:drop-shadow(0 0 4px oklch(0.55 0.22 295 / 0.6));"></div>',
  iconSize: [16, 14], iconAnchor: [8, 14],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length) map.fitBounds(points as any, { padding: [40, 40] });
  }, []);
  return null;
}

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

export default function MapView() {
  const [layers, setLayers] = useState({ cases: true, rodents: true, density: true });
  const [range, setRange] = useState(30);
  const [selected, setSelected] = useState<Case | null>(null);
  const { data: CASES } = useCases();
  const RODENTS = useRodents();

  const now = Date.now();
  const visibleCases = useMemo(
    () => CASES.filter(c => (now - +new Date(c.date)) / 86400000 <= range),
    [range, CASES, now],
  );
  const visibleRodents = useMemo(
    () => RODENTS.filter(r => (now - +new Date(r.date)) / 86400000 <= range),
    [range, RODENTS, now],
  );

  const points: [number, number][] = useMemo(
    () => [...visibleCases, ...visibleRodents].map(p => [p.lat, p.lng]),
    [visibleCases, visibleRodents],
  );

  const proxRodents = selected
    ? RODENTS.filter(r => {
        const d = haversine(selected.lat, selected.lng, r.lat, r.lng);
        return d < 5 && r.positivity > 30;
      })
    : [];

  return (
    <div className="relative h-full w-full bg-[#0b1220]">
      <MapContainer
        center={[-34, -64]}
        zoom={4}
        className="h-full w-full z-0"
        style={{ background: "#0b1220" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap, &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {points.length > 0 && <FitBounds points={points} />}
        {layers.density && visibleCases.map(c => (
          <CircleMarker key={`d-${c.id}`} center={[c.lat, c.lng]} radius={28}
            pathOptions={{ color: "transparent", fillColor: "oklch(0.7 0.18 50)", fillOpacity: 0.07 }} />
        ))}
        {layers.cases && visibleCases.map(c => (
          <CircleMarker key={c.id} center={[c.lat, c.lng]} radius={6}
            pathOptions={{
              color: "oklch(0.98 0 0)", weight: 1.5,
              fillColor: c.status === "Confirmed" ? "oklch(0.58 0.24 25)" : "oklch(0.7 0.18 50)",
              fillOpacity: 0.85,
              className: "pulse-marker",
            }}
            eventHandlers={{ click: () => setSelected(c) }}>
            <Tooltip>{c.id} · {c.region}</Tooltip>
          </CircleMarker>
        ))}
        {layers.rodents && visibleRodents.map(r => (
          <Marker key={r.id} position={[r.lat, r.lng]} icon={rodentIcon}>
            <Popup>
              <div className="text-[12px]">
                <div className="font-semibold">{r.id}</div>
                <div>{r.species}</div>
                <div className="text-orange-600">Positivity: {r.positivity}%</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Layer switcher */}
      <div className="absolute top-4 right-4 z-[400] bg-[#0f1a2e]/95 backdrop-blur border border-white/10 rounded-lg p-3 shadow-xl text-white w-56">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/60 mb-2.5">
          <Layers className="size-3.5" /> Data Layers
        </div>
        {([
          { k: "cases", label: "Human Cases", color: "bg-alert", icon: AlertTriangle },
          { k: "rodents", label: "Rodent Vectors", color: "bg-purple-500", icon: Rat },
          { k: "density", label: "Risk Density", color: "bg-warning", icon: Activity },
        ] as const).map(l => {
          const Icon = l.icon;
          return (
            <label key={l.k} className="flex items-center gap-2.5 py-1.5 cursor-pointer hover:bg-white/5 px-1.5 rounded">
              <input type="checkbox" checked={layers[l.k]} onChange={e => setLayers(s => ({ ...s, [l.k]: e.target.checked }))}
                className="accent-teal size-3.5" />
              <span className={cn("size-2 rounded-full", l.color)} />
              <Icon className="size-3.5 text-white/60" />
              <span className="text-[12px] flex-1">{l.label}</span>
            </label>
          );
        })}
      </div>

      {/* Time slider */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] bg-[#0f1a2e]/95 backdrop-blur border border-white/10 rounded-lg px-4 py-3 shadow-xl text-white flex items-center gap-3">
        <Calendar className="size-4 text-teal" />
        <span className="text-[11px] uppercase tracking-wider text-white/60">Time window</span>
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button key={r.days} onClick={() => setRange(r.days)}
              className={cn("px-3 py-1 rounded text-[12px] font-semibold transition-colors",
                range === r.days ? "bg-teal text-white" : "text-white/60 hover:bg-white/5")}>
              Last {r.label}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-white/60 border-l border-white/10 pl-3">
          {visibleCases.length} cases · {visibleRodents.length} sites
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="absolute top-0 right-0 bottom-0 w-[380px] z-[500] bg-card border-l border-border shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
          <div className="p-5 border-b border-border flex items-start justify-between bg-primary text-primary-foreground">
            <div>
              <div className="text-[11px] uppercase tracking-wider opacity-70">Case Detail</div>
              <div className="text-lg font-bold mt-0.5">{selected.id}</div>
              <div className="text-[12px] opacity-80 mt-1 flex items-center gap-1.5">
                <MapPin className="size-3" /> {selected.region}
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="p-1.5 rounded hover:bg-white/10">
              <X className="size-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <Field label="Status" value={selected.status} accent={selected.status === "Confirmed" ? "alert" : "warning"} />
              <Field label="Syndrome" value={selected.syndrome} />
              <Field label="Age" value={`${selected.age}y`} />
              <Field label="Sex" value={selected.sex} />
              <Field label="Reported" value={new Date(selected.date).toLocaleDateString()} />
              <Field label="Coords" value={`${selected.lat.toFixed(2)}, ${selected.lng.toFixed(2)}`} />
            </div>

            {proxRodents.length > 0 ? (
              <div className="rounded-md border border-alert/30 bg-alert/10 p-3">
                <div className="flex items-center gap-1.5 text-alert font-semibold text-[12px] mb-1.5">
                  <AlertTriangle className="size-3.5" /> Proximity Alert
                </div>
                <div className="text-[11.5px] text-foreground">
                  {proxRodents.length} positive rodent site{proxRodents.length > 1 ? "s" : ""} within 5km radius.
                </div>
                <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                  {proxRodents.slice(0, 3).map(r => (
                    <li key={r.id} className="flex justify-between">
                      <span>{r.id} · {r.species}</span>
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

      <style>{`
        .pulse-marker { animation: pulseMarker 1.8s ease-out infinite; }
        @keyframes pulseMarker {
          0%, 100% { fill-opacity: 0.85; }
          50% { fill-opacity: 0.4; }
        }
        .leaflet-container { font-family: 'Inter', sans-serif; }
        .leaflet-popup-content-wrapper, .leaflet-popup-tip { background: #0f1a2e; color: #fff; border: 1px solid rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent?: "alert" | "warning" }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("font-semibold mt-0.5",
        accent === "alert" && "text-alert",
        accent === "warning" && "text-warning")}>{value}</div>
    </div>
  );
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
