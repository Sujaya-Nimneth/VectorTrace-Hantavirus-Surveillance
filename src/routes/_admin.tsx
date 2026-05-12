import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ShieldOff, LogIn, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";

export const Route = createFileRoute("/_admin")({
  component: AdminGate,
});

function AdminGate() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoles();

  if (authLoading || (user && rolesLoading)) {
    return (
      <div className="h-full grid place-items-center text-muted-foreground text-[13px]">
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
          <p className="text-[12.5px] text-muted-foreground mt-1.5">The infrastructure console is restricted to admin users.</p>
          <Link to="/login"
            className="mt-5 inline-flex items-center gap-1.5 px-4 h-10 rounded-md text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
            <LogIn className="size-4" /> Sign in
          </Link>
        </div>
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
            Your account ({user.email}) doesn't hold the <span className="font-mono text-foreground">admin</span> role required to view system infrastructure.
          </p>
          <Link to="/" className="mt-5 inline-flex items-center gap-1.5 px-4 h-10 rounded-md text-[13px] font-semibold border border-input hover:bg-muted">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
