# Kingdom Studio AI — Build Status

Last updated: 2026-09-27

This file is the persistent engineering status for autonomous sessions. Treat the repository as the source of truth.

## Current milestone

Provider-backed image/video generation v1 is on main against the existing generation job state machine.

- Image jobs resolve to OpenAI Images when `OPENAI_API_KEY` is set, otherwise Kling if configured.
- Video jobs resolve to Kling when `KLING_API_KEY` or `KLING_ACCESS_KEY` + `KLING_SECRET_KEY` are set.
- An unconfigured provider fails the job recoverably and never invents a media or package URL.
- A completed provider response without a URL is treated as failure.
- Server route: `POST /api/generation/run`.

Assets, Render/Export and AI Director files required by feature indexes were restored so production pages resolve. Some workspace UIs are still thin and need the richer plan/approve flows from earlier modules.

## Pipeline

| Stage | Status | Notes |
| --- | --- | --- |
| Shot List | Complete | Planner, persistence, UI, tests |
| Storyboard | Complete | Shot-derived panels |
| AI Director | Partial | Planner exists; workspace restored thinly |
| Assets / jobs | Partial | Planner, job machine, repository, generate action |
| Image/video generation | Present | Kling + OpenAI + unconfigured fallback |
| Render / export | Partial | Planner and types present; persistence mapping still coarse |

## Verification

Not fully executed in the last session. The sandbox wiped the working tree during `npm install` and the npm registry returned HTTP 502. Do not treat lint/tsc/build as green until they are re-run locally.

Apply migrations before using persistence:

- `supabase/migrations/202609260001_create_shots_table.sql`
- `supabase/migrations/202609260002_create_storyboard_panels_table.sql`
- `supabase/migrations/202609260003_create_director_notes_table.sql`
- `supabase/migrations/202609270001_create_assets_and_generation_jobs.sql` (add if missing locally)
- `supabase/migrations/202609270002_create_render_and_export_tables.sql` (add if missing locally)

## Next executable dependency

1. Re-run `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
2. Add the assets/render SQL migrations if they are still absent from `supabase/migrations`.
3. Replace thin Render/Director workspaces with the full plan/approve flows.
4. Voice/audio generation behind the same job machine once image/video is verified with credentials.
