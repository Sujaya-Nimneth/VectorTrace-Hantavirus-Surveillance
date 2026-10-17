import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Activity, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in · VectorTrace" }] }),
});

function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

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
        <Link to="/" className="flex items-center gap-2.5 mb-8 justify-center">
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
              <label className="block text-[12px] font-semibold mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
              />
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
