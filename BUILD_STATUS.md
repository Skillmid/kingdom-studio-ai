# Kingdom Studio AI - Build Status

Last updated: 2026-11-12

This file records repository findings verified during engineering work. Database migration application state is not available from the repository alone.

## Verified milestones

The dedicated branch `codex/character-ai-profile-sync-integration` was based on fetched `origin/main` commit `7151235` and contains verified Character AI profile proposal, Assets workspace, Render/Export assembly, AI Director note workflow, and revision-linked Script Intelligence milestones.

### Character AI profile proposals

- Character profile proposals are grounded in screenplay evidence and tied to a saved screenplay revision.
- Proposals are reviewed field by field in the character editor. Accepted values enter the unsaved form and persist through the existing Save action.
- Existing creator values remain untouched unless the creator selects a replacement. Creator edits after acceptance are recorded in per-field provenance.
- Character completion is calculated from supported profile fields rather than fixed percentages.
- Bulk screenplay synchronization only adds missing characters; it does not replace existing profiles.
- AI generation requires authentication, a valid `productionId` on every request, and verified production ownership before any provider call (see the stabilization pass below).
- `202609280001_add_character_profile_provenance.sql` adds the JSON provenance column and object constraint. Its database application state is unverified.

### Assets workspace

- The production Assets route uses the existing `useAssets` planning, persistence, approval, and dispatch workflow.
- Creators can add, edit, approve, and delete assets; planner-created assets remain proposals until reviewed.
- Generation requires creator approval and a non-empty prompt. Bulk queueing considers approved assets only.
- The generation dispatch API accepts only a persisted job ID, reloads the job under the authenticated user's RLS context, and requires a queued job linked to an approved asset in the same production. Client-supplied prompt/provider/output fields are no longer dispatch authority.
- Failed/cancelled asset jobs are re-queued conditionally before retry, capped at 3 attempts. Provider dispatch still requires a configured provider and persists only real provider output URLs.
- Asset and generation-job repositories use compact write mappers so partial updates leave unrelated columns unchanged.
- Provider output is persisted only when a real output URL is returned; the UI does not fabricate media.

### Render and export assembly

- The Render workspace plans an ordered assembly from creator-approved shots, storyboard panels, and assets. Creators can review and remove proposed clips before saving.
- Saved sequences and clips are persisted separately with source references, evidence, provenance, and approval state.
- Export packages require an approved sequence and its matching loaded clip set. EDL and JSON manifests preserve missing-media entries; they do not encode or host video.
- `202609280003_create_render_and_export_tables.sql` matches the current repository mappers and types. Database application state is unverified.

### AI Director production notes

- The production AI Director uses the existing grounded scene/shot/storyboard planner and loads saved direction notes from the production.
- New notes are proposals until the creator reviews, edits or rejects them. Saving an accepted note persists it with source evidence, provenance, completion, and explicit creator approval.
- Only creator-approved shots and storyboard panels enrich a new proposal. Existing notes are left intact, and generated note numbers follow the current production maximum.
- This production workflow is deterministic and evidence-based; the separate general AI Director tools page remains outside this integration.

### Script Intelligence persistence

- Comprehensive Script Intelligence results and focused reviews are immutable records tied to the exact saved screenplay and revision that were analysed.
- Analysis and focused review cannot run for an unsaved or changed draft. Loading a screenplay restores the latest full analysis and review history for its current revision; saving a new revision clears the prior results from the active view without deleting their historical records.
- Analysis remains advisory and does not modify screenplay content. The `202609280004_create_screenplay_analyses.sql` migration enforces production ownership and matching screenplay/revision/version relationships. Database application state is unverified.
- The `202609280005_create_screenplay_reviews.sql` migration persists focused reviews with their type and the same screenplay/revision/version provenance. Database application state is unverified.

### Revision-bound scene extraction

