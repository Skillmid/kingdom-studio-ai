# Kingdom Studio AI

Kingdom Studio AI is a screenplay-led filmmaking workspace from Skillmid Creatives. It organizes a production's screenplay, story development, characters, locations, scenes, shots, storyboards, assets, generation jobs, and export planning under one production record.

## Current capability

The application includes production management; screenplay import, editing, analysis and revision history; screenplay-derived proposals for story data; production-scoped character and location workspaces; scene, shot and storyboard planning; AI Director notes; asset records and persisted generation jobs; and render/export planning.

AI-assisted screenplay and Story Bible work is proposal-based: creators review and approve changes. Generation providers require valid configuration and may incur charges when used. No provider keys are needed to run the local test suite.

Render/export currently prepares readiness information and a delivery manifest. This repository does not yet demonstrate encoded video output or hosted media delivery, so do not treat a manifest as a rendered film.

## Local setup

Requirements: Node.js and npm. Use the package lockfile for dependency installation.

```powershell
npm ci
Copy-Item .env.example .env.local
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` to a Supabase project configured for this application. Provider variables are optional and are listed in `.env.example`. Never commit `.env.local` or paste secret values into logs or documentation.

Start the app:

```powershell
npm run dev
```

Open `http://localhost:3000`. Studio routes require an authenticated Supabase session. Users can register at `/signup` and sign in at `/login`.

## Database

SQL migrations are stored in [`supabase/migrations`](supabase/migrations). They define the production-owned workflow schema and its row-level security policies. Review the database documentation in [`docs/05-DATABASE.md`](docs/05-DATABASE.md) before applying migrations.

The Story Bible migration (`202610090001_create_story_bibles.sql`) and production schema reconciliation (`202610090002_reconcile_productions.sql`) are prepared with static contract tests. Neither has been run against local Postgres or the hosted database. The linked hosted schema was not inspected during this repair. Review and validate the migration against the intended schema before applying it anywhere; do not use `supabase db push` against production without an approved rollout plan.

## Quality checks

```powershell
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

`npm test` runs the screenplay import tests and the main unit suite. Playwright end-to-end tests are under `e2e/`. Some flows require a reachable Supabase project and isolated test identities; record them as unverified when those dependencies are unavailable.

## Release status

This is an actively developed feature branch, not a production release. Before release, validate the Story Bible migration on clean and upgrade databases, verify owner and foreign-owner behavior with isolated accounts, complete persisted screenplay and asset browser flows, and implement or clearly scope actual media rendering and delivery.

See [`BUILD_STATUS.md`](BUILD_STATUS.md), [`docs/04-ROADMAP.md`](docs/04-ROADMAP.md), and [`docs/audits/KINGDOM_STUDIO_AI_FULL_AUDIT.md`](docs/audits/KINGDOM_STUDIO_AI_FULL_AUDIT.md) for current engineering evidence and known limits.
