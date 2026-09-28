# Kingdom Studio AI — Build Status

Last updated: 2026-09-28

This file is the persistent engineering status for autonomous sessions. Treat the repository as the source of truth.

## Current milestone

Assets plan/approve/edit/delete/queue workspace is landed on main.

Landed on main in this session:

- `use-assets` hook with production-derived planning, approval, compact updates and persisted dispatch results
- Assets workspace UI: plan from production, approve, edit, delete, queue one asset, queue missing jobs
- Asset and generation-job repositories now write through compact mappers and support `createMany` for jobs
- Generation dispatch results persist job status/output/error without inventing a media URL
- Provider constructors no longer use TypeScript parameter properties, so `npm test` can load Kling/OpenAI adapters

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
| AI Director | Partial | Planner and tests exist; production page is still a thin notes view |
| Assets / jobs | Complete | Planner, job machine, mappers, hook, plan/approve/queue workspace |
| Image/video generation | Present | Kling + OpenAI + unconfigured fallback |
| Render / export | Partial | Planner and persistence exist; production page is still a thin view |

## Verification

Executed 2026-09-28 against this workspace after the Assets workspace landing:

- `npm test` — 42 passed, 0 failed
- `npm run lint` — 0 errors, 1 pre-existing unused-arg warning in `unconfigured.provider.ts`
- `npx tsc --noEmit` — passed
- `npm run build` — passed (Next.js 16.2.9)

`package.json` still lists three test files that are not on main (`director-note.mapper.test.ts`, `render-planner.test.ts`, `render.mapper.test.ts`). Node skipped the missing paths; the 42 passing tests are the files that exist.

Apply migrations before using persistence:

- `supabase/migrations/202609260001_create_shots_table.sql`
- `supabase/migrations/202609260002_create_storyboard_panels_table.sql`
- `supabase/migrations/202609260003_create_director_notes_table.sql`
- `supabase/migrations/202609270001_create_assets_and_generation_jobs.sql`
- `supabase/migrations/202609270002_create_render_and_export_tables.sql`

## Next executable dependency

1. Replace the thin Render/Export workspace with the assemble/approve/export flow already implemented in planners.
2. Restore missing render planner/mapper tests referenced by `package.json`.
3. Replace the thin AI Director production view with the plan/approve notes flow already implemented in planners and tests.
