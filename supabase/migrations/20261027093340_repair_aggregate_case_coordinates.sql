-- Aggregate surveillance reports ("Global", "Multi-country", etc.) are not
-- map points. Represent them as intentionally unlocated rows while retaining
-- strict coordinate validation for country-level cases.

alter table public.hanta_cases
  alter column lat drop not null,
  alter column lng drop not null;

alter table public.hanta_cases
  drop constraint if exists cases_lat_range,
  drop constraint if exists cases_lng_range,
  drop constraint if exists cases_coordinates_pair,
  drop constraint if exists cases_plottable_coordinates;

alter table public.hanta_cases
  add constraint cases_lat_range check (lat is null or (lat between -90 and 90)),
  add constraint cases_lng_range check (lng is null or (lng between -180 and 180)),
  add constraint cases_coordinates_pair check (
    (lat is null and lng is null) or (lat is not null and lng is not null)
  ),
  add constraint cases_plottable_coordinates check (
    (lat is null and lng is null) or (lat <> 0 or lng <> 0)
  );

create or replace view public.hanta_cases_public
with (security_invoker = false) as
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

revoke all on public.hanta_cases_public from public, anon, authenticated;
grant select on public.hanta_cases_public to anon, authenticated;
