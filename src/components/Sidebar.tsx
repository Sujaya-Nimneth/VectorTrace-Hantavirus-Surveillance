import { useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Map, ClipboardPlus, ServerCog, Activity, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCases, useRodents } from "@/hooks/use-surveillance";
import { isDemoMode } from "@/lib/demo-mode";

const nav = [
  { to: "/", label: "Executive Dashboard", icon: LayoutDashboard },
  { to: "/map", label: "Geospatial Tracker", icon: Map },
  { to: "/intake", label: "Case Intake", icon: ClipboardPlus },
  { to: "/admin", label: "System Infrastructure", icon: ServerCog },
];

export function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data: cases, loading: casesLoading } = useCases();
  const { data: rodents, loading: rodentsLoading } = useRodents();
  const demo = isDemoMode();

  // While the mobile drawer is open: Escape closes it and the page stops
  // scrolling behind the overlay.
  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const content = (
    <>
      <div className="px-5 py-5 flex items-center justify-between gap-2.5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-md bg-teal/20 border border-teal/40 grid place-items-center">
            <Activity className="size-4.5 text-teal" />
          </div>
          <div>
            <div className="font-bold tracking-tight text-white text-[15px] leading-none">
              VectorTrace
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60 mt-1">
              Hanta Surveillance
            </div>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="md:hidden p-1.5 rounded-md text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/50"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((n) => {
          const active = path === n.to;
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-white shadow-sm"
                  : "text-sidebar-foreground/75 hover:text-white hover:bg-sidebar-accent/50",
              )}
            >
              <Icon className="size-4" />
              {n.label}
              {active && <span className="ml-auto size-1.5 rounded-full bg-teal" />}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 p-3 rounded-md bg-sidebar-accent/40 border border-sidebar-border text-[11px] leading-snug">
        {demo ? (
          <div className="flex items-center gap-1.5 text-warning font-semibold mb-1">
            <span className="size-1.5 rounded-full bg-warning" /> Demo data
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-success font-semibold mb-1">
            <span className="size-1.5 rounded-full bg-success" /> Engine online
          </div>
        )}
        <div className="text-sidebar-foreground/60">
          {casesLoading || rodentsLoading
            ? "Loading surveillance totals…"
            : `${cases.length} cases · ${rodents.length} vector sites`}
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden md:flex w-60 shrink-0 bg-sidebar text-sidebar-foreground flex-col border-r border-sidebar-border">
        {content}
      </aside>
      {open && (
        <div className="fixed inset-0 z-[600] md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="relative z-10 w-64 max-w-[80vw] h-full bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border shadow-2xl"
          >
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