- Scene extraction is available only when the editor matches the exact current saved screenplay revision. A changed or unsaved draft cannot produce or accept scene proposals.
- Proposals carry screenplay ID, revision ID, and version through creator review. Accepted scenes persist those identifiers; scene validation and database foreign keys require the provenance fields together and tie them to the same screenplay and production.
- Manually created scenes remain valid without screenplay provenance. The `202609290001_add_scene_screenplay_provenance.sql` migration preserves exact revision relationships; database application state is unverified.

### Character extraction integrity (merged from `main` on 2026-10-08)

Known false characters (`The Last Light`, `He Types`, `Inside Is A Hard Drive Labelled`) came from all-caps lines being accepted as character cues without dialogue evidence or element classification. The deterministic extractor in `src/features/import-engine/extractors/character.extractor.ts` now classifies screenplay lines (`src/features/import-engine/screenplay-elements.ts`) and requires a name-shaped cue followed by dialogue.

Previously synced false characters are not deleted automatically. The creator removes them. New syncs should not recreate them.

## Correction and stabilization pass (2026-10-08, branch `correction/stabilization-pass`, uncommitted)

Code-verified with unit tests, typecheck, lint and build. No paid provider call was made (CODE VERIFIED / EXTERNAL PROVIDER NOT EXECUTED). No hosted Supabase schema, RLS, storage or data was changed.

### Generation safety

- `POST /api/generation/run` claims a queued job atomically on the server (`status = queued` and unchanged `attempt_count`), so concurrent or repeated requests cannot dispatch the same job twice. Already-claimed jobs return 409; empty or invalid JSON returns 400; oversized bodies return 413; missing Supabase configuration returns 503.
- The server persists the provider result (conditional on the job still being `running`) and updates the asset (status, file URL, progress, provenance). The client shows the server response and reloads from the database on any error; it no longer writes `generating` itself.
- Provider HTTP calls have a 45s timeout (`AbortController`) plus an overall deadline; the route sets `maxDuration = 60`. Status-check timeouts keep the job running and checkable.
- Unknown provider outcomes (v2): a create request whose outcome cannot be known is NOT an ordinary retryable failure. This covers a timeout or abort after sending, a connection lost after sending, a Kling 5xx (Kling documents a 5xx "internal timeout"), a 2xx that cannot be read, and a 2xx "accepted" without a task ID. The job is saved as `failed`, an existing status value, and `parameters` records `providerStateUnknownAt`, `providerStateUnknownReason` and, for Kling, `externalTaskId`. The creator sees "Kling may have accepted this request; its status is unknown. It was not retried to avoid a duplicate charge." The server (`runPersistedGenerationJob`) refuses with 409 to dispatch that job, or any other job of the same type for the same asset, until the creator explicitly confirms in the UI that they checked the provider dashboard. That confirmation sets `providerStateAcknowledgedAt`, and the attempt cap still applies.
- Definite failures stay retryable within the 3-attempt cap. These are a Kling 4xx, a connection that was never established (DNS failure, refused, unreachable, connect timeout), and validation or configuration errors raised before sending.
- Kling create requests send a deterministic `external_task_id` = `ks-<job id>-<attempt number>`. Kling documents this field as unique per account and queryable through the same task endpoint. No reconciliation (polling, worker or webhook) is implemented. Resolving an unknown job is a manual dashboard check today and a future reconciliation step later.
- Retries are capped at 3 attempts. A provider that failed for a non-transient reason (configuration, unsupported job, inline data needing storage) is unpinned so the next attempt can use another configured provider.
- Completed assets cannot be regenerated: that needs non-destructive Takes, which are not implemented.
- On completion, provenance becomes `generated` (creator-owned `user` provenance is kept).
- Residual risk: if the server stops after the provider accepts a task but before the result is saved, the job stays `running` without a task ID.
  - Stalled detection (v2) uses only the server-written `started_at`, which is set by the atomic claim. It does not use `updated_at` and does not depend on any trigger.
  - A job is stalled only when it is `running`, has no provider task ID, and has a `started_at` at least 10 minutes old. Queued, completed, failed and cancelled jobs are never stalled, and neither is a running job without `started_at`.
  - "Mark stalled job failed" is a conditional update. It requires `status = running`, the same `started_at`, and no `providerJobId`; RLS enforces the owner. It records the job as failed with an unknown provider state, so it is not retried automatically.
  - The orphaned provider task is not cancelled. There is no background worker or webhook, so long video jobs are checked when the creator presses "Check status".

