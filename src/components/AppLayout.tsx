import { Outlet, useRouterState } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isMap = path === "/map";
  return (
    <div className="h-screen flex bg-background text-foreground font-sans antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className={isMap ? "flex-1 min-h-0" : "flex-1 min-h-0 overflow-auto"}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
