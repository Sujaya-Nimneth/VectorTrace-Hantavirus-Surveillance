import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Role = "admin" | "epidemiologist" | "viewer";

export function useRoles() {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setRoles([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    supabase.from("user_roles").select("role").eq("user_id", user.id)
      .then(({ data }) => {
        if (cancelled) return;
        setRoles((data ?? []).map(r => r.role as Role));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user, authLoading]);

  return {
    roles, loading,
    isAdmin: roles.includes("admin"),
    isClinician: roles.includes("admin") || roles.includes("epidemiologist"),
  };
}
