# Kingdom Studio AI — Build Status

Last updated: 2026-10-08

This file is the persistent engineering status for autonomous sessions. Treat the repository as the source of truth.

## Current milestone

Character extraction integrity is fixed on top of the partial Assets workspace landing.

Known false characters (`The Last Light`, `He Types`, `Inside Is A Hard Drive Labelled`) came from all-caps lines being accepted as character cues without dialogue evidence or element classification. The deterministic extractor in `src/features/import-engine/extractors/character.extractor.ts` now classifies screenplay lines and requires a name-shaped cue followed by dialogue. Canonical AI screenplay analysis is not present in this tree; this extractor remains the sync source used by the Characters workspace.

Previously synced false characters are not deleted automatically. The creator removes them. New syncs should not recreate them.

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

Executed 2026-10-08 for the extraction fix:

- Character extraction and shot-planner tests passed on Node 22 (strip-types loader)
- Full `npm test` still cannot complete in this environment: schema tests need installed dependencies, and `dispatch.test.ts` hits a pre-existing parameter-property strip-types failure

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
