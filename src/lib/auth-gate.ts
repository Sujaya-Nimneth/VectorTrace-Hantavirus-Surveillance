import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isDemoMode } from "@/lib/demo-mode";

/**
 * Client-side auth redirect shared by gated routes. Role checks stay in the
 * route component (they need a user_roles query); RLS remains the real
 * enforcement on the database side.
 */
export async function requireAuth(locationHref: string) {
  if (typeof window === "undefined") return;
  if (isDemoMode()) {
    throw redirect({ to: "/login", search: { redirect: locationHref } });
  }
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    throw redirect({ to: "/login", search: { redirect: locationHref } });
  }
}
