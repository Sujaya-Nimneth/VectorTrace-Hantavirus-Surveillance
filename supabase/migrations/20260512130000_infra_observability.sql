-- Infrastructure observability tables + helpers

create type public.infra_status as enum ('ok', 'warn', 'down');
create type public.ingest_status as enum ('success', 'failed');

create table public.infra_ingest_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  status public.ingest_status not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_ingested int,
  error_message text
);

create table public.infra_api_uptime (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  status public.infra_status not null,
  latency_ms int,
  checked_at timestamptz not null default now(),
  error_message text
);

create table public.infra_db_metrics (
  id uuid primary key default gen_random_uuid(),
  latency_ms int not null,
  pool_used int not null,
  pool_max int not null,
  checked_at timestamptz not null default now(),
  source text not null default 'simulated'
);

create index idx_infra_ingest_runs_started_at on public.infra_ingest_runs(started_at desc);
create index idx_infra_api_uptime_checked_at on public.infra_api_uptime(checked_at desc);
create index idx_infra_api_uptime_service on public.infra_api_uptime(service);
create index idx_infra_db_metrics_checked_at on public.infra_db_metrics(checked_at desc);

alter table public.infra_ingest_runs enable row level security;
alter table public.infra_api_uptime enable row level security;
alter table public.infra_db_metrics enable row level security;

create policy "Admins can view ingest runs"
  on public.infra_ingest_runs for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can view api uptime"
  on public.infra_api_uptime for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can view db metrics"
  on public.infra_db_metrics for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create or replace function public.get_db_pool_health()
returns table(active_connections int, max_connections int)
language sql
security definer
set search_path = public
as $$
  select
    count(*)::int as active_connections,
    (select setting::int from pg_settings where name = 'max_connections') as max_connections
  from pg_stat_activity
  where state is distinct from 'idle';
$$;

revoke execute on function public.get_db_pool_health() from public, anon, authenticated;
