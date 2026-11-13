# Kingdom Studio AI Changelog

---

## Unreleased: correction and stabilization pass (2026-10-08)

### Fixed

- Generation jobs are claimed atomically and persisted on the server, so double clicks and concurrent requests cannot dispatch twice. Provider calls time out; empty or invalid JSON returns 400 instead of 500.
- OpenAI base64-only image models (`gpt-image-*`, including the default `gpt-image-1`) are now refused before the paid API call, with a typed reason. Previously a base64-only response was also rejected and no URL was stored, but only after the paid call, and retries stayed pinned to OpenAI. To use OpenAI image generation today, set `OPENAI_IMAGE_MODEL=dall-e-3` (or `dall-e-2`). Durable storage for base64 output is a future decision.
- A provider request whose outcome is unknown is recorded as failed with an unknown provider state, and it is never retried automatically. This covers a timeout or lost connection after sending, a Kling 5xx, and a Kling response accepted without a task ID. The server refuses a new paid dispatch for that asset until the creator confirms they checked the provider dashboard. Kling requests carry a deterministic `external_task_id`.
- Stalled-job detection uses the server-written `started_at` instead of `updated_at`, so it no longer depends on a database trigger. Marking a stalled job failed records an unknown provider state rather than a plain, retryable failure.
- Retries are capped at 3 and unpin a provider that failed for a non-transient reason.
- Shots, panels and character reference sheets inherit production visual context. Character sheets no longer force a photorealistic style.
- Character extraction keeps the first speaker in scripts without a title page and rejects slug lines such as SILENCE or MOMENTS LATER. It also handles accented names, inline colon cues, shouted dialogue and JR./initials.
- The scene extractor and shot beats use the same cue rules, so all-caps action lines stay action.
- AI-approved scenes are linked to characters and locations like screenplay sync. Character matching uses whole names.
- Story Bible AI sync never replaces a creator-written field unless the creator selects it.
- Asset provenance becomes "generated" when generation completes.
- `/api/ai/generate` requires and verifies `productionId`, bounds prompt and token sizes, and restricts models.
- `/test-supabase` is development-only. Missing Supabase configuration fails clearly instead of calling a placeholder project.
- New production slugs are Unicode-safe, never empty and get a random suffix. The database `UNIQUE` constraint on `productions.slug` is the final guarantee. A slug unique violation is retried with a new suffix, up to 3 attempts.

### Removed

- The unused bulk "archive all productions" path, empty placeholder files and stray root text dumps.

---

## Version 0.7.2

### Fixed

- Character sync no longer treats title lines, action lines, camera direction, sound cues, or object descriptions as characters
- Screenplay cues now require name shape plus following dialogue evidence; capitalized text alone is not a character
- Shot beat parsing uses the same character-cue rules so action lines are not speakers

---

## Version 0.7.1

### Added

- Production Assets workspace hook and UI for plan, approve, edit, delete and queue-generation
- Generation-job `createMany` plus compact mapper writes on asset and job persistence
- Dispatch result persistence that copies provider output URLs only when a provider returns one

### Fixed

- Generation provider constructors are compatible with the Node strip-types test runner

---

## Version 0.7.0

### Added

- Production Assets workspace with plan, approve, edit, delete and queue-generation flows
- Asset planning from persisted characters, locations, shots, panels and director notes
- Approved-asset protection so later planning cannot recreate filmmaker-owned titles
- Generation job queue that persists dispatch results and never invents a media URL
- Partial-update mappers for assets and generation jobs that omit undefined columns
- Unit tests for grounded asset planning, job lifecycle and mapper compacting

---

## Version 0.6.0

### Added

- Generic Render / Export module that assembles a sequence from shots, leftover storyboard panels and image/video assets
- Media URLs copied only from existing asset `fileUrl` or panel `imageUrl` values
- Export records for delivery manifest, EDL and preview package formats that never invent a package file URL
- `render_sequences`, `render_clips` and `export_packages` tables with production-owner RLS
- Production Render and Export workspaces with assemble, approve, remove and export flows
- Restored Assets and AI Director repositories/views required by production pages
- Unit tests for grounded sequence planning, approved-clip protection and export serialization

---

## Version 0.5.0

### Added

- Generic Assets module with production-derived character, location, shot and panel references
- Generation job state machine with queued, running, completed, failed, cancelled and retry transitions
- Recoverable unconfigured-provider failures that never invent a file URL
- `assets` and `generation_jobs` tables, RLS policies, and production-owned persistence
- Deterministic asset completion scoring
- Production Assets workspace with plan, queue, edit and delete flows
- Restored AI Director persistence and workspace files required by the production page
- Unit tests for grounded asset planning, approved-asset protection, and job lifecycle

---

## Version 0.4.0

### Added

- Generic AI Director module with production-derived direction notes
- Note enrichment from persisted scene, shot, storyboard, character and location records
- `director_notes` table, RLS policies, and production-owned persistence
- Deterministic director-note completion scoring
- Unit tests for grounded direction planning, uncertainty preservation, and approved-note protection
