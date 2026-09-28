# Kingdom Studio AI - Build Status

Last updated: 2026-09-28

This file records repository findings verified during engineering work. Database migration application state is not available from the repository alone.

## Verified milestones

The dedicated branch `codex/character-ai-profile-sync-integration` was based on fetched `origin/main` commit `7151235` and contains verified Character AI profile proposal, Assets workspace, and Render/Export assembly milestones.

### Character AI profile proposals

- Character profile proposals are grounded in screenplay evidence and tied to a saved screenplay revision.
- Proposals are reviewed field by field in the character editor. Accepted values enter the unsaved form and persist through the existing Save action.
- Existing creator values remain untouched unless the creator selects a replacement. Creator edits after acceptance are recorded in per-field provenance.
- Character completion is calculated from supported profile fields rather than fixed percentages.
- Bulk screenplay synchronization only adds missing characters; it does not replace existing profiles.
- AI generation requires authentication and verifies production ownership when a production ID is provided.
- `202609280001_add_character_profile_provenance.sql` adds the JSON provenance column and object constraint. Its database application state is unverified.

### Assets workspace

- The production Assets route uses the existing `useAssets` planning, persistence, approval, and dispatch workflow.
- Creators can add, edit, approve, and delete assets; planner-created assets remain proposals until reviewed.
- Generation requires creator approval and a non-empty prompt. Bulk queueing considers approved assets only.
- Asset and generation-job repositories use compact write mappers so partial updates leave unrelated columns unchanged.
- Provider output is persisted only when a real output URL is returned; the UI does not fabricate media.

### Render and export assembly

- The Render workspace plans an ordered assembly from creator-approved shots, storyboard panels, and assets. Creators can review and remove proposed clips before saving.
- Saved sequences and clips are persisted separately with source references, evidence, provenance, and approval state.
- Export packages require an approved sequence and its matching loaded clip set. EDL and JSON manifests preserve missing-media entries; they do not encode or host video.
- `202609280003_create_render_and_export_tables.sql` matches the current repository mappers and types. Database application state is unverified.

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
| Assets / generation jobs | Integrated | Creator-review workspace connected to planning, persistence, and dispatch |
| Image/video generation | Present | Kling, OpenAI, and unconfigured fallback providers |
| Render / export | Partial | Creator-reviewed assembly and persisted EDL/JSON packages; no video encoder or hosted package storage |

## Verification

Executed on 2026-09-28 against the Render/Export working tree:

- `npm test` - 54 passed, 0 failed.
- `npm run lint` - 0 errors; one unused-parameter warning in `src/platform/generation/providers/unconfigured.provider.ts`.
- `npx tsc --noEmit` - passed.
- `npm run build` - passed with Next.js 16.2.9; Render and Export routes were included.
- `git diff --check` - passed on the current working tree after the status update.

## Migration inventory and status

The repository contains these production pipeline migrations:

- `20260627131515_create_productions.sql`
- `202607180001_create_characters_table.sql`
- `202607280001_create_screenplays.sql`
- `202609160001_create_scenes_table.sql`
- `202609210001_create_locations_table.sql`
- `202609220002_add_creator_foundation_to_story_bibles.sql`
- `202609220003_repair_studio_sync_schema.sql`
- `202609220004_enhance_scenes_for_production.sql`
- `202609260001_create_shots_table.sql`
- `202609260002_create_storyboard_panels_table.sql`
- `202609260003_create_director_notes_table.sql`
- `202609280001_add_character_profile_provenance.sql`
- `202609280002_create_assets_and_generation_jobs.sql`
- `202609280003_create_render_and_export_tables.sql`

The character, Assets, generation jobs, render sequences, render clips, and export packages migrations have been inspected against their application repositories, data types, and production ownership policies. No database connection or migration history was checked, so whether they have been applied is unverified.

## Next dependencies

1. Replace the thin AI Director production view with the existing plan/approve notes workflow.
2. Integrate a real video renderer and durable export-file storage when that infrastructure is available. Current outputs are accurate EDL/JSON manifests only.
