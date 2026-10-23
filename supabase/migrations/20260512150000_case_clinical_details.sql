-- Store the clinical presentation and exposure details collected during case
-- intake. Previously the intake form collected symptoms and exposure notes but
-- the insert payload dropped them because no columns existed to hold them.

alter table public.hanta_cases
  add column if not exists symptoms text[] not null default '{}',
  add column if not exists exposure text;
