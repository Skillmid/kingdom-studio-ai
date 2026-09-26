# Kingdom Studio AI — Build Status

Last updated: 2026-09-26

This file is the persistent engineering status for autonomous sessions. Treat the repository as the source of truth.

## Current milestone

Storyboard v1 is complete as a generic production module. It consumes persisted Shot, Scene, Character and Location records, proposes visual panels without inventing plot, persists panels with RLS, preserves filmmaker-approved panels on later planning runs, and exposes a production workspace. Image generation is deferred to generation jobs.

Shot List v1 remains complete.

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
| AI Director | UI shell only | Next pipeline dependency after this milestone |
| Assets / generation jobs | Stub pages | Not implemented |
| Render / export | Stub pages | Not implemented |

## Shot List v1 invariants

- Shots belong to a production and may link to a scene, location, and characters.
- Scene-derived proposals use scene heading, action, dialogue cues, and source text only.
- Scene headings are not treated as speakers.
- Unsupported camera or story facts are not invented from a named test screenplay.
- User-created or user-approved shots are not overwritten by Plan from Scenes.
- Completion percentage is calculated from persisted shot fields.
- RLS restricts shot access to the production owner.

## Storyboard v1 invariants

- Panels belong to a production and may link to a shot, scene, location, and characters.
- Plan from Shots copies shot visual fields and attaches persisted scene, character, and location continuity when those records exist.
- Unsupported visual facts are not invented when downstream records are sparse.
- A shot already represented by a panel is not duplicated.
- User-created or user-approved panels are preserved.
- Completion is calculated from persisted panel fields.
- RLS restricts panel access to the production owner.
- No still is fabricated. `image_url` is optional until generation jobs exist.

## Shot List files

- `supabase/migrations/202609260001_create_shots_table.sql`
- `src/features/shots/types/shot.ts`
- `src/features/shots/validation/shot.schema.ts`
- `src/features/shots/services/shot-completion.ts`
- `src/features/shots/services/shot-planner.ts`
- `src/features/shots/repositories/shot.repository.ts`
- `src/features/shots/hooks/use-shots.ts`
- `src/features/shots/components/ShotListView.tsx`
- `src/features/shots/components/ShotFormDialog.tsx`
- `src/features/shots/components/ShotCard.tsx`
- `src/features/shots/components/ShotList.tsx`
- `src/features/shots/components/DeleteShotDialog.tsx`
- `src/app/studio/productions/[id]/shot-list/page.tsx`

## Storyboard files

- `supabase/migrations/202609260002_create_storyboard_panels_table.sql`
- `src/features/storyboard/types/storyboard-panel.ts`
- `src/features/storyboard/validation/storyboard-panel.schema.ts`
- `src/features/storyboard/services/storyboard-completion.ts`
- `src/features/storyboard/services/storyboard-planner.ts`
- `src/features/storyboard/repositories/storyboard.repository.ts`
- `src/features/storyboard/hooks/use-storyboard.ts`
- `src/features/storyboard/components/StoryboardView.tsx`
- `src/features/storyboard/components/PanelFormDialog.tsx`
- `src/features/storyboard/components/PanelCard.tsx`
- `src/features/storyboard/components/PanelList.tsx`
- `src/features/storyboard/components/DeletePanelDialog.tsx`
- `src/app/studio/productions/[id]/storyboard/page.tsx`

## Verification (2026-09-26)

Executed in this session:

- `npm test` — passed (14 tests: shot list + storyboard)
- `npm run lint` — passed
- `npx tsc --noEmit` — passed
- `npm run build` — passed

Apply these migrations to the live Supabase project before using persistence:

- `supabase/migrations/202609260001_create_shots_table.sql`
- `supabase/migrations/202609260002_create_storyboard_panels_table.sql`

## Next executable dependency

AI Director: production intelligence that consumes approved scenes, shots and storyboard panels for blocking, camera, lighting and continuity proposals. Assets / generation jobs follow so stills can attach to panels.
