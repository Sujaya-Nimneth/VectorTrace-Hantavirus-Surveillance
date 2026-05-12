-- Infra scheduler config + cron jobs

create table public.infra_config (
  key text primary key,
  value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_infra_config()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger infra_config_updated_at
before update on public.infra_config
for each row execute function public.touch_infra_config();

alter table public.infra_config enable row level security;

create policy "Admins manage infra config"
  on public.infra_config for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.get_infra_config(_key text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select value from public.infra_config where key = _key limit 1
$$;

revoke execute on function public.get_infra_config(text) from public, anon, authenticated;

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'ingest_don_twice_daily',
  '0 2,14 * * *',
  $$
  select case
    when public.get_infra_config('supabase_functions_base_url') is null then null
    else net.http_post(
      url := public.get_infra_config('supabase_functions_base_url') || '/ingest-don-feed',
      headers := case
        when public.get_infra_config('ingest_token') is null then '{}'::jsonb
        else jsonb_build_object('Authorization', 'Bearer ' || public.get_infra_config('ingest_token'))
      end
    )
  end;
  $$
);

select cron.schedule(
  'infra_health_check',
  '*/5 * * * *',
  $$
  select case
    when public.get_infra_config('supabase_functions_base_url') is null then null
    else net.http_post(
      url := public.get_infra_config('supabase_functions_base_url') || '/infra-health-check',
      headers := case
        when public.get_infra_config('healthcheck_token') is null then '{}'::jsonb
        else jsonb_build_object('Authorization', 'Bearer ' || public.get_infra_config('healthcheck_token'))
      end
    )
  end;
  $$
);
