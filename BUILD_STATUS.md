# Kingdom Studio AI — Build Status

Last updated: 2026-09-27

This file is the persistent engineering status for autonomous sessions. Treat the repository as the source of truth.

## Current milestone

Assets v1 is complete as a generic production module. It consumes persisted Character, Location, Shot and Storyboard Panel records, proposes reusable assets without inventing media URLs, persists assets and generation jobs with RLS, preserves filmmaker-approved assets on later planning runs, and exposes a production workspace.

AI Director v1, Storyboard v1 and Shot List v1 remain complete. Director persistence and workspace files that were previously imported but missing have been restored so the production pages compile.

## Pipeline

| Stage | Status | Notes |
| --- | --- | --- |
| Authentication / productions | Present | Existing studio app and Supabase ownership model |
| Screenplay import / versioning | Present | Script workspace and screenplay tables |
| Canonical / scene extraction | Present | Import-engine extractors and Scene Planner sync |
| Story Bible | Present | Screenplay-driven proposals exist in feature module |
| Characters | Present | Dynamic extraction and editor |
| Locations | Present | Location Bible + screenplay sync |
| Scenes | Present | Production scene records with source text |
| Shot List | Complete | Domain, planner, persistence, UI, tests, verified |
| Storyboard | Complete | Shot-derived panels enriched from scene/character/location records |
| AI Director | Complete | Scene-derived direction notes enriched from shots and storyboard panels |
| Assets / generation jobs | Complete | Production-derived assets plus observable job lifecycle |
| Render / export | Stub pages | Next pipeline dependency after this milestone |

## Assets v1 invariants

- Assets belong to a production and may link to a scene, shot, panel, character, location, or director note.
- Plan from Production creates character-reference, location-reference and image assets only from persisted records.
- Unsupported visual facts stay in `uncertaintyNotes`. No file URL is invented.
- A source entity already represented by the same kind is not duplicated.
- User-created or user-approved assets are preserved.
- Completion is calculated from persisted asset fields.
- Generation jobs use queued → running → completed | failed | cancelled, with retry from failed or cancelled.
- An unconfigured provider fails recoverably and does not invent media.
- RLS restricts asset and job access to the production owner.

## AI Director v1 invariants

- Notes belong to a production and may link to a scene, shot, panel, location, and characters.
- Plan from Production copies scene intent, action, emotion, sound and continuity, then attaches shot camera coverage and storyboard composition when those records exist.
- Unsupported direction is recorded as uncertainty instead of being invented.
- A scene already represented by a note is not duplicated.
- User-created or user-approved notes are preserved.
- Completion is calculated from persisted direction fields.
- RLS restricts note access to the production owner.

## Assets files

- `supabase/migrations/202609270001_create_assets_and_generation_jobs.sql`
- `src/features/assets/types/asset.ts`
- `src/features/assets/types/generation-job.ts`
- `src/features/assets/validation/asset.schema.ts`
- `src/features/assets/validation/generation-job.schema.ts`
- `src/features/assets/services/asset-planner.ts`
- `src/features/assets/services/asset-completion.ts`
- `src/features/assets/services/generation-job.ts`
- `src/features/assets/repositories/asset.repository.ts`
- `src/features/assets/repositories/generation-job.repository.ts`
- `src/features/assets/hooks/use-assets.ts`
- `src/features/assets/components/AssetsView.tsx`
- `src/features/assets/components/AssetFormDialog.tsx`
- `src/features/assets/components/AssetCard.tsx`
- `src/features/assets/components/AssetList.tsx`
- `src/features/assets/components/DeleteAssetDialog.tsx`
- `src/app/studio/productions/[id]/assets/page.tsx`

## Verification (2026-09-27)

Executed in this session after Assets v1:

- `npm test` — 38 passed, 0 failed
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

Apply these migrations to the live Supabase project before using persistence:

- `supabase/migrations/202609260001_create_shots_table.sql`
- `supabase/migrations/202609260002_create_storyboard_panels_table.sql`
- `supabase/migrations/202609260003_create_director_notes_table.sql`
- `supabase/migrations/202609270001_create_assets_and_generation_jobs.sql`

## Next executable dependency

Render / export: assemble generated assets into a renderable sequence and export package without depending on a single screenplay.
