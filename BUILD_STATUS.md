# Kingdom Studio AI — Build Status

Last updated: 2026-09-26

This file is the persistent engineering status for autonomous sessions. Treat the repository as the source of truth.

## Current milestone

AI Director v1 is complete as a generic production module. It consumes persisted Scene, Shot, Storyboard Panel, Character and Location records, proposes direction notes without inventing plot, persists notes with RLS, preserves filmmaker-approved notes on later planning runs, and exposes a production workspace.

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
| AI Director | Complete | Scene-derived direction notes enriched from shots and storyboard panels |
| Assets / generation jobs | Stub pages | Next pipeline dependency after this milestone |
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

## AI Director v1 invariants

- Notes belong to a production and may link to a scene, shot, panel, location, and characters.
- Plan from Production copies scene intent, action, emotion, sound and continuity, then attaches shot camera coverage and storyboard composition when those records exist.
- Unsupported direction is recorded as uncertainty instead of being invented.
- A scene already represented by a note is not duplicated.
- User-created or user-approved notes are preserved.
- Completion is calculated from persisted direction fields.
- RLS restricts note access to the production owner.
- No generated media is attached. Assets and generation jobs remain the next dependency.

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

## AI Director files

- `supabase/migrations/202609260003_create_director_notes_table.sql`
- `src/features/ai-director/types/director-note.ts`
- `src/features/ai-director/validation/director-note.schema.ts`
- `src/features/ai-director/services/director-completion.ts`
- `src/features/ai-director/services/director-planner.ts`
- `src/features/ai-director/repositories/director-note.repository.ts`
- `src/features/ai-director/hooks/use-director-notes.ts`
- `src/features/ai-director/components/DirectorNotesView.tsx`
- `src/features/ai-director/components/DirectorNoteFormDialog.tsx`
- `src/features/ai-director/components/DirectorNoteCard.tsx`
- `src/features/ai-director/components/DirectorNoteList.tsx`
- `src/features/ai-director/components/DeleteDirectorNoteDialog.tsx`
- `src/app/studio/productions/[id]/ai-director/page.tsx`

## Verification (2026-09-26)

Executed in this session after AI Director v1:

- `npm test`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

Apply these migrations to the live Supabase project before using persistence:

- `supabase/migrations/202609260001_create_shots_table.sql`
- `supabase/migrations/202609260002_create_storyboard_panels_table.sql`
- `supabase/migrations/202609260003_create_director_notes_table.sql`

## Next executable dependency

Assets / generation jobs: reusable production assets and observable generation jobs so storyboard stills and later video/audio outputs can attach to domain entities.
