-- Restore EXECUTE permission on public.has_role for authenticated and service_role
-- Required because RLS policies on public tables invoke public.has_role(auth.uid(), ...)
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;
