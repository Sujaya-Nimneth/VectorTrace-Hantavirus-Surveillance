import { Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@astryxdesign/core/AppShell";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

const UNCHROMED_ROUTES = new Set(["/", "/login"]);

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (UNCHROMED_ROUTES.has(pathname)) {
    return <Outlet />;
  }

  return (
    <AppShell
      variant="wash"
      height="fill"
      contentPadding={0}
      topNav={<TopBar />}
      sideNav={<Sidebar />}
    >
      <Outlet />
    </AppShell>
  );
}
