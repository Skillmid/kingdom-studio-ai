# Kingdom Studio AI — Build Status

Last updated: 2026-09-28

This file is the persistent engineering status for autonomous sessions. Treat the repository as the source of truth.

## Current milestone

Assets workspace is mid-landing on main. The hook and supporting card/list/delete UI are on main. The production Assets page still renders the older generate-only view because `AssetsView` and `AssetFormDialog` have not been pushed yet.

On main now:

- `use-assets` hook with production-derived planning, approval and persisted dispatch
- `jobPersistencePatch` so dispatch results can be written without inventing a media URL
- Asset card, list and delete dialog components
- Changelog 0.7.1 and environment helper `readGenerationEnvironment`

Still required to finish the Assets workspace on main:

- Replace `AssetsView` with the plan/approve/edit/queue workspace
- Add `AssetFormDialog`
- Point asset and generation-job repositories at compact mappers (`createMany` for jobs)
- Make Kling/OpenAI constructors strip-types compatible

## Pipeline

| Stage | Status | Notes |
| --- | --- | --- |
| Shot List | Complete | Planner, persistence, UI, tests |
| Storyboard | Complete | Shot-derived panels |
| AI Director | Partial | Planner and tests exist; production page is still a thin notes view |
| Assets / jobs | Partial | Hook and supporting UI landed; production page still thin |
| Image/video generation | Present | Kling + OpenAI + unconfigured fallback |
| Render / export | Partial | Planner and persistence exist; production page is still a thin view |

## Verification

Executed 2026-09-28 against the complete local Assets workspace before the GitHub file split:

- `npm test` — 42 passed, 0 failed
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

1. Land `AssetsView` and `AssetFormDialog`, then wire compact repository writes.
2. Replace the thin Render/Export workspace with the assemble/approve/export flow already implemented in planners.
3. Replace the thin AI Director production view with the plan/approve notes flow already implemented in planners and tests.
