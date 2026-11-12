import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ShieldAlert, UserCheck } from "lucide-react";
import { Center } from "@astryxdesign/core/Center";
import { Layout } from "@astryxdesign/core/Layout";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Spinner } from "@astryxdesign/core/Spinner";
import { VStack } from "@astryxdesign/core/VStack";

import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { requireAuth } from "@/lib/auth-gate";
import { QueryError } from "@/components/QueryError";
import { GateCard } from "@/components/GateCard";

const AdminConsole = lazy(() =>
  import("@/components/admin/AdminConsole").then((m) => ({ default: m.AdminConsole })),
);

export const Route = createFileRoute("/admin")({
  component: Admin,
  beforeLoad: async ({ location }) => requireAuth(location.href),
  head: () => ({ meta: [{ title: "System Infrastructure · VectorTrace" }] }),
});

function Admin() {
  const { user, loading } = useAuth();
  const { isAdmin, error: rolesError, loading: rolesLoading } = useRoles();

  if (loading || rolesLoading) {
    return (
      <Layout padding={6} contentWidth={1360} height="auto">
        <VStack gap={4}>
          <Skeleton width="35%" height={32} />
          <Skeleton width="100%" height={120} />
          <Skeleton width="100%" height={280} />
        </VStack>
      </Layout>
    );
  }

  if (!user) {
    return (
      <GateCard
        icon={UserCheck}
        title="Sign in required"
        body="Sign in with an administrator account to access infrastructure diagnostics."
        action={{ to: "/login", label: "Go to sign in", primary: true }}
      />
    );
  }

  if (rolesError) {
    return (
      <Layout padding={6} contentWidth={1360} height="auto">
        <QueryError what="your roles" error={rolesError} onRetry={() => window.location.reload()} />
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <GateCard
        icon={ShieldAlert}
        title="Administrator role required"
        body="This console is restricted to platform administrators."
        action={{ to: "/dashboard", label: "Back to dashboard" }}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <Center minHeight="60vh" padding={6}>
          <Spinner size="lg" label="Loading infrastructure console…" />
        </Center>
      }
    >
      <AdminConsole />
    </Suspense>
  );
}
