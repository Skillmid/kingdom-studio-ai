# Kingdom Studio AI — Release Stabilisation Plan

**Status:** Active engineering work  
**Baseline:** `kingdom-studio-recovery-2026-11-13` (`d533f743b2ea211be4da707a2e414b4a8e2ca2e0`)  
**Working branch:** `integration/kingdom-studio-release-stabilization`  
**Created:** 2026-11-23

## Operating rules

- Preserve the recovery baseline; do not force-push or rewrite shared history.
- Do not merge feature branches or change `main` until their code, migrations, tests, and preview behavior have been reviewed.
- Do not apply database migrations to production as part of this work without an explicit reviewed rollout and backup.
- Never enable paid provider calls or storage configuration until the relevant preview flow is verified.
- Keep provider secrets server-side. Never log or copy secret values into this plan.
- A green Vercel deployment is build/deployment evidence, not proof of complete application behavior.

## Eight workstreams

### 1. Establish and protect the integration baseline
- [x] Create this isolated integration branch from the November 13 recovery commit.
- [x] Compare the recovery baseline with `main` and every feature branch; identify unique commits, duplicate work, and conflicts.
- [x] Confirm the integration branch contains the intended recovery state before adding changes.
- [ ] Keep production/main untouched until release gates pass.

### 2. Reconcile stacked feature branches and pull requests
- [x] Review PRs #8, #9, and #10 against the recovery baseline; these target the older `main` and must not be blindly merged.
- [x] Review the dependency stack PR #11 → #12 → #13.
- [x] Inspect all code diffs, migration files, review comments, and deployment evidence.
- [ ] Integrate only changes that are not already present and that pass verification.

### 3. Resolve database and Story Bible migration readiness
- [x] Inventory all migrations and map them to repositories/DTOs.
- [ ] Verify the Story Bible base/reconciliation migrations against the application schema and existing migration history.
- [ ] Verify production root schema reconciliation, foreign keys, indexes, triggers, and RLS.
- [ ] Run clean-install and upgrade tests in an isolated database.
- [ ] Do not run `supabase db push` against production without an approved rollout.

### 4. Verify authentication, authorization, and data isolation
- [ ] Review page, API, repository, and storage authorization boundaries.
- [ ] Test signed-out, owner, and foreign-owner behavior using isolated test accounts and disposable data.
- [ ] Verify RLS for every production-owned table and private media object.
- [ ] Confirm no service-role secret or provider key reaches browser code or logs.

### 5. Consolidate and verify AI provider integration
- [ ] Review OpenRouter, OpenAI text, Gemini, and character-provider routing.
- [ ] Validate model allowlists, environment variable names, timeouts, limits, and error handling.
- [ ] Verify default-provider behavior and missing-key behavior without paid calls.
- [ ] Run controlled provider smoke tests only after explicit configuration and cost review.

### 6. Complete Character Studio and durable media storage
- [ ] Verify reference proposal, generation queue, provider-state uncertainty, creator review, and approval flow.
- [ ] Verify private bucket migration, RLS policies, stable storage references, signed preview URL hydration, and deletion cleanup.
- [ ] Test GPT Image base64 handoff in Preview without enabling it in Production.
- [ ] Confirm generation output never becomes an approved reference without creator approval.

### 7. Validate the end-to-end filmmaking workflow and Render/Export boundary
- [ ] Test production → screenplay/revision → Story Bible → characters/locations/scenes → shots → storyboard → AI Director → assets/jobs → export.
- [ ] Verify persistence after reload and preservation of creator-approved work.
- [ ] Confirm missing media is represented honestly and no URL/file is fabricated.
- [ ] Distinguish manifest/EDL planning from actual encoded video and hosted delivery; document any remaining encoder/worker/storage work.

