import { createFileRoute, useNavigate, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Activity, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Sign in · VectorTrace" }] }),
});

function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const { redirect: redirectTo } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/";

  useEffect(() => {
    if (user) {
      if (safeRedirect === "/") navigate({ to: "/dashboard" });
      else router.history.push(safeRedirect);
    }
  }, [user, navigate, router, safeRedirect]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created! Check your email if confirmation is required.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Authentication failed";
      setErr(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="w-full max-w-md">
        <Link to="/dashboard" className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="size-10 rounded-md bg-teal/15 border border-teal/40 grid place-items-center">
            <Activity className="size-5 text-teal" />
          </div>
          <div>
            <div className="font-bold tracking-tight text-[16px] leading-none">VectorTrace</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
              Hanta Surveillance
            </div>
          </div>
        </Link>

        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h1 className="text-lg font-bold tracking-tight">
            {mode === "signin" ? "Sign in to console" : "Request access"}
          </h1>
          <p className="text-[12.5px] text-muted-foreground mt-1">
            Authorized epidemiologists & administrators only.
          </p>

          <form onSubmit={submit} className="mt-5 space-y-3">
            <div>
              <label htmlFor="login-email" className="block text-[12px] font-semibold mb-1.5">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-[12px] font-semibold mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 px-3 pr-10 rounded-md border border-input bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 size-7 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {err && (
              <div className="text-[12px] text-alert bg-alert/10 border border-alert/30 rounded-md px-3 py-2">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground text-[13px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === "signin" ? "signup" : "signin"));
              setErr(null);
            }}
            className="mt-4 w-full text-[12px] text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "No account? Request access" : "Already registered? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
