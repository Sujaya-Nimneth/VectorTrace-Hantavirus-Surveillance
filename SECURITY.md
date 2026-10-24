# Security Policy

## Supported versions

The `main` branch receives security fixes.

## Reporting a vulnerability

Please report suspected vulnerabilities privately via
[GitHub security advisories](https://github.com/Sujaya-Nimneth/hanta-watch-central/security/advisories/new)
rather than opening a public issue. Include reproduction steps and, where
possible, a suggested fix. You should hear back within a few days.

## Scope notes for this project

- **Row Level Security is the real enforcement layer.** Client-side route
  gates are UX only; `hanta_cases` clinical columns are readable by
  authenticated users only, and writes require epidemiologist/admin roles.
- **Edge functions fail closed** without the `INGEST_TOKEN` secret and compare
  bearer tokens in constant time.
- **Clinical data minimization:** anonymous visitors see only the
  `hanta_cases_public` projection (no symptoms, exposure, age, or sex).

## Historical exposure

An early commit pushed a `.env` containing Supabase credentials. Those values
must be considered compromised and rotated in the Supabase dashboard
(publishable key + `INGEST_TOKEN`); the file was removed from the tree and
`.env` is gitignored. If you cloned before rotation, do not reuse those keys.
