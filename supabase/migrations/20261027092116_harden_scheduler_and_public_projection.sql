-- Rotate scheduler credentials out of public.infra_config and restore the
-- anonymous surveillance projection without exposing clinical base-table data.
--
-- The cron token is stored in Supabase Vault. Only a SHA-256 digest is kept in
-- public.infra_config for verification by a service-role-only RPC.

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if not exists (
    select 1
    from vault.secrets
    where name = 'scheduler_token'
  ) then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'scheduler_token',
      'Bearer token used by pg_cron to invoke scheduled Edge Functions'
    );
  end if;
end;
$$;

insert into public.infra_config (key, value)
select
  'scheduler_token_hash',
  encode(extensions.digest(decrypted_secret, 'sha256'), 'hex')
from vault.decrypted_secrets
where name = 'scheduler_token'
on conflict (key) do update
set value = excluded.value;

create or replace function public.verify_function_token(presented_token text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    nullif(btrim(presented_token), '') is not null
    and exists (
      select 1
      from public.infra_config
      where key = 'scheduler_token_hash'
        and value = encode(extensions.digest(btrim(presented_token), 'sha256'), 'hex')
    )
$$;

revoke execute on function public.verify_function_token(text)
  from public, anon, authenticated;
grant execute on function public.verify_function_token(text) to service_role;

delete from public.infra_config
where key in ('ingest_token', 'healthcheck_token');

-- The view is an owner-run, non-clinical projection. Base-table SELECT stays
-- authenticated-only; anonymous callers can read only this column subset.
alter view public.hanta_cases_public set (security_invoker = false);
revoke all on public.hanta_cases_public from public, anon, authenticated;
grant select on public.hanta_cases_public to anon, authenticated;

revoke all on public.hanta_cases from anon;
revoke all on public.hanta_alerts from anon;
revoke all on public.rodent_sites from anon;
grant select on public.hanta_alerts to anon;
grant select on public.rodent_sites to anon;

-- Recreate the scheduled jobs with Vault-backed credentials. Keeping the
-- invocation SQL in one helper avoids duplicating secret access in cron.job.
create or replace function public.invoke_scheduled_function(function_slug text)
returns bigint
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  base_url text;
  token text;
  request_id bigint;
begin
  if function_slug not in (
    'ingest-don-feed',
    'infra-health-check',
    'geocode-case-locations'
  ) then
    raise exception 'unsupported function slug: %', function_slug;
  end if;

  select value into base_url
  from public.infra_config
  where key = 'supabase_functions_base_url';

  select decrypted_secret into token
  from vault.decrypted_secrets
  where name = 'scheduler_token'
  limit 1;

  if base_url is null or token is null then
    return null;
  end if;

  select net.http_post(
    url := rtrim(base_url, '/') || '/' || function_slug,
    headers := jsonb_build_object('Authorization', 'Bearer ' || token)
  )
  into request_id;

  return request_id;
end;
$$;

revoke execute on function public.invoke_scheduled_function(text)
  from public, anon, authenticated;

select cron.unschedule(jobname)
from cron.job
where jobname in ('ingest_don_twice_daily', 'infra_health_check');

select cron.schedule(
  'ingest_don_twice_daily',
  '0 2,14 * * *',
  $$select public.invoke_scheduled_function('ingest-don-feed')$$
);

select cron.schedule(
  'infra_health_check',
  '*/5 * * * *',
  $$select public.invoke_scheduled_function('infra-health-check')$$
);
