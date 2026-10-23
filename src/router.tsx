import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function createAppRouter() {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
}

// Reuse one router (and QueryClient) per browser session so realtime channels
// and query caches don't accumulate; create a fresh router per SSR request.
let browserRouter: ReturnType<typeof createAppRouter> | undefined;

export const getRouter = () => {
  if (typeof window === "undefined") return createAppRouter();
  if (!browserRouter) browserRouter = createAppRouter();
  return browserRouter;
};
