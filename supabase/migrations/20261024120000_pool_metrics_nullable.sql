-- Pool usage is only knowable via get_db_pool_health (pg_stat_activity).
-- When that RPC is unavailable the health check used to fabricate a pool
-- number derived from latency; allow NULL so the writer can record an
-- honestly-unknown pool instead, and the admin console can show "n/a".

alter table public.infra_db_metrics
  alter column pool_used drop not null,
  alter column pool_max drop not null;
