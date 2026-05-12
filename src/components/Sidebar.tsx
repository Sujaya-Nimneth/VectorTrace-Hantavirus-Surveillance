import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Map, ClipboardPlus, ServerCog, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Executive Dashboard", icon: LayoutDashboard },
  { to: "/map", label: "Geospatial Map", icon: Map },
  { to: "/intake", label: "Case Intake", icon: ClipboardPlus },
  { to: "/admin", label: "System Infrastructure", icon: ServerCog },
];

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="w-60 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-sidebar-border">
        <div className="size-9 rounded-md bg-teal/20 border border-teal/40 grid place-items-center">
          <Activity className="size-4.5 text-teal" />
        </div>
        <div>
          <div className="font-bold tracking-tight text-white text-[15px] leading-none">VectorTrace</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60 mt-1">Hanta Surveillance</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((n) => {
          const active = path === n.to;
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
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
        <div className="flex items-center gap-1.5 text-success font-semibold mb-1">
          <span className="size-1.5 rounded-full bg-success animate-pulse" /> Engine online
        </div>
        <div className="text-sidebar-foreground/60">Last sync 4m ago · 12 sources</div>
      </div>
    </aside>
  );
}