### Providers

- OpenAI image: the code at d0c4ba0 already refused base64-only output (it never stored a URL for it), but only AFTER the paid API call, with an untyped failure that kept retries pinned to OpenAI. This pass makes three changes:
  - It refuses gpt-image models BEFORE the paid call.
  - The failure is typed (`inline-data-requires-storage`).
  - A retry unpins the provider.
- Supported today: `OPENAI_IMAGE_MODEL=dall-e-3` or `dall-e-2`. These return hosted URLs, which fit the URL-based asset architecture (`assets.file_url`).
- The default `gpt-image-1`, used when `OPENAI_IMAGE_MODEL` is unset, returns base64 only. It is intentionally refused before any paid call, because durable media storage is not implemented. Base64 is never written to `file_url` and no URL is invented. `.env.example` documents this.
- Supporting gpt-image models requires a storage decision (for example Supabase Storage). That remains a future decision and is not part of this pass.
- Provider selection prefers a provider that can actually deliver a URL for the job type, then falls back with a specific reason.
- Aspect ratio comes from the production (`parameters.aspect_ratio`) and is mapped per provider (Kling video 16:9/9:16/1:1; Kling image adds 4:3/3:4/3:2/2:3/21:9, except 21:9 on kling-v1; OpenAI sizes per model).
- Kling prompts longer than 2,500 characters fail before any API call; composed prompts are budgeted to 2,400.
- Reference images are not sent to any provider. Kling's image endpoint accepts a reference image, but wiring it requires hosted asset URLs and is future work.

### Visual context

- A shared `visual-context` module composes prompts for characters, locations, shots, panels and director notes: creative directive, approved director notes (camera/lighting), Story Bible `visual_consistency` and `forbidden_elements`, linked character appearance and location, with de-duplication and a length budget.
- Shots and panels now inherit visual context even when they already have a generation prompt. The asset planner no longer bypasses this path.
- Character reference sheets use the production's creative direction instead of a hard-coded "cinematic, photorealistic" style; the base asset's creator prompt is kept verbatim.
- Creator-edited prompts are never overwritten: only new proposals receive composed prompts. Existing asset prompts are not re-planned.

### Extraction and scene linking

- One shared structural cue detector (`detectCharacterCues`) is used by the character extractor, the scene extractor and shot beat parsing.
- The title is only detected in front matter (before the first transition or scene heading), so a script without a title page keeps its first speaker (for example `MRS. OKAFOR`).
- Single-word slug lines (`SILENCE`, `BLACK`, `FLASHBACK`, `CONTINUOUS`, `MOMENTS LATER`) followed directly by action are rejected by structural evidence (the following line reads as scene description and the name is not corroborated elsewhere), not by a growing blacklist.
- Unicode-safe names (`ADÉBÁYỌ̀` becomes `Adébáyọ̀`), inline colon cues (`DAVID: ...`), shouted dialogue (`NO!`) and suffix periods (`JOHN JR.`, `T.J.`) are supported.
- The scene extractor keeps all-caps action lines (`HE TYPES.`) as action rather than phantom speakers.
- Accepted AI scene proposals now get `characterIds` and `locationId` from the same deterministic linking as "Sync from screenplay". Character matching uses whole names, so `Tara` no longer matches `guitar`.
- Known trade-offs: a character who speaks only once, whose single line reads as scene description and who is never mentioned elsewhere, can be missed. The scene extractor works on non-blank lines, so blank-line evidence is not available there.

### Story Bible sync

- AI proposals are applied field by field. Empty fields are pre-selected; fields the creator has already written are never replaced unless the creator ticks them. Nothing is saved until the creator presses Save.

### Security and configuration

