import { Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isMap = path === "/map";
  // Landing and login render standalone, outside the app shell.
  const bare = path === "/login" || path === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  // Close the mobile drawer on navigation by adjusting state during render
  // (guarded), instead of a cascading setState effect.
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) {
    setLastPath(path);
    setMobileOpen(false);
  }

  if (bare) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans antialiased">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background text-foreground font-sans antialiased overflow-hidden">
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onOpenMenu={() => setMobileOpen(true)} />
        <main className={isMap ? "flex-1 min-h-0" : "flex-1 min-h-0 overflow-auto"}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
