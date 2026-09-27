# Kingdom Studio AI — Build Status

Last updated: 2026-09-27

This file is the persistent engineering status for autonomous sessions. Treat the repository as the source of truth.

## Current milestone

Render / Export v1 is complete as a generic post-production module. It assembles a sequence from persisted shots first, then leftover storyboard panels, then image/video assets. Media URLs are copied only from an existing asset `fileUrl` or panel `imageUrl`. Export writes a delivery manifest / EDL / preview package record and never invents a package file URL.

Missing Assets and Director persistence files required by feature indexes were restored so production pages compile.

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
| AI Director | Present | Planner complete; persistence repository restored; workspace is still a thin shell |
| Assets / generation jobs | Present | Planner, job machine, repository and migration restored; workspace is still a thin shell |
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

- `npm test` — 47 passed, 0 failed
- `npm run lint` — passed
- `npx tsc --noEmit` — passed
- `npm run build` — compiled successfully

Apply these migrations to the live Supabase project before using persistence:

- `supabase/migrations/202609260001_create_shots_table.sql`
- `supabase/migrations/202609260002_create_storyboard_panels_table.sql`
- `supabase/migrations/202609260003_create_director_notes_table.sql`
- `supabase/migrations/202609270001_create_assets_and_generation_jobs.sql`
- `supabase/migrations/202609270002_create_renders_and_exports.sql`

## Next executable dependency

Provider-backed media generation that writes real file URLs into assets so Render sequences can become ready without invented media. After that, replace the thin Assets and AI Director workspace shells with the full plan/edit/queue flows already used by Shot List.
