# Kingdom Studio AI — Build Status

Last updated: 2026-09-28

This file is the persistent engineering status for autonomous sessions. Treat the repository as the source of truth.

## Current milestone

Assets planning, job lifecycle and persistence mappers are on main. The production Assets page is still the thin generate list; the plan/approve/queue workspace is implemented in the working tree and needs the remaining UI/hook/repository files landed.

Landed on main in this session:

- Generic asset planner and generation-job tests that avoid THE MESSAGE entities
- Asset/job database mappers that omit undefined columns on partial updates
- Changelog 0.7.0

Still required to finish the Assets workspace:

- `use-assets` hook
- Plan/approve/edit/delete/queue Assets UI
- Repository `createMany`/compact-update wiring for generation jobs
- Persist dispatch results from the production page

Provider-backed image/video generation v1 remains on main:

- Image jobs resolve to OpenAI Images when `OPENAI_API_KEY` is set, otherwise Kling if configured.
- Video jobs resolve to Kling when `KLING_API_KEY` or `KLING_ACCESS_KEY` + `KLING_SECRET_KEY` are set.
- An unconfigured provider fails the job recoverably and never invents a media URL.
- Server route: `POST /api/generation/run`.

## Pipeline

| Stage | Status | Notes |
| --- | --- | --- |
| Shot List | Complete | Planner, persistence, UI, tests |
| Storyboard | Complete | Shot-derived panels |
| AI Director | Present | Planner, persistence; production page is still a thin notes view |
| Assets / jobs | Partial | Planner, job machine, mapper tests; workspace UI not fully on main |
| Image/video generation | Present | Kling + OpenAI + unconfigured fallback |
| Render / export | Present | Planner and persistence exist; production page is still a thin view |

## Verification

Executed 2026-09-28 against the complete local workspace before the GitHub file split:

- `npm test` — 45 passed, 0 failed
- `npm run lint` — 0 errors, 1 pre-existing unused-arg warning in `unconfigured.provider.ts`
- `npx tsc --noEmit` — passed
- `npm run build` — passed (Next.js 16.2.9)

Those commands have not been re-run against the partial GitHub-only tree after the push split.

Apply migrations before using persistence:

- `supabase/migrations/202609260001_create_shots_table.sql`
- `supabase/migrations/202609260002_create_storyboard_panels_table.sql`
- `supabase/migrations/202609260003_create_director_notes_table.sql`
- `supabase/migrations/202609270001_create_assets_and_generation_jobs.sql`
- `supabase/migrations/202609270002_create_render_and_export_tables.sql`

## Next executable dependency

1. Land the Assets plan/approve/queue hook and workspace UI on main.
2. Replace the thin Render/Export workspace with the assemble/approve/export flow already implemented in planners and tests.
3. Replace the thin AI Director production view with the plan/approve notes flow already implemented in planners and tests.
