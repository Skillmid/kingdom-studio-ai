# Kingdom Studio AI — Build Status

Last updated: 2026-09-27

This file is the persistent engineering status for autonomous sessions. Treat the repository as the source of truth.

## Current milestone

Render / Export v1 is complete as a generic post-production module. It assembles a sequence from persisted shots first, then leftover storyboard panels, then image/video assets. Media URLs are copied only from an existing asset `fileUrl` or panel `imageUrl`. Export writes a delivery manifest / EDL / preview package record and never invents a package file URL.

Missing Assets and Director persistence files required by feature indexes and production pages were restored so those workspaces compile and can plan from production records.

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
| AI Director | Present | Planner, restored repository and workspace |
| Assets / generation jobs | Present | Planner, job machine, repository, migration and workspace restored |
| Render / export | Complete | Sequence planner, persistence, workspace, tests, verified |

## Render / Export v1 invariants

- Sequences belong to a production.
- Clips are derived from shots first, then leftover storyboard panels, then image/video assets.
- A media URL is attached only from an existing asset `fileUrl` or panel `imageUrl`.
- Missing media is recorded as uncertainty. No file or package URL is invented.
- Filmmaker-approved clips are not duplicated on later assemble runs.
- Completion is `readyItemCount / itemCount`.
- Export writes a JSON delivery manifest / EDL / preview package record.
- RLS restricts render, clip and export access to the production owner.

## Verification (2026-09-27)

Executed after Render / Export v1:

- `npm test` — 43 passed, 0 failed
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

Apply these migrations to the live Supabase project before using persistence:

- `supabase/migrations/202609260001_create_shots_table.sql`
- `supabase/migrations/202609260002_create_storyboard_panels_table.sql`
- `supabase/migrations/202609260003_create_director_notes_table.sql`
- `supabase/migrations/202609270001_create_assets_and_generation_jobs.sql`
- `supabase/migrations/202609270002_create_render_and_export_tables.sql`

## Next executable dependency

Provider-backed image/video generation against the existing generation job state machine, still without inventing media URLs when a provider is unconfigured.
