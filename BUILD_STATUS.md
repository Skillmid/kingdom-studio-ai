# Kingdom Studio AI — Build Status

Last updated: 2026-09-28

This file records verified repository status. The repository remains the source of truth.

## Current milestone

Character AI profile proposals are integrated selectively on `codex/character-ai-profile-sync-integration`, based on `origin/main`. The newer screenplay, Story Bible, production pipeline, and downstream feature architecture remain in place.

- Character profile proposals are grounded in verbatim screenplay evidence and tied to a saved screenplay revision.
- Proposals are reviewed field by field in the character editor. Only selected fields enter the unsaved form; persistence happens through the existing Save action.
- Existing creator values remain untouched unless the creator selects a replacement. Creator edits after acceptance are recorded in per-field provenance.
- Character completion is calculated from supported profile fields rather than fixed percentages.
- Bulk screenplay synchronization only adds missing characters; it does not replace existing profiles.
- AI generation requires an authenticated user and verifies production ownership when a production ID is provided.
- The migration `202609280001_add_character_profile_provenance.sql` adds the JSON provenance column and object constraint. The migration is present in the repository but has not been applied to a database in this session.

## Pipeline

| Stage | Status | Notes |
| --- | --- | --- |
| Screenplay import and intelligence | Present | Current import engine, knowledge extraction service, and ScriptPipelineService retained |
| Story Bible | Present | Current production architecture retained |
| Characters | Integrated | Field-grounded AI proposals, creator review, persistence provenance, dynamic completion |
| Locations | Present | Existing production workspace retained |
| Scenes | Present | Existing production workspace retained |
| Shot List | Complete | Planner, persistence, UI, tests |
| Storyboard | Complete | Shot-derived panels |
| AI Director | Partial | Planner and tests exist; production page remains a thin notes view |
| Assets / generation jobs | Partial | Hook and supporting UI exist; production Assets workspace remains thin |
| Image/video generation | Present | Kling, OpenAI, and unconfigured fallback providers |
| Render / export | Partial | Planner and persistence exist; production page remains a thin view |

## Verification

Executed on 2026-09-28 against this working tree:

- `npm test` — 47 passed, 0 failed
- `npm run lint` — 0 errors; one existing unused-parameter warning in `src/platform/generation/providers/unconfigured.provider.ts`
- `npx tsc --noEmit` — passed
- `npm run build` — passed with Next.js 16.2.9
- `git diff --check` — passed

The test, compiler, and build commands needed process permissions in this environment. The first build attempt also exposed one stale generated `.next/dev/types/validator.ts` route reference; removing that generated file allowed the clean build to pass.

## Migration state

The new character provenance migration has been inspected against `CharacterRepository` and the character data model. The code reads and writes `profile_provenance`, matching the added JSONB column. Database application state could not be verified from repository files; apply the migration before deploying this integration to a database.

Existing pipeline migrations in this tree include:

- `202609260001_create_shots_table.sql`
- `202609260002_create_storyboard_panels_table.sql`
- `202609260003_create_director_notes_table.sql`
- `202609270001_create_assets_and_generation_jobs.sql`
- `202609270002_create_render_and_export_tables.sql`
- `202609280001_add_character_profile_provenance.sql`

## Next executable dependency

1. Finish the production Assets workspace by wiring the existing plan/review/edit/queue hook and components into `AssetsView` and `AssetFormDialog`.
2. Replace the thin Render/Export workspace with the existing assemble/approve/export flow.
3. Replace the thin AI Director production view with the existing plan/approve notes flow.
