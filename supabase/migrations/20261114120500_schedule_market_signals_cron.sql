-- Allow invoke_scheduled_function to dispatch ingest-market-signals and
-- register its daily cron cadence after global market close.

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
    'ingest-market-signals',
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
where jobname = 'ingest_market_signals_daily';

select cron.schedule(
  'ingest_market_signals_daily',
  '30 21 * * *',
  $$select public.invoke_scheduled_function('ingest-market-signals')$$
);
