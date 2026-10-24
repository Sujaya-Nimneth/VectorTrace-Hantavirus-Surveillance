import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ClipboardCheck, ShieldOff, LogIn, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { supabase } from "@/integrations/supabase/client";
import { QueryError } from "@/components/QueryError";

// The console (recharts + panels) loads only after the role gate passes,
// keeping it out of every other route's bundle.
const AdminConsole = lazy(() => import("@/components/admin/AdminConsole"));

export const Route = createFileRoute("/admin")({
  component: AdminGate,
  // Client-side auth redirect; the admin role check stays in the component
  // (needs a user_roles query) and RLS guards the actual table reads.
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
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
      <div className="p-12 max-w-md mx-auto text-center">
        <div className="bg-card border border-border rounded-lg p-8">
          <ShieldOff className="size-10 mx-auto mb-3 text-alert" />
          <h2 className="font-bold text-[15px]">Authentication required</h2>
          <p className="text-[12.5px] text-muted-foreground mt-1.5">
            The infrastructure console is restricted to admin users.
          </p>
          <Link
            to="/login"
            className="mt-5 inline-flex items-center gap-1.5 px-4 h-10 rounded-md text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <LogIn className="size-4" /> Sign in
          </Link>
        </div>
      </div>
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
      <div className="p-12 max-w-md mx-auto text-center">
        <div className="bg-card border border-border rounded-lg p-8">
          <ShieldOff className="size-10 mx-auto mb-3 text-alert" />
          <h2 className="font-bold text-[15px]">Insufficient privileges</h2>
          <p className="text-[12.5px] text-muted-foreground mt-1.5">
            Account <span className="font-mono text-foreground">{user.email}</span> doesn&apos;t
            hold the admin role required for this console.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center gap-1.5 px-4 h-10 rounded-md text-[13px] font-semibold border border-input hover:bg-muted"
          >
            <ClipboardCheck className="size-4" /> Back to dashboard
          </Link>
        </div>
      </div>
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