### 8. Run release verification and prepare a controlled release
- [ ] Run unit/import/security tests, typecheck, lint, production build, and relevant Playwright end-to-end tests.
- [ ] Run Preview smoke tests against isolated Supabase data and configured providers.
- [ ] Record test evidence, deployment SHA, migrations, rollback plan, known limitations, and release decision.
- [ ] Merge/promote only after every required gate passes; keep `main` and Production protected until then.

## Initial evidence (2026-11-23)

- `main` points to `1d6f10b` (October 8 character-extraction fix).
- Recovery points to `d533f74` (November 13 local-state recovery) and is 59 commits ahead of `main`.
- PR #11, #12, and #13 form a dependency stack; all are drafts. Their branch heads had successful Vercel status checks at inspection time.
- PR #8, #9, and #10 target the older `main`; their current head status checks were not present in the status API response.
- The repository README states that Story Bible migrations have not been run against local Postgres or the hosted database.
- Repository documentation states that current Render/Export output is a delivery manifest/EDL/package record, not an encoded film or hosted media delivery.
- Previous 269-test/typecheck/lint/build and Playwright results are historical evidence for the audited snapshot, not a fresh run on this integration branch.

## Change log

- 2026-11-23: Created isolated integration branch from recovery baseline and recorded initial release-stabilisation gates.

## Detailed initial review findings (2026-11-23)

### Branch reconciliation
- The three older PRs are not safe merge candidates into the recovery baseline:
  - PR #8 has 4 commits unique to its old branch and is 103 commits behind recovery.
  - PR #9 has 5 commits unique to its old branch and is 99 commits behind recovery.
  - PR #10 has 8 commits unique to its old branch and is 88 commits behind recovery.
- These branches diverged from recovery. The recovery tree already contains the richer production modules and supporting tests. Do not cherry-pick or merge the old PRs without a file-level comparison.
- The dependency stack is cleanly ordered by ancestry: recovery → multi-provider gateway → Character Studio → durable media storage. PR #11 is 73 commits ahead of recovery; PR #12 is 14 commits ahead of #11; PR #13 is 18 commits ahead of #12.
- The latest preview deployments for recovery, provider gateway, Character Studio and media storage all report Vercel READY. This verifies deployment completion only; it does not verify runtime workflows, database migrations, provider credentials, or paid generation.

### Code review observations
- Recovery contains a functional Assets workspace with create/edit/delete, plan, approval, queue, status-check and stalled-job recovery paths. This is materially more complete than the old PR #9 branch's initial thin shell. Retain recovery as the base.
- Recovery contains a Render workspace with persisted sequence/clip/export flows and video-render job hooks. The UI explicitly labels manifest downloads as not encoded video; the actual encoder/worker/delivery path still needs runtime verification.
- PR #11's `.env.example` declares `OPENAI_API_KEY` twice. Clean up the duplicate when integrating.
- PR #11's Gemini provider is routed through the authenticated server endpoint, but its default model identifier, provider allowlist behavior, error paths, and real provider compatibility still require verification. No paid call has been made.
- PR #12 correctly separates permission to spend on generation from approval of the generated reference; generated output returns to creator review. Provider-specific reference-image conditioning is explicitly not included.
- PR #13 adds a private bucket migration, authenticated RLS-scoped uploads, stable `storage://` references and signed previews. The migration has not been executed against Postgres, and the upload/read/delete policies and object path ownership mapping must be tested in an isolated Supabase project before enabling the feature.
- The PR #13 route refuses inline image generation unless `SUPABASE_MEDIA_BUCKET=production-media` is configured. Do not add that variable to Production until the isolated migration and preview workflow pass.
- Story Bible migration files are present on recovery, but the repository's own documentation states they have not been executed against clean Postgres or the hosted schema. Static migration contract tests are not a substitute for a database-engine test.

### Current working state
- Integration branch created from recovery: `integration/kingdom-studio-release-stabilization`.
- Initial plan committed as `0c80f2631610ffd515477b2d56581b51be70983a`.
- No application code, database, Production deployment, provider settings, or existing PR has been changed or merged during this initial audit.