- `/api/ai/generate` requires a valid `productionId` (every caller now sends one) and verifies ownership before calling OpenRouter. Prompt sizes, temperature and `maxTokens` (at most 8,000) are validated. Models are limited to the default plus server-side `OPENROUTER_MODEL` / `OPENROUTER_ALLOWED_MODELS`. Upstream 401/403 errors are reported as 502 rather than as the caller's authentication failure. The provider request has a 110s timeout and the route sets `maxDuration = 120`.
- The unused `openai` text provider adapter now fails with a clear message (the route only proxies OpenRouter).
- `/test-supabase` returns 404 unless `NODE_ENV === "development"`. It no longer logs the session object.
- Missing Supabase environment variables no longer fall back silently to `example.supabase.co`. Browser requests fail with a clear "Supabase is not configured" error; server routes return 503. `next build` still succeeds without them.
- Route guarding: sessions are stored in browser storage, so there is no server-side page guard. Data access is protected by Supabase RLS and authenticated API routes. A middleware guard needs cookie-based sessions (an auth redesign) and was not attempted.
- New production slugs are Unicode-safe, never empty, and have a deterministic base plus a random 6-character suffix. Existing slugs are unchanged.
- The repository migration declares `productions.slug text not null unique`. The database constraint is the final uniqueness guarantee; hosted presence is not verified from here.
- If an insert fails with a Postgres unique violation (`23505`) on the slug, creation retries with a fresh suffix, up to 3 attempts in total. A failed INSERT writes nothing, so a retry cannot duplicate a production. Any other error, including a `23505` on a different constraint, is surfaced unchanged.

### Removed

- The unused `useProductionActions` hook and the unscoped `archiveAll` path (repository and `useProductions`).
- Empty files `productions/data/production.repository.ts` and `productions/hooks/use-delete-production.ts`.
- Stray root files `use-script-workspace-source.txt` and `project-structure.txt`.

## Pipeline

| Stage | Status | Notes |
| --- | --- | --- |
| Screenplay import and intelligence | Partial | Current import pipeline retained; comprehensive analysis and focused reviews persist by saved revision |
| Story Bible | Present | Current production architecture retained |
| Characters | Integrated | Field-grounded AI proposals, creator review, persistence provenance, dynamic completion |
| Locations | Present | Existing production workspace retained |
| Scenes | Integrated | Existing Scene Planner retained; screenplay extraction and accepted scenes are bound to exact saved revisions |
| Shot List | Complete | Planner, persistence, UI, tests |
| Storyboard | Complete | Shot-derived panels |
| AI Director | Partial | Grounded plan/review/persist flow is integrated; separate general AI tools are not wired to production records |
| Assets / generation jobs | Integrated | Server-side atomic claim and persistence, timeouts, capped retries, stalled-job recovery; no Takes, no worker |
| Image/video generation | Present | Kling and OpenAI (URL-returning DALL·E models only) with typed failures; no storage for base64 output; not executed against real providers in this pass |
| Render / export | Partial | Creator-reviewed assembly and persisted EDL/JSON packages; no video encoder or hosted package storage |

## Verification

Executed 2026-10-08 on the stabilization worktree (Node 24.21.0 on the build box): `npm test` 224 passed plus 8 import tests passed, 0 failed; `npx tsc --noEmit` passed; `npm run lint` 0 problems; `npm run build` passed with inline placeholder Supabase values (`https://build-placeholder.invalid`), and also passed with no Supabase variables set. No provider or hosted Supabase call was made.

Executed 2026-10-08 on `main` for the character extraction fix: character extraction and shot-planner tests passed on Node 22 (strip-types loader). That fix has since been merged into this branch.

Executed on 2026-09-29 against the revision-bound scene extraction working tree, including the existing AI Director, Render/Export, and earlier integrations:

- `npm test` - 75 passed, 0 failed.
- `npm run lint` - 0 errors; one unused-parameter warning in `src/platform/generation/providers/unconfigured.provider.ts`.
- `npx tsc --noEmit` - passed.
- `npm run build` - passed with Next.js 16.2.9; Render and Export routes were included.
- `git diff --check` - passed on the current working tree after the status update.

