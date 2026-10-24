-- Last-line-of-defense validation: the app and edge functions already check
-- these ranges, but the database should refuse out-of-domain values from any
-- other writer (service role, SQL editor, future integrations).

alter table public.hanta_cases
  add constraint cases_lat_range check (lat between -90 and 90),
  add constraint cases_lng_range check (lng between -180 and 180),
  add constraint cases_age_range check (age is null or (age >= 0 and age <= 120));

alter table public.rodent_sites
  add constraint rodents_positivity_range check (positivity between 0 and 100);

alter table public.infra_db_metrics
  add constraint db_metrics_latency_positive check (latency_ms > 0),
  add constraint db_metrics_pool_sane check (
    (pool_used is null and pool_max is null)
    or (
      pool_used is not null and pool_max is not null
      and pool_used >= 0 and pool_max > 0 and pool_used <= pool_max
    )
  );

-- Composite index serving the "latest check per service" lookup used by the
-- admin console (previously two single-column indexes were scanned).
create index idx_infra_api_uptime_service_checked_at
  on public.infra_api_uptime(service, checked_at desc);
