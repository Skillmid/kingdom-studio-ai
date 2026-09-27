# Kingdom Studio AI — Build Status

Last updated: 2026-09-27

This file is the persistent engineering status for autonomous sessions. Treat the repository as the source of truth.

## Current milestone

Render / Export v1 assembles a production sequence from persisted shots, storyboard panels and assets, then packages a delivery manifest. Media URLs are copied only when they already exist. No package file URL is invented.

Assets v1 persistence/UI and AI Director persistence/UI that previous status claimed were present but missing from the tree are being restored so production pages compile.

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
| AI Director | In progress | Planner complete; persistence/UI being restored |
| Assets / generation jobs | In progress | Planner and job machine complete; persistence/UI being restored |
| Render / export | In progress | Sequence planner and export manifest added this session |

## Render / Export v1 invariants

- Sequences belong to a production.
- Clips are derived from shots first, then storyboard panels, then image/video assets.
- A media URL is attached only from an existing asset `fileUrl` or panel `imageUrl`.
- Missing media is recorded as uncertainty. No file or package URL is invented.
- Filmmaker-approved clips are not duplicated on later assemble runs.
- Completion is `readyItemCount / itemCount`.
- Export writes a JSON delivery manifest / EDL / preview package record.
- RLS restricts render, clip and export access to the production owner.

## Verification (2026-09-27)

Executed in this session:

- Planner tests (shots, storyboard, director, assets, render) — 24 passed, 0 failed
- Generation job tests added; run with the planner suite when Node can load them
- `npm run lint`, `npx tsc --noEmit`, `npm run build` — not re-run in this session because `npm install` failed with a registry 502 and `node_modules` is absent

Apply these migrations to the live Supabase project before using persistence:

- `supabase/migrations/202609260001_create_shots_table.sql`
- `supabase/migrations/202609260002_create_storyboard_panels_table.sql`
- `supabase/migrations/202609260003_create_director_notes_table.sql`
- `supabase/migrations/202609270001_create_assets_and_generation_jobs.sql`
- `supabase/migrations/202609270002_create_renders_and_exports.sql`

## Next executable dependency

Finish remaining Assets/Director persistence files if any compile gaps remain, then add provider-backed media generation that writes real file URLs into assets so Render sequences can become ready without invented media.