## Migration inventory and status

The repository contains these production pipeline migrations:

- `20260627131515_create_productions.sql`
- `202607180001_create_characters_table.sql`
- `202607280001_create_screenplays.sql`
- `202609160001_create_scenes_table.sql`
- `202609210001_create_locations_table.sql`
- `202609220002_add_creator_foundation_to_story_bibles.sql`
- `202609220003_repair_studio_sync_schema.sql`
- `202609220004_enhance_scenes_for_production.sql`
- `202609230001_add_screenplay_analysis.sql`
- `202609260001_create_shots_table.sql`
- `202609260002_create_storyboard_panels_table.sql`
- `202609260003_create_director_notes_table.sql`
- `202609280001_add_character_profile_provenance.sql`
- `202609280002_create_assets_and_generation_jobs.sql`
- `202609280003_create_render_and_export_tables.sql`
- `202609280004_create_screenplay_analyses.sql`
- `202609280005_create_screenplay_reviews.sql`
- `202609290001_add_scene_screenplay_provenance.sql`
- `202609300001_add_location_environment_fields.sql`
- `202609300002_add_scene_direction_fields.sql`

The character, Assets, generation jobs, render sequences, render clips, export packages, screenplay analyses, screenplay reviews, and scene screenplay provenance migrations have been inspected against their application repositories, data types, and production ownership policies. No database connection or migration history was checked, so whether they have been applied is unverified.

### Schema drift (proposed SQL, NOT APPLIED)

The application reads and writes `productions.created_by`, `target_duration_seconds`, `cover_image_url`, `deleted_at` and `last_opened_at`, but no migration in this repository adds them. Likewise, `story_bibles` is only altered (`ALTER TABLE IF EXISTS`) and never created. The hosted database presumably already has these. The SQL below is a proposal to make a fresh database match the code. It has not been applied or run anywhere, and it must be checked against the hosted schema before use:

```sql
-- PROPOSED, NOT APPLIED. Idempotent.
ALTER TABLE public.productions
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS target_duration_seconds integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_opened_at timestamptz;

CREATE TABLE IF NOT EXISTS public.story_bibles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id uuid NOT NULL UNIQUE REFERENCES public.productions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);
-- Content columns are added by 202609220003_repair_studio_sync_schema.sql (ADD COLUMN IF NOT EXISTS).
-- RLS for a newly created story_bibles table would need owner policies via productions.owner_id,
-- matching the other production-scoped tables; deliberately not drafted here.
```

## Next dependencies

1. Integrate a production video renderer and durable export-file storage. This repository has no render-worker or storage integration; the local FFmpeg executable is not a deployment contract, and current outputs remain EDL/JSON manifests.
2. Connect the separate general AI Director tools page to production-scoped, creator-reviewed workflows.
3. Non-destructive generation Takes (needed before completed assets can be regenerated) and storage for base64 provider output.
4. A background worker or webhook for long-running video jobs and for recovering jobs interrupted between provider acceptance and persistence.
5. Hosted-asset reference images for Kling image generation.

### 2026-10-09 migration reconciliation update

- Prepared 202610090001_create_story_bibles.sql with its full fields, production relationship, uniqueness, and owner-derived RLS policies. This supersedes the earlier minimal Story Bible proposal above.
- Prepared 202610090002_reconcile_productions.sql for the production columns used by current repositories, with conservative null-only backfills and owner foreign-key enforcement.
- Added static contract tests and isolated-database catalog assertions for both migrations. No PostgreSQL engine validation or hosted schema inspection was completed; neither migration was applied.

## 2026-11-11 screenplay workspace recovery

### Findings and changes