## Follow-up engineering review (2026-11-23)

### CI and verification evidence
- The recovery commit tree contains no `.github/workflows/` directory. The GitHub Actions workflow-run lookup returned no runs for the PR #11, #12, or #13 head commits. There is therefore no current GitHub Actions evidence that the integration stack has passed tests.
- The Vercel deployment comments on PRs #11–#13 show READY preview deployments from November 16, 2026. These are build/deployment signals only and do not establish database migration success or authenticated feature correctness.
- The recovery `package.json` defines test, typecheck, lint, build, and Playwright scripts. Those scripts have not been executed in this remote audit environment. The earlier 269-test report remains historical evidence only.

### PR #11 — provider gateway review
- The PR adds authenticated server-side OpenAI and Gemini text-generation paths, model allowlist helpers, JSON/character-profile response formatting, and browser adapters that call the authenticated route.
- Confirmed cleanup items before integration: `.env.example` declares `OPENAI_API_KEY` twice; `src/platform/ai/config/default-provider.ts` repeats the `openai` check in its supported-provider predicate.
- The proposed Gemini default is `gemini-3.8-flash`. Treat this as unverified until checked against the live provider model catalogue and tested with a controlled request. No provider call has been made in this audit.
- The PR is still a draft. Its Vercel preview is READY, but no GitHub Actions run was found for its head SHA.

### PR #12 — Character Studio review
- The diff adds a creator-review gate: permission to queue generation is separate from approval of the generated image, and generated output is returned to an unapproved review state.
- The diff also adds pending-draft reuse and generation status handling in the character reference UI.
- No migration is included in this PR patch. The change still needs the full application test suite and an authenticated preview workflow test.

### PR #13 — durable media review
- The PR adds `supabase/migrations/202611160001_create_private_production_media_bucket.sql`, creating a private `production-media` bucket and owner-scoped SELECT/INSERT/DELETE policies that map object path segments to production and asset IDs.
- The migration is not present on the recovery baseline and has not been applied to an isolated Supabase database. Its storage policy behavior, path parsing, bucket constraints, signed URL hydration, and cleanup behavior remain unverified.
- The PR adds `SUPABASE_MEDIA_BUCKET=production-media` to `.env.example`; do not configure this in Production until the migration and complete preview flow pass.
- No GitHub Actions run was found for this head SHA. The Vercel preview is READY only.

### Integration decision
- Keep PRs #11–#13 as reviewed, not yet integrated. They are a dependency stack and the PR diffs show genuine feature work, but test execution and database validation are missing.
- Do not merge the three older PRs #8–#10. Their work is superseded or divergent relative to the recovery baseline; preserve the functional recovery implementations.
- No application source files, database migrations, provider secrets, storage settings, Production deployment, or existing pull requests have been changed by this follow-up review.


### Execution environment and migration inventory update (2026-11-23)
- The recovery baseline contains 23 SQL migration files under `supabase/migrations/`, including the Story Bible base/reconciliation migrations and the November 2 render-worker migrations. PR #13 adds a 24th migration for private production media storage.
- The migration inventory is complete, but a clean Postgres/Supabase migration run has not been performed. The isolated Vercel sandbox creation requests were rejected by the Vercel API, so this session currently has no working repository shell in which to run `npm ci`, tests, typecheck, lint, or build.
- This is a verification blocker, not a passing result. Do not treat the earlier test report or Vercel READY cards as a substitute for a fresh run on the integration candidate.
- Next required execution step: obtain the GitHub Actions run result for the newly added release-verification workflow. If Actions are unavailable or blocked, use an available Vercel sandbox/CI runner; do not substitute a Vercel READY deployment for test output.


