import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2, ShieldOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { requireAuth } from "@/lib/auth-gate";
import { QueryError } from "@/components/QueryError";
import { GateCard } from "@/components/GateCard";

// The console (recharts + panels) loads only after the role gate passes,
// keeping it out of every other route's bundle.
const AdminConsole = lazy(() => import("@/components/admin/AdminConsole"));

export const Route = createFileRoute("/admin")({
  component: AdminGate,
  beforeLoad: async ({ location }) => requireAuth(location.href),
  head: () => ({ meta: [{ title: "System Infrastructure · VectorTrace" }] }),
});

function AdminGate() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, error: rolesError, loading: rolesLoading } = useRoles();

  if (authLoading || (user && rolesLoading)) {
    return (
      <div className="h-full grid place-items-center text-muted-foreground p-12">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (!user) {
    return (
      <GateCard
        icon={ShieldOff}
        title="Authentication required"
        body="The infrastructure console is restricted to admin users."
        action={{ to: "/login", label: "Sign in", primary: true }}
      />
    );
  }
  if (rolesError) {
    return (
      <div className="p-12 max-w-md mx-auto">
        <QueryError what="your roles" error={rolesError} onRetry={() => window.location.reload()} />
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <GateCard
        icon={ShieldOff}
        title="Insufficient privileges"
        body={`Account ${user.email} doesn't hold the admin role required for this console.`}
        action={{ to: "/dashboard", label: "Back to dashboard" }}
      />
    );
  }
  return (
    <Suspense
      fallback={
        <div className="h-full grid place-items-center text-muted-foreground p-12">
          <Loader2 className="size-5 animate-spin" />
        </div>
      }
    >
      <AdminConsole />
    </Suspense>
  );
}