- The working branch is `codex/character-ai-profile-sync-integration` at `d0c4ba0`; the repository already had extensive staged/unstaged-equivalent user work in its worktree. That work was preserved and not included in this recovery change.
- The screenplay page uses the supported Next.js 16 dynamic route parameter contract. Its production layout verifies the session and production ownership on the server; screenplays and revisions are retrieved by the existing client repository under Supabase RLS.
- The route-specific blocker was an auth-session storage mismatch: sign-in used the plain `@supabase/supabase-js` browser client (local-storage session), while the production layout and server access helper required a verified cookie-backed session. A browser login could therefore be rejected by the server before the screenplay workspace rendered.
- Updated `src/lib/supabase/client.ts` to use `createBrowserClient` from `@supabase/ssr` for configured browser sessions. The existing fail-closed missing-configuration client is unchanged; server-side user verification and production-owner checks remain enabled.
- Added a mocked owned-production fixture for the supplied route ID and an authenticated integration test of `/studio/productions/86794874-c848-495f-9043-f983a88cea4b/screenplay`. This exercises the real dynamic route and protected layouts without connecting to or changing hosted data.
- Other high-priority release blockers remain: hosted migration state/RLS and production schema are unverified; video render/export still lacks production media storage/encoder integration; generation has no production worker/webhook recovery; generated-media reference storage and non-destructive asset Takes are absent.

### Files changed for this recovery

- `src/lib/supabase/client.ts`
- `e2e/support/mock-supabase.mjs`
- `e2e/studio-auth.spec.ts`
- `BUILD_STATUS.md`

### Verification

- `npm test` — passed: 319 main tests, 8 screenplay import tests, and 6 render-security tests; no failures. The PDF import test took about 5.4 minutes on this machine.
- `npm run lint` — passed.
- `npx tsc --noEmit` — passed.
- `npm run build` — passed; Next.js generated the dynamic `/studio/productions/[id]/screenplay` route.
- Exact authenticated URL integration test — passed: `npx playwright test e2e/studio-auth.spec.ts --grep "requested screenplay URL"` returned HTTP 200 and rendered the Screenplay workspace for the test owner of the supplied production ID.
- This exact-route result uses the local authenticated mock Supabase fixture; it verifies the route, server auth, ownership lookup, and workspace rendering, not the availability/ownership of the corresponding record in hosted Supabase. A standalone request to port 3000 was not reliable because no server was running initially and the local dev server's first compilation stalled on the slow filesystem.
- No hosted Supabase request, migration, database reset, or provider call was made.

## 2026-11-12 Day 2: Authentication, Production Access and Screenplay Persistence Verification

### Findings and changes

1. **Authentication End to End (Task 1)**:
   - Verified login, signup, logout, and token-refresh flows.
   - Confirmed browser authentication via `@supabase/ssr` `createBrowserClient` creates server-readable cookies (`sb-*-auth-token`) formatted as base64url-encoded session JSON payloads.
   - In Next.js 16, `src/proxy.ts` implements Proxy middleware convention (replacing deprecated `middleware.ts`), intercepting `/studio/:path*` to refresh session tokens via `@supabase/ssr` `createServerClient` and write updated response cookies and headers before protected components render.
   - Protected layout `src/app/studio/layout.tsx` verifies session validity via `getServerAccess()` -> `getAuthenticatedUser(() => supabase.auth.getClaims())`. `getClaims()` verifies the JWT signature and expiration claim against current time.
   - Verified that missing, malformed, and expired sessions strictly fail closed with an HTTP 307 redirect to `/login`.
   - Verified that browser logout (`ProfileWorkspace.tsx` -> `signOut()`) clears all auth cookies from `document.cookie` and calls GoTrue logout; subsequent requests to `/studio` are redirected to `/login`.

2. **Production Ownership and RLS Verification (Task 2)**:
   - Verified that production creation in `createProduction` sets both `owner_id` and `created_by` to the authenticated user's ID.
   - Protected production layout `src/app/studio/productions/[id]/layout.tsx` calls `getOwnedProduction(id, user.id, lookup)`. If the production does not exist or `production.owner_id !== user.id`, it immediately returns `notFound()` (HTTP 404). Cross-user access is impossible.
   - In `ProductionRepository.update`, mutable fields are strictly sanitized: `id`, `owner_id`, and `created_by` are stripped, preventing ownership hijacking or reassignment.
   - Database RLS in `20260627131515_create_productions.sql` and `202610090002_reconcile_productions.sql` enforces `auth.uid() = owner_id` on SELECT, INSERT, UPDATE (`WITH CHECK`), and DELETE.
   - Verified that frontend access checks and database RLS policies are strictly consistent.

