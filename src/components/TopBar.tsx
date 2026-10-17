import { useRouterState, Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Search,
  ChevronDown,
  ChevronRight,
  LogOut,
  LogIn,
  Menu,
  MapPin,
  Rat,
  ShieldAlert,
  X,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { useAlerts, useCases, useRodents } from "@/hooks/use-surveillance";
import { REGIONS } from "@/lib/mock-data";

const labels: Record<string, string> = {
  "/": "Executive Dashboard",
  "/map": "Geospatial Tracker",
  "/intake": "Rapid Case Intake",
  "/admin": "System Infrastructure",
};

export type MapFocusTarget =
  | { type: "case"; id: string; lat: number; lng: number }
  | { type: "rodent"; id: string; lat: number; lng: number }
  | { type: "region"; name: string; lat: number; lng: number };

export const MAP_FOCUS_STORAGE_KEY = "vectortrace_map_focus";
export const MAP_FOCUS_EVENT = "vectortrace:map-focus";

export function TopBar({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const label = labels[path] ?? "VectorTrace";
  const { user, signOut } = useAuth();
  const { roles, isAdmin } = useRoles();
  const { data: cases } = useCases();
  const rodents = useRodents();
  const { data: alerts } = useAlerts();
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(true);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const userRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (userRef.current && !userRef.current.contains(target)) setUserMenuOpen(false);
      if (alertsRef.current && !alertsRef.current.contains(target)) setAlertsOpen(false);
      if (searchRef.current && !searchRef.current.contains(target)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { regions: [], cases: [], rodents: [] };

    const matchedRegions = REGIONS.filter((r) => r.name.toLowerCase().includes(q)).slice(0, 3);
    const matchedCases = cases
      .filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.region.toLowerCase().includes(q) ||
          c.syndrome.toLowerCase().includes(q) ||
          c.status.toLowerCase().includes(q),
      )
      .slice(0, 5);
    const matchedRodents = rodents
      .filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.region.toLowerCase().includes(q) ||
          r.species.toLowerCase().includes(q),
      )
      .slice(0, 4);

    return { regions: matchedRegions, cases: matchedCases, rodents: matchedRodents };
  }, [query, cases, rodents]);

  const hasResults =
    searchResults.regions.length > 0 ||
    searchResults.cases.length > 0 ||
    searchResults.rodents.length > 0;

  const focusOnMap = (target: MapFocusTarget) => {
    try {
      sessionStorage.setItem(MAP_FOCUS_STORAGE_KEY, JSON.stringify(target));
      window.dispatchEvent(new CustomEvent(MAP_FOCUS_EVENT, { detail: target }));
    } catch {
      // ignore storage errors
    }
    setSearchOpen(false);
    setQuery("");
    navigate({ to: "/map" });
  };

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <header className="h-14 shrink-0 bg-card border-b border-border flex items-center px-4 sm:px-6 gap-3 sm:gap-4">
      {onOpenMenu && (
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
          className="md:hidden size-9 grid place-items-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <Menu className="size-4" />
        </button>
      )}

      <nav className="hidden sm:flex items-center text-[12px] text-muted-foreground gap-1.5 shrink-0">
        <span>VectorTrace</span>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium">{label}</span>
      </nav>

      <div ref={searchRef} className="flex-1 max-w-md mx-auto relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <input
          value={query}
          onFocus={() => setSearchOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchOpen(true);
          }}
          placeholder="Search cases, regions, vectors…"
          className="w-full h-9 pl-9 pr-8 rounded-md bg-muted/60 border border-transparent focus:bg-card focus:border-ring focus:outline-none text-[13px] placeholder:text-muted-foreground"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}

        {searchOpen && query.trim().length > 0 && (
          <div className="absolute left-0 right-0 mt-1.5 bg-card border border-border rounded-lg shadow-xl p-2 z-50 max-h-80 overflow-y-auto text-[12px]">
            {!hasResults ? (
              <div className="py-4 text-center text-muted-foreground">
                No matching cases, regions, or vector sites.
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.regions.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Regions
                    </div>
                    {searchResults.regions.map((r) => (
                      <button
                        key={r.name}
                        type="button"
                        onClick={() =>
                          focusOnMap({ type: "region", name: r.name, lat: r.lat, lng: r.lng })
                        }
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left"
                      >
                        <MapPin className="size-3.5 text-teal shrink-0" />
                        <span className="font-medium flex-1">{r.name}</span>
                        <span className="text-[11px] text-muted-foreground">
                          Pop. {r.pop.toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.cases.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Human Cases
                    </div>
                    {searchResults.cases.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          focusOnMap({ type: "case", id: c.id, lat: c.lat, lng: c.lng })
                        }
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left"
                      >
                        <ShieldAlert className="size-3.5 text-alert shrink-0" />
                        <span className="font-mono font-semibold">{c.id}</span>
                        <span className="text-muted-foreground truncate flex-1">{c.region}</span>
                        <span className="text-[11px] font-medium">{c.status}</span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.rodents.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Rodent Vector Sites
                    </div>
                    {searchResults.rodents.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() =>
                          focusOnMap({ type: "rodent", id: r.id, lat: r.lat, lng: r.lng })
                        }
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left"
                      >
                        <Rat className="size-3.5 text-warning shrink-0" />
                        <span className="font-mono font-semibold">{r.id}</span>
                        <span className="text-muted-foreground truncate flex-1">{r.region}</span>
                        <span className="text-[11px] font-medium text-warning">
                          {r.positivity}% pos
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div ref={alertsRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setAlertsOpen((o) => !o);
            setUnreadAlerts(false);
          }}
          aria-label="View surveillance alerts"
          className="relative size-9 grid place-items-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bell className="size-4" />
          {unreadAlerts && alerts.length > 0 && (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-alert ring-2 ring-card" />
          )}
        </button>

        {alertsOpen && (
          <div className="absolute right-0 mt-1.5 w-80 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-lg shadow-xl p-3 z-50">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
              <span className="text-[12px] font-semibold">Surveillance Alerts</span>
              <span className="text-[11px] text-muted-foreground">{alerts.length} active</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alerts.slice(0, 6).map((a) => (
                <div key={a.id} className="p-2 rounded-md bg-muted/50 text-[12px]">
                  <div className="font-medium leading-snug">{a.title}</div>
                  <div className="text-[10.5px] text-muted-foreground mt-0.5 flex items-center justify-between">
                    <span>{a.region}</span>
                    <span>{a.ts}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {user ? (
        <div ref={userRef} className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-md hover:bg-muted transition-colors"
          >
            <div className="size-7 rounded-full bg-gradient-to-br from-primary to-teal text-white text-[11px] font-bold grid place-items-center">
              {initials}
            </div>
            <div className="hidden sm:block text-left leading-tight max-w-[160px] truncate">
              <div className="text-[12px] font-semibold truncate">{user.email}</div>
              <div className="text-[10px] text-muted-foreground capitalize">
                {isAdmin ? "Admin" : (roles[0] ?? "viewer")}
              </div>
            </div>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-md shadow-lg p-1 z-50">
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  setUserMenuOpen(false);
                  navigate({ to: "/login" });
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded text-[13px] hover:bg-muted text-left"
              >
                <LogOut className="size-3.5" /> Sign out
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
        >
          <LogIn className="size-3.5" /> Sign in
        </Link>
      )}
    </header>
  );
}
