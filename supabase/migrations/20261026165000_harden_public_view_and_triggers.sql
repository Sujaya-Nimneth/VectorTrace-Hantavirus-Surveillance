-- Keep the public projection RLS-aware. The view is intentionally owned by
-- postgres so anonymous callers can read only its non-clinical columns, while
-- security_invoker ensures base-table RLS is still evaluated for signed-in
-- readers.
alter view public.hanta_cases_public set (security_invoker = true);

-- Views are read-only API surfaces; grant only the operation they support.
revoke insert, update, delete, truncate, references, trigger
  on public.hanta_cases_public
  from anon, authenticated;

-- Trigger functions do not need to be callable through PostgREST.
alter function public.touch_infra_config() set search_path = public;
revoke execute on function public.touch_infra_config() from public, anon, authenticated;
