# Kingdom Studio AI — Build Status

Last updated: 2026-09-28

This file is the persistent engineering status for autonomous sessions. Treat the repository as the source of truth.

## Current milestone

Assets plan/approve/queue workspace is wired to persisted production records.

- Production Assets page plans character, location, shot, panel and director-note references from existing domain records.
- Approved and filmmaker-owned assets are preserved on later planning runs.
- Missing generation jobs can be queued and dispatched through `POST /api/generation/run`.
- File URLs are copied only when a configured provider returns one. Unconfigured providers fail recoverably.
- Asset and generation-job persistence omits undefined columns on partial updates.

Provider-backed image/video generation v1 remains on main:

- Image jobs resolve to OpenAI Images when `OPENAI_API_KEY` is set, otherwise Kling if configured.
- Video jobs resolve to Kling when `KLING_API_KEY` or `KLING_ACCESS_KEY` + `KLING_SECRET_KEY` are set.
- An unconfigured provider fails the job recoverably and never invents a media URL.
- Server route: `POST /api/generation/run`.

## Pipeline

| Stage | Status | Notes |
| --- | --- | --- |
| Shot List | Complete | Planner, persistence, UI, tests |
| Storyboard | Complete | Shot-derived panels |
| AI Director | Present | Planner, persistence; production page is still a thin notes view |
| Assets / jobs | Present | Planner, job machine, repositories, plan/approve/queue workspace |
| Image/video generation | Present | Kling + OpenAI + unconfigured fallback |
| Render / export | Present | Planner and persistence exist; production page is still a thin view |

## Verification

Executed 2026-09-28 in this session after the Assets workspace:

- `npm test` — 45 passed, 0 failed
- `npm run lint` — 0 errors, 1 pre-existing unused-arg warning in `unconfigured.provider.ts`
- `npx tsc --noEmit` — passed
- `npm run build` — passed (Next.js 16.2.9)

Apply migrations before using persistence:

- `supabase/migrations/202609260001_create_shots_table.sql`
- `supabase/migrations/202609260002_create_storyboard_panels_table.sql`
- `supabase/migrations/202609260003_create_director_notes_table.sql`
- `supabase/migrations/202609270001_create_assets_and_generation_jobs.sql`
- `supabase/migrations/202609270002_create_render_and_export_tables.sql`

## Next executable dependency

1. Replace the thin Render/Export workspace with the assemble/approve/export flow already implemented in planners and tests.
2. Replace the thin AI Director production view with the plan/approve notes flow already implemented in planners and tests.
3. Voice/audio generation behind the same job machine once image/video is verified with credentials.
