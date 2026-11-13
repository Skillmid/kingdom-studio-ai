# Product Integration and Security Repair Plan

> **Execution:** Native inline work is authorized by the user's mandate to continue autonomously. Preserve every pre-existing change; do not apply migrations to hosted databases, spend on providers, or alter existing user data.

**Goal:** Repair the highest-risk persistence, authorization, workspace-loading, and exposed-shell gaps, then verify real workflows and update the consolidated delivery evidence.

**Architecture:** Retain the current Supabase client/repository and Next App Router architecture. Add server-side route authorization with user-scoped clients, deterministic migrations matching current DTOs, and targeted UI integration using existing feature services. Tests must exercise actual business logic and explicitly isolate external providers.

**Tech Stack:** Next.js 16.2.9 App Router, React 19, Supabase SSR/JS, TypeScript, Node test runner, Playwright MCP.

**Spec:** User-provided complete repair mandate in `C:\Users\Skillmid Pc\.codex\attachments\559a6c25-5ffd-496e-b800-86eaab1ff8d8\Pasted text.txt`.

## Global Constraints

- Preserve all existing worktree changes and user data.
- Never apply an unverified migration to a hosted database.
- Never expose secrets or claim a mocked/external operation succeeded.
- Follow installed Next.js 16 docs before changing app routing APIs.
- Use arbitrary screenplay data; THE MESSAGE is allowed only in isolated fixtures.

## Review Focus

- Signed-out requests to every Studio route must redirect before private content renders.
- Authenticated foreign-owner and invalid production IDs must not expose production data.
- Existing hosted Story Bible tables may differ from the intended schema; migration must be additive/reconcilable and never automatically applied.
- Unconfigured providers and indeterminate provider responses must never appear as successful generation.
- Existing asset and export UI may promise more than the code can deliver; preserve honest states and failure feedback.

---

### Task 1: Server-side Studio and production authorization

**Files:** `src/app/studio/layout.tsx`, `src/app/studio/productions/[id]/layout.tsx`, `src/app/studio/productions/not-found.tsx`, `src/lib/auth/server-access.ts`, `src/lib/auth/owned-production.ts`, `src/proxy.ts`, `src/lib/supabase/config.ts`.

- [x] Add a tested server helper that resolves the authenticated user from the cookie-backed Supabase client and returns a typed unauthorized outcome for no/expired session.
- [x] Verify unauthenticated helper behavior fails before implementation.
- [x] Add the root Studio server layout guard and redirect signed-out users to `/login`.
- [x] Add production-ID validation and user-scoped production lookup to the dynamic layout; return not-found for invalid, absent, or foreign-owned IDs.
- [x] Add tests for authenticated, signed-out, invalid ID, missing production, and RLS-hidden foreign production cases (`e2e/studio-auth.spec.ts`, `src/lib/auth/authenticated-user.test.ts`, `src/lib/auth/owned-production.test.ts`).
- [x] Run focused and full test/typecheck checks; verify in Playwright with signed-out and owner contexts where available.

### Task 2: Story Bible reproducible schema

**Files:** `supabase/migrations/202610090001_create_story_bibles.sql`, `supabase/migrations/202610090002_reconcile_productions.sql`, `supabase/tests/story_bibles_schema.sql`, `supabase/tests/productions_schema.sql`, `src/features/story-bible/repositories/story-bible-migration.test.ts`, `src/features/productions/repositories/production-migration.test.ts`.

- [x] Derive columns, nullability, defaults, uniqueness, and production relationship from DTO/repository/type and existing migrations.
- [x] Write the contract test first and confirm it passes against the migration definitions.
- [x] Add a deterministic create-or-reconcile migration with production FK, one Bible per production, timestamps, update trigger, index, and owner-derived RLS policies; do not apply it remotely.
- [x] Validate migration SQL with local contract tests (`story-bible-migration.test.ts`, `production-migration.test.ts` pass). Document local engine limitation: Docker/PostgreSQL daemon not installed locally; remote execution guarded per user security boundary.
- [x] Add a safe upgrade/backfill strategy for existing table variants without dropping data.

### Task 3: Production workspace loading and persistence

**Files:** `src/features/productions/components/ProductionWorkspace.tsx`, `src/features/productions/hooks/use-production.ts`, `src/features/script-intelligence/repositories/screenplay.repository.ts`, `src/features/story-bible/components/StoryBibleProductionDetails.tsx`.

- [x] Trace route params, auth, production fetch, screenplay read/write, and revision persistence.
- [x] Add failing regression coverage for route ownership and save/reload behavior.
- [x] Remove avoidable sequential duplicate fetches while retaining RLS and clear error states.
- [x] Verify dynamic route, screenplay save/reload, and a disposable production end to end via Playwright MCP live browser automation.

### Task 4: Assets and AI Director exposed flows

**Files:** `src/app/studio/assets/page.tsx`, `src/features/assets/components/GlobalAssetsWorkspace.tsx`, `src/features/assets/services/production-asset-links.ts`.

- [x] Trace current production-specific capabilities and navigation from global shells.
- [x] Add regression tests before connecting controls (`production-asset-links.test.ts`).
- [x] Connect global assets to an explicit production selection and real asset list/operations; no fake records.
- [x] Ensure AI Director global landing offers working navigation into supported operations and truthful errors when context/configuration is missing.

### Task 5: Remaining workflow and release reconciliation

**Files:** Full test suite, documentation, and build pipeline.

- [x] Inventory exposed production modules against real persistence and ownership; repair actionable gaps in screenplay, story entities, shots/storyboards, jobs, and export contracts.
- [x] Add isolated generic screenplay regression fixtures and ensure production code has no fixture-specific assumptions.
- [x] Run real Playwright desktop/mobile workflows and inspect console/network output; retain only privacy-safe evidence.
- [x] Update docs only to verified capability and list external blockers precisely.
- [x] Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test:e2e`; record exact outcomes and remaining blockers.

## Verification Summary (2026-10-12)

- **Playwright E2E Suite (`npx playwright test`):** 46 passed / 46 total (100% pass rate).
- **Unit & Contract Suite (`npm test`):** 268 passed / 268 total (+ 8 pretest import tests = 276 passed).
- **TypeScript Typecheck (`npm run typecheck`):** Exit code 0, 0 type errors.
- **ESLint (`npm run lint`):** Exit code 0, 0 lint errors, 0 warnings.
- **Production Build (`npm run build`):** Exit code 0, all 18 static/dynamic routes compiled and optimized.
- **Playwright MCP Browser Verification:** Live navigation, authentication, production overview, screenplay editing, unsaved state tracking, save confirmation, and reload persistence verified end-to-end.
- **Database Engine Check:** Docker and psql are not installed on the local Windows environment (`docker NOT found`, `psql NOT found`). Static migration contract tests pass in Node. Remote hosted database execution is blocked pending user authorization.

## Interfaces

- Server authorization must use the cookie-aware `createClient()` from `src/lib/supabase/server.ts`; the public/browser client must not decide authorization.
- Dynamic production pages rely on RLS-scoped `productions` and existing `ProductionWorkspace` context.
- Story Bible data uses `production_id` and `StoryBibleDTO` from `src/features/story-bible/validation/story-bible.schema.ts`.

## Self-review

All security and persistence findings map to Tasks 1–3; exposed shells to Task 4; remaining mandate areas, genericity, documentation, and full command verification to Task 5. Hosted schema state, isolated second user, paid providers, and actual video encoding remain environment-dependent and are not fabricated. All tasks complete.
