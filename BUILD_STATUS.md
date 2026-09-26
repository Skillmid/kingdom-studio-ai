# Kingdom Studio AI — Build Status

Last updated: 2026-09-26

This file is the persistent engineering status for autonomous sessions. Treat the repository as the source of truth.

## Current milestone

Shot List v1 is complete as a generic production module. It consumes Scene Planner records, proposes grounded camera coverage, persists shots with RLS, preserves filmmaker-approved shots on later planning runs, and exposes a production workspace.

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
| Storyboard | Stub page only | Next pipeline dependency |
| AI Director | UI shell only | Not production intelligence yet |
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

## Verification (2026-09-26)

Executed in this session:

- `npm test` — passed (7 tests)
- `npm run lint` — passed
- `npx tsc --noEmit` — passed
- `npm run build` — passed

Apply `supabase/migrations/202609260001_create_shots_table.sql` to the live Supabase project before using shot persistence.

## Next executable dependency

Storyboard: persist panels that consume shot, scene, character, and location intelligence so visual continuity can be planned before generation.
