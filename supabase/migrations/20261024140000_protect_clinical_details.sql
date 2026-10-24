-- Clinical details (age, sex, symptoms, exposure narrative) moved behind
-- authenticated read. They are quasi-PHI and don't belong in world-readable
-- storage. The public dashboard keeps working through hanta_cases_public,
-- a view over the non-clinical columns only.
--
-- Trade-off: realtime INSERT push for hanta_cases no longer reaches anon
-- sessions (realtime requires SELECT on the base table); unauthenticated
-- visitors fall back to query refetches, which is acceptable for a public
-- read-only view.

drop policy if exists "Public can view cases" on public.hanta_cases;

create policy "Authenticated can view cases"
  on public.hanta_cases for select
  to authenticated
  using (true);

-- Owned by postgres, so the view reads the base table without RLS while
-- exposing only surveillance-analytics columns.
create view public.hanta_cases_public as
  select
    id,
    case_id,
    region,
    lat,
    lng,
    reported_at,
    syndrome,
    status,
    created_at
  from public.hanta_cases;

grant select on public.hanta_cases_public to anon, authenticated;