### GitHub-side verification workflow (2026-11-23)
- Added `.github/workflows/release-verification.yml` on the integration branch in commit `ff50a935fa54dddce160838781b7f070c000c718`.
- The workflow is scoped to pushes and pull requests targeting `integration/kingdom-studio-release-stabilization`, plus manual dispatch. It uses Node.js 22 and the committed npm lockfile, then runs `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
- The workflow requests read-only repository contents permission and does not require provider or Supabase secrets for its configured checks.
- Vercel has started a Preview deployment for this exact commit; it was still BUILDING at the time of this update.
- GitHub's commit workflow-run lookup currently returned no run record for this push commit because the available wrapper only returns pull-request-triggered runs. The combined commit status showed the Vercel check pending. Therefore no CI test result is claimed yet.
- Attempts to create/resume a Vercel sandbox through the available Vercel API calls returned errors; the previously listed sandbox was stopped and had no snapshot. No shell command or test has been run in this session.


### Latest Preview verification (2026-11-23)
- Vercel deployment for documentation/workflow commit `669884a262f2ac8453dd0e54359dbe4f70b3c530` reached `READY`; its Vercel commit status is `success`.
- The preview deployment is `https://kingdom-studio-g7e1o1kaa-olumide-joseph-obikoyas-projects.vercel.app`. This is a Preview deployment only, not Production.
- Vercel runtime error aggregation for the last 24 hours returned no runtime errors. The selected preview deployment had no runtime log records in the queried 50-minute window. Absence of logs is not a functional test and does not prove that authenticated flows work.
- GitHub workflow run results are still not confirmed. The available commit-run wrapper only returns pull-request-triggered runs, and no workflow-dispatch action is exposed by the connected GitHub toolset. Do not mark the GitHub workflow passed based on the Vercel deployment.
- Attempted to create a fresh Vercel sandbox using the available v2, v3, and v4 APIs; each returned a generic `400 bad_request`. The old sandbox cannot be resumed because it has no snapshot. No source-code test commands were executed.
- Next action: obtain a GitHub Actions run through repository Actions access or a working Vercel sandbox/runner, then execute the full quality suite. Continue static review of PR #11–#13 and database/RLS contracts in parallel; do not merge or promote until execution evidence exists.


### Database and storage static review (2026-11-23)
- Reviewed the recovery Story Bible migration and production reconciliation migration directly from the integration branch.
- Found a partial-schema hardening gap in the Story Bible migration: its reconciliation path checked for duplicate IDs and set the ID column NOT NULL, but did not itself guarantee ID uniqueness when an existing manually provisioned table lacked a primary/unique constraint.
- Closed that gap on the integration branch by adding a unique index on `story_bibles(id)`. Also validate the positive-duration constraint after the migration's existing null/non-positive-value repair. Commit: `6d32b9e6c2c45ccf54d3a61a2afc31282452fb08`.
- The production reconciliation migration backfills `created_by` from `owner_id`, adds its foreign key and strengthens the owner update policy. This remains dependent on the existing `productions.owner_id` and auth schema being present as expected; no live schema inspection has been performed.
- Reviewed PR #13's private media migration on its feature branch. It creates a private bucket with a 20 MiB limit and PNG/JPEG/WebP allowlist. Storage SELECT/INSERT/DELETE policies bind object paths to an existing asset, its production, and the authenticated production owner. This is a sensible ownership shape, but must be tested against Supabase Storage's actual folder parsing and RLS execution using isolated users and objects.
- PR #13's migration currently includes `COMMENT ON TABLE storage.objects`, which changes a global system-table comment rather than documenting only the feature. Remove that statement before integration to avoid unrelated schema metadata mutation.
- The media migration is not on the integration branch and has not been applied. Do not add `SUPABASE_MEDIA_BUCKET` to Preview or Production until the PR stack is integrated and upload/read/delete plus signed-URL hydration tests pass.
- No Postgres engine, hosted Supabase schema, or authenticated two-user test environment was available in this review. These are static code findings, not database execution results.
