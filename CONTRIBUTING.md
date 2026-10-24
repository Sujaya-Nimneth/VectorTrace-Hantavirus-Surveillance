# Contributing to VectorTrace

Thanks for your interest in improving VectorTrace!

## Development setup

```bash
npm install
npm run dev
```

Create a `.env` from `.env.example`. With no Supabase credentials (or
`VITE_DEMO_MODE=true`) the app runs on its bundled demo dataset, so you can
develop UI features without a backend.

## Workflow

1. Fork / branch from `main`.
2. Make your change with tests where practical (`src/lib/**` logic is fully
   testable in node; see the existing `*.test.ts` files).
3. Run the quality gates — CI runs all of these on every PR:

   ```bash
   npm run lint
   npm run typecheck
   npm run test
   npm run build
   ```

4. Open a pull request with a short description of the problem and approach.

## Commit style

This repo uses [Conventional Commits](https://www.conventionalcommits.org/)
(`fix:`, `feat:`, `chore:`, `docs:`, `refactor:`, `perf:`, `ci:`, `build:`,
`test:`). Keep commits focused — one logical change per commit.

## Supabase changes

Database and edge-function changes go through `supabase/migrations/` and
`supabase/functions/`. New migrations must be additive and safe to apply to a
live project; never edit an already-applied migration.

## Reporting security issues

Please see [SECURITY.md](SECURITY.md) — do not open public issues for
suspected vulnerabilities.
