# VectorTrace - Hantavirus Surveillance

VectorTrace is a real-time epidemiological dashboard for hantavirus surveillance. It combines a command-center UI, geospatial tracking, and rapid case intake with a Supabase-backed data layer and role-based access control. The app also includes an admin-only infrastructure console that surfaces system health signals for the ingestion pipeline.

## Key features

- Executive dashboard with live metrics, epidemic curve, alerts, and risk ranking.
- Geospatial map view for field intelligence and hotspot tracking.
- Rapid case intake workflow for clinician submissions (symptoms + exposure notes persisted).
- Admin-only infrastructure console for health and observability signals.
- Supabase Auth + RLS with explicit roles (admin, epidemiologist, viewer).
- Public read access to surveillance data with authenticated writes.
- Demo mode: with `VITE_DEMO_MODE=true` (or when Supabase credentials are unset) the app serves a bundled mock dataset and shows a "Demo data" badge, so the UI renders without a backend.

## App routes

- `/` Executive Dashboard
- `/map` Geospatial Tracker
- `/intake` Rapid Case Intake (authenticated)
- `/admin` System Infrastructure (admin-only)
- `/login` Sign in / signup

## Data model and security

Supabase provides the primary data store with RLS enabled on all surveillance tables. Policies allow public read access while restricting writes to authenticated clinician roles.

Roles are managed through the `user_roles` table and enforced via RLS policies and UI gates:

- `admin` can manage roles and access the infrastructure console.
- `epidemiologist` can insert and update clinical data.
- `viewer` has read-only access.

The first user to sign up is auto-granted `admin`; subsequent users receive `viewer` by default.

## Ingestion pipeline

A Supabase Edge Function (`ingest-don-feed`) pulls WHO Disease Outbreak News using Firecrawl and writes normalized rows into `hanta_cases` and `hanta_alerts`. The function is intended to be scheduled via `pg_cron`.

Each ingest run is logged in `infra_ingest_runs` with success/failure status, runtime, and record counts. These logs back the admin infrastructure console.

## Infrastructure health + observability

The admin console reads live metrics from three observability tables:

- `infra_ingest_runs` for cron success rate and last successful run.
- `infra_api_uptime` for external API status checks (`Firecrawl`, `WHO Disease Outbreak News`, `Supabase REST`).
- `infra_db_metrics` for database latency and connection pool health snapshots.

The `infra-health-check` Edge Function can be scheduled to refresh uptime and database metrics continuously.

Cron schedules (configured via migration):

- `ingest_don_twice_daily` at 02:00 and 14:00 UTC.
- `infra_health_check` every 5 minutes.

## Environment variables

Create a `.env` file in the project root. Client-side values must be prefixed with `VITE_`.

Required variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `FIRECRAWL_API_KEY` (edge function only, set via `supabase secrets set`)
- `INGEST_TOKEN` (required on edge functions — they fail closed without it)
- `VITE_DEMO_MODE` (optional, `true` forces the bundled demo dataset)
- `INGEST_URL` (Docker scheduler: Supabase edge function URL)
- `HEALTHCHECK_URL` (Docker scheduler: infra health-check URL)
- `INGEST_INTERVAL_SECONDS` (optional, default 43200)
- `HEALTHCHECK_INTERVAL_SECONDS` (optional, default 300)

Never commit secrets. Use your deployment platform's secret manager for production values.

## Local development

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm run typecheck
npm test
```

## Docker (IaC)

Build and run the web app with Docker Compose:

```bash
docker compose up --build
```

Services:

- `web`: Vite + TanStack Start app (served via Nginx).
- `nginx`: reverse proxy (gzip, asset caching, security headers).

The `scraper` scheduler is opt-in via a compose profile — pg_cron (configured by the migrations) is the default scheduler, and running both would duplicate ingest runs and metric rows:

```bash
docker compose --profile scheduler up
```

Set these in your `.env` for the scraper:

- `INGEST_URL` = `https://<SUPABASE_PROJECT>.supabase.co/functions/v1/ingest-don-feed`
- `HEALTHCHECK_URL` = `https://<SUPABASE_PROJECT>.supabase.co/functions/v1/infra-health-check`
- `INGEST_TOKEN` matching the edge function secret.

Build and preview:

```bash
npm run build
npm run preview
```

## Supabase setup

1. Create a Supabase project.
2. Apply the SQL migrations in `supabase/migrations`.
3. Configure the Edge Function in `supabase/functions/ingest-don-feed`.
4. Deploy the `infra-health-check` Edge Function.
5. Add the required secrets in Supabase (and local `.env` for dev).
6. Set scheduler config values:
   ```sql
   insert into public.infra_config (key, value)
   values
   	 ('supabase_functions_base_url', 'https://<PROJECT_REF>.supabase.co/functions/v1'),
   	 ('ingest_token', '<YOUR_TOKEN>'),
   	 ('healthcheck_token', '<YOUR_TOKEN>')
   on conflict (key) do update set value = excluded.value;
   ```

## Tech stack

- React + TanStack Router + TanStack Start
- Vite + Tailwind CSS
- Supabase Auth, RLS, and Edge Functions
- Recharts and Leaflet for visualizations

## CI/CD

GitHub Actions runs lint, typecheck, tests, and a build on every pull request, and deploys to **Cloudflare Workers** on every push to `main` (`npx wrangler deploy` using the worker config emitted by `@cloudflare/vite-plugin` into `dist/server`).

Configure the following repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Set the worker's server-side secrets with `npx wrangler secret put <NAME>` if you use them (e.g. `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`).

## Roadmap

- Add long-term SLA reporting and alerting for ingest failures.
- Expand API uptime checks with provider-specific health endpoints.
- Automate scheduled invocations via Supabase cron tasks.
