Two runtime errors are still firing in the preview after the last round of fixes. Everything else from the audit (RBAC, live metrics, heatmap, SSR guard) is in place and working.

## Remaining issues

1. **Dashboard crash** — `cannot add postgres_changes callbacks for realtime:rt-cases after subscribe()`.
   - Cause: React StrictMode double-mounts the effect in `src/hooks/use-surveillance.ts`. All three hooks (`useCases`, `useRodents`, `useAlerts`) reuse fixed channel topics (`rt-cases`, `rt-rodents`, `rt-alerts`). Supabase keeps the channel object alive across the rapid unmount/remount, so the second mount tries to attach a `postgres_changes` listener to a channel that has already been subscribed.
   - Fix: give each mount a unique channel topic (e.g. `rt-cases-${crypto.randomUUID()}`) so the second mount creates a fresh channel. Cleanup still calls `removeChannel`.

2. **Map crash** — `Cannot read properties of undefined (reading '_leaflet_pos')` during a zoom transition on `/map`.
   - Cause: a layer (likely the heat layer) is being added/removed while the map's pane is mid-zoom-animation, or the heat layer survives a re-render after the map container is gone. Need to (a) guard the heat layer creation inside a `useEffect` that depends on the map instance and case data, (b) properly remove it on cleanup, and (c) ensure markers/heat layer aren't re-created on every render.
   - Fix: refactor `MapView.tsx` so the heat layer lives in a `useEffect` with proper add/remove lifecycle tied to the `useMap()` instance, and wrap any direct DOM/layer mutations in `map.whenReady(...)`.

## Plan

1. `src/hooks/use-surveillance.ts` — append a per-mount unique suffix to each `supabase.channel(...)` topic in `useCases`, `useRodents`, `useAlerts`.
2. `src/components/MapView.tsx` — extract the heatmap into a small child component that uses `useMap()` + `useEffect`, creates the `L.heatLayer` once, updates its data when cases change, and removes it on cleanup. Same pattern for any other imperative Leaflet layer added outside JSX.
3. Reload `/` and `/map` in the preview, confirm both errors are gone in console + runtime errors.

No schema, auth, or feature changes — pure bug-fix in two files.
