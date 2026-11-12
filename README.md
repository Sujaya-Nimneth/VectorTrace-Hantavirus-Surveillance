# VectorTrace — Hantavirus Surveillance Command Center

[![CI](https://github.com/Sujaya-Nimneth/VectorTrace-Hantavirus-Surveillance/actions/workflows/deploy.yml/badge.svg)](https://github.com/Sujaya-Nimneth/VectorTrace-Hantavirus-Surveillance/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-22+-339933?logo=node.js&logoColor=white)](.nvmrc)
<!-- Update the href with your workers.dev account subdomain after the first deploy -->

[![Live Demo](https://img.shields.io/badge/live-demo-ff5722?logo=cloudflareworkers&logoColor=white)](https://vectortrace-hantavirus-surveillance.sujayanimneth.workers.dev)

**VectorTrace** is a real-time epidemiological surveillance platform for hantavirus. It pairs a public overview with an operational surveillance workspace — analytics dashboard, geospatial risk map, 4-step rapid case intake, and an automated WHO Disease Outbreak News ingestion pipeline backed by Supabase (Postgres + RLS + Edge Functions) and Cloudflare Workers.

### Screenshots

|                      Public overview (dark)                       |                        Dashboard (dark)                        |
| :---------------------------------------------------------------: | :------------------------------------------------------------: |
| ![VectorTrace public overview](docs/screenshots/landing-dark.png) | ![Dashboard in dark mode](docs/screenshots/dashboard-dark.png) |

|                        Dashboard (light)                         |                    Geospatial tracker                    |
| :--------------------------------------------------------------: | :------------------------------------------------------: |
| ![Dashboard in light mode](docs/screenshots/dashboard-light.png) | ![Geospatial cluster map](docs/screenshots/map-dark.png) |

|                      Operator sign-in                       |
| :---------------------------------------------------------: |
| ![Operator authentication](docs/screenshots/login-dark.png) |

## Highlights

- **Public corridor snapshot** — `/` greets unauthenticated visitors with live regional corridor metrics (`Corridors` / `Recent cases` toggle) and direct entry points into surveillance workflows.
- **Surveillance dashboard** — `/dashboard` presents a 30-day KPI strip with prior-period deltas, multi-region linear epidemic curve (`7D` / `30D` / `90D`), severity-filtered alerts feed, and sortable/filterable regional incidence table (`per 100k`) with CSV export.
- **Geospatial proximity tracker** — `/map` renders a keyless Esri dark/light basemap with confirmed/suspected/pending case markers, _Sigmodontinae_ rodent reservoir sites, density heat overlay, docked region/layer controls, and an interactive slide-over drawer calculating `≤ 5 km` Haversine overlaps.
- **Global command palette & alerts** — `⌘K` / `Ctrl+K` quick jump across pages, corridors, cases, and trap sites from the top bar alongside a live alerts popover and persisted light/dark mode.
- **Rapid case intake** — `/intake` provides a 4-step clinician workflow (demographics → clinical onset → exposure context → review) with zod validation against controlled vocabularies, browser draft persistence, and optimistic query updates.
- **Role-based access** — Supabase Auth with `admin` / `epidemiologist` / `viewer` roles enforced by Postgres RLS (UI route guards are convenience; Postgres RLS is the enforcement layer).
- **Automated ingestion** — Supabase Edge Functions scrape WHO Disease Outbreak News via Firecrawl on a `pg_cron` schedule, normalize and deduplicate records, geocode country-level reports with Open-Meteo, update case statuses across runs, and raise confirmation alerts.
- **Admin observability console** — `/admin` tracks ingest health telemetry, external feed response latencies, database query latency against a `220ms` SLO threshold, and severity-filterable system feed logs (code-split out of the main bundle).
- **Demo mode** — Without backend credentials (or with `VITE_DEMO_MODE=true`), the app serves a deterministic bundled dataset across every view.

## Architecture

```
                ┌──────────────────────────────────────────────┐
                │                Cloudflare Workers            │
                │  TanStack Start (React 19, SSR) + Vite       │
                │  ├── /            Public overview & snapshot │
                │  ├── /dashboard   Surveillance KPIs & trends │
                │  ├── /map         Geospatial tracker (lazy)  │
                │  ├── /intake      Case intake (clinicians)   │
                │  ├── /login       Operator authentication    │
                │  └── /admin       Infra console (admin, lazy)│
                └───────────────┬──────────────────────────────┘
                                │ Supabase JS (public view / authed RLS)
                ┌───────────────▼──────────────────────────────┐
                │                  Supabase                    │
                │  Postgres + RLS ── hanta_cases (+ public      │
                │  projection), rodent_sites, hanta_alerts,    │
                │  user_roles, infra_* telemetry               │
                │  Realtime ── live INSERT push to the UI      │
                │                                              │
                │  Edge Functions (Deno)                       │
                │  ├── ingest-don-feed ── WHO DON via Firecrawl│
                │  ├── infra-health-check ── uptime + DB probe │
                │  └── geocode-case-locations ── map repair    │
                │        ▲ scheduled by pg_cron; Vault-backed   │
                │          bearer auth, fail-closed             │
                └──────────────────────────────────────────────┘
```

**Data minimization:** anonymous visitors read only the `hanta_cases_public` view — clinical columns (age, sex, symptoms, exposure narrative) are restricted to authenticated readers by RLS.

## Tech stack

| Layer         | Choices                                                                             |
| ------------- | ----------------------------------------------------------------------------------- |
| UI            | React 19, TypeScript, TanStack Start + Router, Tailwind CSS 4, lucide-react, sonner |
| Data          | TanStack Query v5, Supabase JS v2, Realtime channels, zod                           |
| Visualization | Recharts (epidemic curve, latency SLO), Leaflet + leaflet.heat (map)                |
| Backend       | Supabase Postgres with RLS, Edge Functions (Deno), pg_cron                          |
| Infra         | Cloudflare Workers (wrangler), Docker + Nginx (self-host parity), GitHub Actions    |

## Quick start

```bash
npm install
npm run dev
```

That's it — without credentials the app boots in demo mode with a bundled dataset.

To connect a backend, create a `.env` from [`.env.example`](.env.example):

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — client
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` — browser-safe Supabase client
- `FIRECRAWL_API_KEY` — Edge Function secret (`supabase secrets set`)
- `VITE_MAP_TILE_URL`, `VITE_MAP_TILE_ATTRIBUTION` — optional basemap provider override

### Quality gates

```bash
npm run lint          # eslint + prettier
npm run typecheck     # tsc --noEmit
npm run test          # vitest (unit)
npm run test:coverage # vitest + v8 coverage report
npm run build         # production build
```

## Supabase setup

The checked-in config targets project `wsgbrwmgiyecsbpvpfpd`. For a new or forked environment:

1. Authenticate and link the project:

   ```bash
   supabase login
   supabase link --project-ref <PROJECT_REF>
   ```

2. Apply the migrations in `supabase/migrations/` in order:

   ```bash
   supabase db push
   ```

3. Deploy the edge functions and set their secrets:

   ```bash
   supabase functions deploy ingest-don-feed
   supabase functions deploy infra-health-check
   supabase functions deploy geocode-case-locations
   supabase secrets set FIRECRAWL_API_KEY=<KEY>
   ```

4. Set the Functions base URL. The scheduler migration creates a random
   `scheduler_token` in Supabase Vault, stores only its SHA-256 digest in
   `infra_config`, and schedules both functions through a service-role-only
   helper:

   ```sql
   insert into public.infra_config (key, value)
   values ('supabase_functions_base_url', 'https://<PROJECT_REF>.supabase.co/functions/v1')
   on conflict (key) do update set value = excluded.value;
   ```

   Do not insert bearer tokens into `infra_config`. The Edge Functions fail
   closed and validate requests through the service-role-only
   `verify_function_token` RPC.

5. To repair legacy `0,0` coordinates, trigger the maintenance function from
   the SQL editor. The scheduler token is read directly from Vault and never
   printed or stored in repository files:

   ```sql
   select public.invoke_scheduled_function('geocode-case-locations');
   ```

Signups are disabled in the checked-in Auth config. Create users from the
Supabase dashboard; the first user is auto-granted `admin` and later users
default to `viewer`.

## Roles & security model

| Role               | Capabilities                                            |
| ------------------ | ------------------------------------------------------- |
| `admin`            | Everything + role management + infrastructure console   |
| `epidemiologist`   | Insert/update clinical cases and alerts                 |
| `viewer` (default) | Read surveillance data                                  |
| anonymous          | Public projection only (no clinical columns), no writes |

Security posture: RLS on every table with `WITH CHECK` clauses, check constraints on coordinates/age/positivity, Vault-backed scheduler credentials verified by a service-role-only RPC, query-cache wipe on sign-out, and CSP + HSTS security headers on Workers and Nginx. See [SECURITY.md](SECURITY.md).

## Docker (optional self-host parity)

```bash
docker compose up --build          # web + nginx
docker compose --profile scheduler up   # opt-in Docker scheduler (pg_cron is the default)
```

## CI/CD

GitHub Actions runs lint, typecheck, tests with coverage, and a build on every PR and push. **Cloudflare Workers Builds** owns production deployment from `main` with the deploy command `npx cf deploy`, so no Cloudflare credentials are stored in GitHub. Configure production environment variables in Cloudflare and optional build-time `VITE_*` values in GitHub.

## Roadmap

- Long-term SLA reporting and alerting for ingest failures
- Provider-specific health endpoints for uptime checks
- Marker clustering and seasonal-trend analytics on the map

## License

[MIT](LICENSE) © Sujaya Nimneth
