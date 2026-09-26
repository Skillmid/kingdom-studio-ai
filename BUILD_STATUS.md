# Kingdom Studio AI — Build Status

Last updated: 2026-09-26

This file is the persistent engineering status for autonomous sessions. Treat the repository as the source of truth.

## Current milestone

AI Director v1 is complete as a generic production module. It consumes persisted Scene, Shot, Storyboard Panel, Character and Location records, proposes scene-level directing notes without inventing plot, persists notes with RLS, preserves filmmaker-approved notes on later planning runs, and exposes a production workspace.

Storyboard v1 and Shot List v1 remain complete.

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
| AI Director | Complete | Scene-level notes from scenes, shots and storyboard panels |
| Assets / generation jobs | Stub pages | Next pipeline dependency after this milestone |
| Render / export | Stub pages | Not implemented |

## AI Director v1 invariants

- Notes belong to a production and may link to a scene, shot, location, and characters.
- Plan from Production creates one note per scene and enriches it only from persisted scene, shot, panel, character and location fields.
- Lighting is limited to recorded time of day plus explicit light language in scene text.
- Camera, composition and pacing stay empty when no shots exist.
- Emotional progression is copied from the scene emotional beat and is not invented.
- A scene already represented by a note is not duplicated.
- User-created or user-approved notes are preserved.
- Completion is calculated from persisted director-note fields.
- RLS restricts note access to the production owner.

## Verification (2026-09-26)

Executed after AI Director v1:

- `npm test` — 21 passed
- `npm run lint` — passed
- `npx tsc --noEmit` — passed
- `npm run build` — passed

Apply these migrations to the live Supabase project before using persistence:

- `supabase/migrations/202609260001_create_shots_table.sql`
- `supabase/migrations/202609260002_create_storyboard_panels_table.sql`
- `supabase/migrations/202609260003_create_director_notes_table.sql`

## Next executable dependency

Assets / generation jobs: reusable production assets and observable generation jobs so storyboard stills and later video/audio can attach to domain entities.
