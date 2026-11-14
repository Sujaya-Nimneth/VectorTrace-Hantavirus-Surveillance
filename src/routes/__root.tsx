import type { ComponentProps } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Link as TanStackLink,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { Theme } from "@astryxdesign/core/theme";
import { LinkProvider } from "@astryxdesign/core/Link";
import { Center } from "@astryxdesign/core/Center";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Button } from "@astryxdesign/core/Button";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { themes, defaultThemeSlug } from "../astryx-themes";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";

function RouterLinkAdapter({ href, children, ...rest }: ComponentProps<"a"> & { href?: string }) {
  if (!href) {
    return <a {...rest}>{children}</a>;
  }
  if (/^(https?:|mailto:|tel:)/i.test(href)) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <TanStackLink to={href} {...(rest as Record<string, unknown>)}>
      {children}
    </TanStackLink>
  );
}

function NotFoundComponent() {
  return (
    <Center minHeight="100vh" padding={6}>
      <EmptyState
        headingLevel={1}
        title="404 — Page not found"
        description="The surveillance view you requested does not exist or has been relocated."
        actions={<Button label="Return home" variant="primary" href="/" />}
      />
    </Center>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  return (
    <Center minHeight="100vh" padding={6}>
      <EmptyState
        headingLevel={1}
        title="This view failed to load"
        description="An unexpected error interrupted rendering. Retry the route or return to the overview."
        actions={
          <>
            <Button
              label="Try again"
              variant="primary"
              onClick={() => {
                router.invalidate();
                reset();
              }}
            />
            <Button label="Go home" variant="secondary" href="/" />
          </>
        }
      />
    </Center>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VectorTrace · Multi-Disease Surveillance & Outbreak Predictor" },
      {
        name: "description",
        content:
          "Real-time multi-pathogen epidemiological tracking, sentinel surveillance, and bio-financial outbreak nowcasting.",
      },
      { name: "author", content: "VectorTrace" },
      {
        property: "og:title",
        content: "VectorTrace · Multi-Disease Surveillance & Outbreak Predictor",
      },
      {
        property: "og:description",
        content:
          "Real-time multi-pathogen epidemiological tracking, sentinel surveillance, and bio-financial outbreak nowcasting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@VectorTrace" },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          // Apply the persisted/system theme before first paint to avoid a flash.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("vectortrace-theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}if(t==="dark"){document.documentElement.classList.add("dark")}document.documentElement.style.colorScheme=t}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <Theme theme={themes[defaultThemeSlug]} mode={theme}>
          <LinkProvider
            component={RouterLinkAdapter as ComponentProps<typeof LinkProvider>["component"]}
          >
            {children}
          </LinkProvider>
        </Theme>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppLayout />
        <Toaster position="bottom-right" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  );
}
