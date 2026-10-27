# Security Policy

## Supported versions

The `main` branch receives security fixes.

## Reporting a vulnerability

Please report suspected vulnerabilities privately via
[GitHub security advisories](https://github.com/Sujaya-Nimneth/VectorTrace-Hantavirus-Surveillance/security/advisories/new)
rather than opening a public issue. Include reproduction steps and, where
possible, a suggested fix. You should hear back within a few days.

## Scope notes for this project

- **Row Level Security is the real enforcement layer.** Client-side route
  gates are UX only; `hanta_cases` clinical columns are readable by
  authenticated users only, and writes require epidemiologist/admin roles.
- **Edge functions fail closed.** The pg_cron token is generated directly in
  Supabase Vault; only its SHA-256 digest is stored in `infra_config`.
  Functions verify callers through the service-role-only
  `verify_function_token` RPC. No bearer token is committed or sent to the
  browser.
- **Clinical data minimization:** anonymous visitors see only the
  `hanta_cases_public` projection (no symptoms, exposure, age, or sex).
- **Location data:** `(0,0)` is rejected as a map sentinel. Existing rows are
  repaired through the authenticated `geocode-case-locations` maintenance
  function. Aggregate rows such as "Global" remain intentionally unlocated;
  all coordinate constraints are validated.

## Historical exposure

An early commit pushed a `.env` containing Supabase credentials. The file's
history has since been scrubbed from this repository with `git filter-repo`,
but the values must still be treated as compromised: clones, forks, and
GitHub's commit caches made before the scrub may retain the old blobs.
**Rotate the Supabase publishable key and the legacy service-role/JWT signing
key in the Supabase dashboard regardless.** The old scheduler token has been
retired; pg_cron now uses a separate Vault secret. `.env` is gitignored and
`.env.example` contains placeholders only.