3. **Screenplay Persistence and Non-Destructive Ledger (Task 3)**:
   - Traced `useScriptWorkspace`, `ScriptWorkspace`, and `ScreenplayRepository`.
   - Initial save creates a screenplay row with `version = 1` and creates an immutable snapshot record in `screenplay_revisions` (reason `"initial-save"`).
   - Subsequent saves increment version to `version + 1` and record an immutable revision snapshot. Existing screenplay content is NEVER silently overwritten.
   - Previous revisions are preserved in `screenplay_revisions` in descending order and can be restored using `restoreRevision`, which saves a new incremented revision preserving complete history.
   - Fixed defect in `ScreenplayRepository`: added explicit `!data` validation across `create`, `save`, `createRevision`, and `getRevisionById` so empty or null PostgREST responses throw descriptive domain errors (`"Revision not found."`) instead of unhandled null mapping TypeErrors.
   - Re-accessing or reloading `/studio/productions/[id]/screenplay` reloads the latest version and revision history via `getByProductionId` and `getRevisions`. Data survives reloads.
   - Save failures are caught by `SaveProvider` / `useSave` and accurately surfaced in `SaveStatus` and the `ScriptWorkspace` error banner.

4. **Database Readiness (Task 4)**:
   - Inspected all Supabase migrations in `supabase/migrations/`:
     - `productions` schema reconciled in `202610090002_reconcile_productions.sql` (`created_by`, `target_duration_seconds`, `cover_image_url`, `deleted_at`, `last_opened_at`).
     - `story_bibles` schema created in `202610090001_create_story_bibles.sql` with full production-scoped RLS.
     - `screenplays` and `screenplay_revisions` created in `202607280001_create_screenplays.sql`.
     - `screenplay_analyses` and `screenplay_reviews` created in `202609280004_create_screenplay_analyses.sql` and `202609280005_create_screenplay_reviews.sql`.
   - All application queries match the migrations. No migrations were applied to production; safe local mock Supabase was used.

5. **Implementation and Testing (Task 5)**:
   - Created `src/features/script-intelligence/services/screenplay-persistence.integration.test.ts` (100% pass: authentication claims, production ownership, screenplay lifecycle, revision ledger, error propagation).
   - Expanded `e2e/support/mock-supabase.mjs` with full GoTrue auth endpoints (`/auth/v1/token`, `/auth/v1/logout`, `/auth/v1/signup`) and PostgREST screenplay/revision endpoints with RLS enforcement.
   - Expanded `e2e/studio-auth.spec.ts` with test coverage for auth endpoints, invalid credentials, and full screenplay persistence lifecycle under RLS.
   - Registered `screenplay-persistence.integration.test.ts` in `package.json`.
   - Ran `npm run lint` — passed (0 errors, 0 warnings).
   - Ran `npm run typecheck` (`tsc --noEmit`) — passed.
   - Ran `npm run build` — passed with Next.js 16.2.9 Turbopack build.

### Files changed for Day 2

- `src/features/script-intelligence/repositories/screenplay.repository.ts`
- `src/features/script-intelligence/services/screenplay-persistence.integration.test.ts`
- `e2e/support/mock-supabase.mjs`
- `e2e/studio-auth.spec.ts`
- `package.json`
- `BUILD_STATUS.md`

### Outstanding blockers and next dependencies

1. Production database migration application: `202610090001_create_story_bibles.sql` and `202610090002_reconcile_productions.sql` are prepared and statically tested, but unapplied to hosted Supabase. Requires safe staging environment verification before production migration.
2. Production video render engine & durable export storage: local FFmpeg integration exists, but deployable cloud render worker and storage buckets (e.g. Supabase Storage / S3) remain pending.
3. Generation jobs provider-reconciliation worker / webhook for asynchronous long video generation and non-destructive Take management.
