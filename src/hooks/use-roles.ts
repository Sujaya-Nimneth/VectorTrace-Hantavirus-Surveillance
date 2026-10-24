import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type Role = "admin" | "epidemiologist" | "viewer";

export function useRoles() {
  const { user, loading: authLoading } = useAuth();

  const {
    data: roles = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user_roles", user?.id],
    enabled: !authLoading && !!user,
    queryFn: async (): Promise<Role[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (error) throw new Error(error.message);
      return data.map((r) => r.role);
    },
    staleTime: 5 * 60_000,
  });

  return {
    roles,
    error,
    loading: authLoading || (!!user && isLoading),
    isAdmin: !error && roles.includes("admin"),
    isClinician: !error && (roles.includes("admin") || roles.includes("epidemiologist")),
  };
}
