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
- [ ] Compare the recovery baseline with `main` and every feature branch; identify unique commits, duplicate work, and conflicts.
- [ ] Confirm the integration branch contains the intended recovery state before adding changes.
- [ ] Keep production/main untouched until release gates pass.

### 2. Reconcile stacked feature branches and pull requests
- [ ] Review PRs #8, #9, and #10 against the recovery baseline; these target the older `main` and must not be blindly merged.
- [ ] Review the dependency stack PR #11 → #12 → #13.
- [ ] Inspect all code diffs, migration files, review comments, and deployment evidence.
- [ ] Integrate only changes that are not already present and that pass verification.

### 3. Resolve database and Story Bible migration readiness
- [ ] Inventory all migrations and map them to repositories/DTOs.
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
