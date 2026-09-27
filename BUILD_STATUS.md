# Kingdom Studio AI — Build Status

Last updated: 2026-09-28

This file is the persistent engineering status for autonomous sessions. Treat the repository as the source of truth.

## Current milestone

Render/Export and AI Director plan/approve workspaces are wired to persisted domain records.

- `assets`, `generation_jobs`, `render_sequences`, `render_clips` and `export_packages` migrations are in `supabase/migrations`.
- Render persistence maps snake_case rows to domain types. Partial updates no longer send undefined columns.
- Director note persistence now keeps scene, shot, panel, location and character links.
- Production Render/Export pages assemble from shots, leftover panels and image/video assets, approve/remove clips, and write delivery records without inventing a package URL.
- Production AI Director page plans grounded notes from scenes plus shot/panel/character/location intelligence and preserves approved notes.

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
| AI Director | Present | Planner, persistence, plan/approve workspace |
| Assets / jobs | Partial | Planner, job machine, repository, generate action; Assets UI still thin |
| Image/video generation | Present | Kling + OpenAI + unconfigured fallback |
| Render / export | Present | Planner, mapped persistence, assemble/approve/export workspace |

## Verification

Executed 2026-09-28 in this session:

- `npm test` — 39 passed, 0 failed
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

1. Replace the thin Assets workspace with the full plan/approve/queue flow used by Shots and Render.
2. Voice/audio generation behind the same job machine once image/video is verified with credentials.
3. Re-run `npm run lint`, `npx tsc --noEmit` and `npm run build` if they were blocked by registry/install issues.
