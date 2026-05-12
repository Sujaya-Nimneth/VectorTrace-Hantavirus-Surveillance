import { useRouterState } from "@tanstack/react-router";
import { Bell, Search, ChevronDown, ChevronRight } from "lucide-react";

const labels: Record<string, string> = {
  "/": "Executive Dashboard",
  "/map": "Geospatial Tracker",
  "/intake": "Rapid Case Intake",
  "/admin": "System Infrastructure",
};

export function TopBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const label = labels[path] ?? "VectorTrace";

  return (
    <header className="h-14 shrink-0 bg-card border-b border-border flex items-center px-6 gap-4">
      <nav className="flex items-center text-[12px] text-muted-foreground gap-1.5">
        <span>VectorTrace</span>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium">{label}</span>
      </nav>

      <div className="flex-1 max-w-md mx-auto relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <input
          placeholder="Search cases, regions, vectors…"
          className="w-full h-9 pl-9 pr-3 rounded-md bg-muted/60 border border-transparent focus:bg-card focus:border-ring focus:outline-none text-[13px] placeholder:text-muted-foreground"
        />
      </div>

      <button className="relative size-9 grid place-items-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
        <Bell className="size-4" />
        <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-alert ring-2 ring-card" />
      </button>

      <button className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-md hover:bg-muted transition-colors">
        <div className="size-7 rounded-full bg-gradient-to-br from-primary to-teal text-white text-[11px] font-bold grid place-items-center">
          DR
        </div>
        <div className="text-left leading-tight">
          <div className="text-[12px] font-semibold">Dr. Reyes</div>
          <div className="text-[10px] text-muted-foreground">Epidemiologist</div>
        </div>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </button>
    </header>
  );
}
