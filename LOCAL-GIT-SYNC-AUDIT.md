# Local Git Sync Audit

## Scope and evidence

- Repository: `Skillmid/kingdom-studio-ai`
- Branch: `codex/character-ai-profile-sync-integration`
- GitHub base inspected: `75828ec7f668bb064435a6cb68e37ef98eb32a4c`
- Source Control reported 156 pending changes in the prior audit.
- This report uses direct project-file reads, the Git index/HEAD metadata, the prior partial Source Control capture, and read-only GitHub file reads. No Git command, terminal, npm script, Source Control UI, build, or test was used for this report.

**Inventory limitation:** The complete list of 156 paths is **UNKNOWN**. The Git index records the committed baseline, not the worktree’s modified, untracked, or deleted state. The earlier Source Control capture was partial and virtualized; it recorded about 65 distinct entries, not a verifiable complete list. Therefore neither the 156 names nor the exact number/status of missing paths can be reconstructed from available project metadata. The inventory below includes paths explicitly identified in that capture or subsequently confirmed by direct inspection. It is not represented as the full 156.

## 1. Identified changed paths and classification

Categories: **A** production source; **B** tests/test infrastructure; **C** documentation/architecture; **D** migrations/configuration; **E** generated/disposable output; **F** local-only configuration or sensitive material; **G** deletion requiring investigation.

### A — Production source

The following paths were identified as changed in the prior partial capture or in its source review:

| Path | Classification | Evidence/status and concise assessment |
|---|---|---|
| `src/app/api/ai/generate/route.ts` | A | Tracked-file change; local and GitHub-base behavior compared below. |
| `src/app/api/generation/run/route.ts` | A | Tracked-file change; local and GitHub-base behavior compared below. |
| `src/platform/generation/dispatch.ts` | A | Tracked-file change; local and GitHub-base behavior compared below. |
| `src/platform/generation/providers/kling.provider.ts` | A | Tracked-file change; provider recovery/timeout behavior was reviewed. |
| `src/platform/generation/providers/openai-image.provider.ts` | A | Tracked-file change; URL-only output handling was reviewed. |
| `src/lib/supabase/server.ts` | A | Tracked-file change; uses the local configuration helper. |
| `src/lib/supabase/config.ts` | A, D | Present locally; absent from base commit. Same path exists on the preview branch with materially different semantics. |
| `src/proxy.ts` | A | Present locally; GitHub-base lookup returned no file. Local content is not fully compared here. |
| `src/app/api/render/health/route.ts` | A | Present locally; no current-base counterpart was found in the prior review. |
| `src/app/api/render/jobs/route.ts` | A | Present locally; render job API addition. Per-file GitHub comparison: **UNKNOWN**. |
| `src/app/api/render/jobs/[id]/route.ts` | A | Present locally; render job API addition. Per-file GitHub comparison: **UNKNOWN**. |
| `src/app/api/render/jobs/[id]/retry/route.ts` | A | Present locally; render job API addition. Per-file GitHub comparison: **UNKNOWN**. |
| `src/app/api/render/jobs/[id]/playback/route.ts` | A | Present locally; render job API addition. Per-file GitHub comparison: **UNKNOWN**. |
| `src/app/api/render/jobs/[id]/cancel/route.ts` | A | Present locally; render job API addition. Per-file GitHub comparison: **UNKNOWN**. |
| `src/features/render/services/render-worker-entrypoint.ts` | A | 137-line worker entrypoint reviewed locally; GitHub-base lookup returned no file. |
| `src/features/scenes/hooks/use-scenes.ts` | A | Identified in the prior partial source list; exact diff not preserved in available evidence. |
| `src/features/script-intelligence/hooks/use-scene-extraction.ts` | A | Identified in the prior partial source list; exact diff **UNKNOWN**. |
| `src/features/script-intelligence/services/approved-scene-persistence.ts` | A | Identified in the prior partial source list; exact diff **UNKNOWN**. |
| `src/features/script-intelligence/services/scene-extraction-provenance.ts` | A | Identified in the prior partial source list; exact diff **UNKNOWN**. |
| `src/features/script-intelligence/services/script-intelligence.service.ts` | A | Identified in the prior partial source list; exact diff **UNKNOWN**. |
| `src/features/script-intelligence/services/script-scene-extraction.engine.ts` | A | Identified in the prior partial source list; exact diff **UNKNOWN**. |
| `src/features/shots/services/shot-planner.ts` | A | Identified in the prior partial source list; exact diff **UNKNOWN**. |
| `src/features/story-bible/components/StoryBibleEditor.tsx` | A | Identified in the prior partial source list; exact diff **UNKNOWN**. |
| `src/features/story-bible/components/StoryBibleProductionDetails.tsx` | A | Identified in the prior partial source list; exact diff **UNKNOWN**. |
| `src/features/story-bible/components/StoryBibleScreenplaySyncPanel.tsx` | A | Identified in the prior partial source list; exact diff **UNKNOWN**. |
| `src/features/story-bible/hooks/use-story-bible.ts` | A | Identified in the prior partial source list; exact diff **UNKNOWN**. |
| `src/features/story-bible/repositories/story-bible.repository.ts` | A | Identified in the prior partial source list; exact diff **UNKNOWN**. |
| `src/features/story-bible/services/story-bible-screenplay-sync.service.ts` | A | Identified in the prior partial source list; exact diff **UNKNOWN**. |

Other render-feature source and test files are present locally, but the available capture does not establish which of them are among the 156 changes. Do not infer changed status from local presence alone.

### B — Tests and test infrastructure

The prior capture included Playwright configuration, end-to-end specs, and support/setup files, but did not preserve a complete status-to-path mapping. The following local paths are present in the test directories; their inclusion in the 156 changes is **UNKNOWN** unless specifically noted:

- `playwright.config.ts` — specifically seen as changed in the prior capture.
- `e2e/support/test-auth.cjs`
- `e2e/support/mock-supabase.mjs`
- `e2e/studio-network-requests.spec.ts`
- `e2e/studio-navigation-responsive.spec.ts`
- `e2e/studio-auth.spec.ts`
- `e2e/story-bible-accessibility.spec.ts`
- `e2e/screenplay-import-workflow.spec.ts`
- `e2e/screenplay-entry-accessibility.spec.ts`
- `e2e/render-job-workflow.spec.ts`
- `e2e/qa-audit.spec.ts`
- `e2e/production-workspace-responsive.spec.ts`
- `e2e/production-workflow-guidance.spec.ts`
- `e2e/production-route-responsive.spec.ts`
- `e2e/production-form-accessibility.spec.ts`
- `e2e/production-creation-accessibility.spec.ts`
- `e2e/local-smoke.spec.ts`
- `e2e/global-setup.mjs`
- `e2e/comprehensive-audit.spec.ts`
- `e2e/character-proposal-source.spec.ts`
- `e2e/asset-form-copy.spec.ts`

Render-related local tests also include `src/features/render/services/render-pipeline.integration.test.ts`, `render-worker-migration-contract.test.ts` under repositories, `secure-media.test.ts`, `video-render-engine.test.ts`, `video-render-worker.test.ts`, and render schema/mapper/repository tests. Which are changed rather than baseline files is **UNKNOWN**. No tests were run.

### C — Documentation and architecture decisions

Paths explicitly identified in the prior capture or subsequent review:

- `README.md` — identified as changed; exact diff **UNKNOWN**.
- `.superpowers/product-integration-repair-progress.md` — local progress note; likely task-specific/historical. Whether tracked or untracked was not recoverable from current metadata.
- `docs/superpowers/plans/2026-10-09-product-integration-repair.md` — repair plan; historical test/build statements are not current validation.
- `docs/decisions/0005-background-rendering-architecture.md`
- `docs/decisions/0006-render-worker-deployment-plan.md`
- `docs/05-SUPABASE-MIGRATION-RUNBOOK.md`
- Other documentation and ADR paths were visible in the partial capture, but their exact names/statuses are **UNKNOWN**. Do not treat all files under `docs/` as changed.

### D — Database migrations and configuration

- `supabase/migrations/202611020001_create_video_render_jobs.sql` — render-job schema and policies.
- `supabase/migrations/202611020002_render_worker_leases_and_retries.sql` — worker leases, fencing, retries, cancellation/claim RPC behavior and grants.
- `.gitignore` — identified as changed; exact diff **UNKNOWN**.
- `.env.example` — local contents inspected; compared below.
- `.vscode/mcp.json` — local contents inspected; compared below.
- `src/lib/supabase/config.ts` — also listed under production source because it implements runtime configuration behavior.
- `src/lib/supabase/server.ts` — also listed under production source because it consumes that configuration.

### E — Generated screenshots, reports, and build artifacts

The following image files were identified in the prior partial capture and local file listing:

- `todomvc-final.png`
- `audit-results/20261009-131219/studio-unauthenticated.png`
- `audit-results/20261009-131219/login.png`
- `audit-results/20261009-131219/landing.png`
- `audit-results/20261009-131219/landing-mobile-390x844.png`
- `audit-results/20261009-131219/global-assets.png`
- `audit-results/20261009-131219/auth-redirect-login.png`

These are generated audit evidence, not product source. Keep them out of a production commit unless a specific review requires them. The status of other `.next`, `node_modules`, build-output, backup, or temporary paths among the 156 is **UNKNOWN**; their presence/change status was not established.

### F — Local-only configuration or sensitive material

- `.vscode/mcp.json` — local developer tool configuration. No credentials or tokens were observed. Its displayed contents contain two identical top-level JSON objects; if literal, the file is invalid JSON and should be corrected before committing. Whether the duplicate is literal or a display artifact is **UNKNOWN**.
- `.env.example` — no populated sensitive values observed. It contains blank credential fields and public configuration guidance only.
- Local `.env` files, if any, were not inspected and must not be added to a commit. Their existence/status is **UNKNOWN**.
- The worker requires deployment-time Supabase service-role configuration; no such credential value is reproduced in this report.

### G — Deleted files requiring investigation

- `project-structure.txt` — deletion was reported in the earlier UI capture. GitHub’s content endpoint could not read the file because it is an invalid internal symbolic-link target. Removal appears plausibly intentional cleanup of a broken link, but intent is **UNKNOWN**.
- `use-script-workspace-source.txt` — deletion was reported in the earlier UI capture. The GitHub-base copy is a root-level snapshot of screenplay workspace hook code; it appears redundant/older relative to the feature-owned hook, so deletion is plausibly intentional cleanup. Intent is **UNKNOWN**.

The partial capture may contain additional deleted paths; their names and rationale are **UNKNOWN**.

## 2. Production-source comparison and impact

Comparisons below are local working-tree code against GitHub base `75828ec7f668bb064435a6cb68e37ef98eb32a4c`, except where the preview branch is explicitly noted.

| Path(s) | What changed locally | Why it matters / workflows affected | Dependencies and configuration |
|---|---|---|---|
| `src/app/api/ai/generate/route.ts` | Adds bounded request-body parsing, model allowlisting, authenticated-user and production-ownership checks, timeout handling, and safer upstream error/status mapping. | Hardens AI generation against oversized/invalid requests and unauthenticated or cross-production use. Affects AI-assisted production workflows and callers relying on previous request/error behavior. | No new package dependency identified. Uses existing auth/Supabase and AI-provider configuration; required environment keys remain deployment prerequisites. |
| `src/app/api/generation/run/route.ts` | Replaces direct request parsing/dispatch with validation, authenticated caller/RLS-scoped persistence, and persisted-job execution with an atomic queued-job claim. | Changes who can start a generation job and when persistence/dispatch occurs. Affects media-generation creation and retry behavior; client responses may differ. | No new package dependency identified. Requires the existing database schema/RLS and provider configuration used by the job path. |
| `src/platform/generation/dispatch.ts` | Adds bounded deadlines, deterministic provider task IDs/status recovery, and a distinct unknown-provider-outcome path to avoid unsafe automatic retries. | Prevents duplicate paid provider work when a request times out after the provider may have accepted it. Affects generation polling, retries, and job status transitions. | No new package dependency identified. Depends on provider status APIs and persisted job state. |
| `src/platform/generation/providers/kling.provider.ts` | Supports configured API-key or access/secret credentials, provider task status checks, and safer mapping of success/failure/pending results; it does not fabricate output URLs. | Affects Kling image/video generation and recovery of asynchronous jobs. URL-less successful responses remain failures for the current URL-based asset flow. | Uses existing environment variable families `KLING_API_KEY` or `KLING_ACCESS_KEY` plus `KLING_SECRET_KEY`, optional `KLING_API_BASE_URL`; no package dependency identified. |
| `src/platform/generation/providers/openai-image.provider.ts` | Handles OpenAI image requests as URL-based results and treats missing URLs/base64-only responses as a failure rather than inventing a stored asset URL. | Affects image generation; models returning only inline base64 cannot satisfy the current durable-asset workflow. | Requires `OPENAI_API_KEY`; optional `OPENAI_IMAGE_MODEL`. No package dependency identified. |
| `src/lib/supabase/server.ts` and `src/lib/supabase/config.ts` | The local server client uses shared config resolution and reports missing config via a typed error. The local helper also supports server runtime env fallback and a throwing `notConfiguredFetch`. | Affects server-side Supabase initialization, environment handling in tests/deployments, and failure behavior when config is missing. | No package dependency identified. Uses existing public Supabase URL/key and optional server runtime aliases. |
| `src/features/render/services/render-worker-entrypoint.ts` | Local-only worker entrypoint (no file found at GitHub base) bounds concurrency/time/resources, invokes FFmpeg/FFprobe, exposes health endpoints, and handles shutdown. | Enables a separately deployed background rendering worker; affects render-job execution and operational readiness. It is not a normal Next.js request handler. | Requires FFmpeg/FFprobe, Supabase URL and service-role key, worker runtime/deployment configuration, and the matching database schema. No package/deployment manifest changes were verified. |
| Story Bible, scene-extraction, shot-planner, auth, proxy, and remaining render source paths | Exact per-file working diff was not preserved in accessible evidence. | **UNKNOWN.** Do not infer intended behavior or safe commit scope from filenames alone. | **UNKNOWN.** |

### Supabase helper overlap with preview deployment work

At preview commit `8b7c46f1fbdd098dd58a964cd5c9e8a34435ed9b`, `src/lib/supabase/config.ts` exists with URL/host/protocol validation and a deterministic 503 `Response` fallback. The local file at the same path instead adds runtime server environment resolution and throws a typed `SupabaseConfigurationError` from its fallback fetch; its public URL/key resolver does not apply the preview helper’s host validation. The current base commit has no `src/lib/supabase/config.ts`.

This is a concrete same-path overlap, not a simple non-conflicting addition. Reconcile the intended API, host validation, and error semantics before taking both preview and local changes. Do not overwrite one with the other without reviewing the callers.

### GitHub changes and overlap

- The local base SHA was reported as matching GitHub at `75828ec…`; this is based on the prior audit, not a fresh Git status.
- Existing GitHub PR #4 concerns character sync grounded in screenplay context, character extraction, tests, and a migration. Some locally captured scene/character/story-intelligence work could overlap conceptually, but the incomplete local inventory prevents a confirmed path-by-path overlap result. Exact overlap: **UNKNOWN**.
- The preview configuration-helper overlap above is confirmed.
- No complete comparison against all open GitHub changes is possible from the surviving inventory evidence.

## 3. Secret-risk findings

- `.env.example`: **No sensitive values observed.** Credentials are blank; a model setting is documented/commented. The local version comments out `OPENAI_IMAGE_MODEL` and explains URL-returning model requirements. GitHub base had `OPENAI_IMAGE_MODEL=gpt-image-1` active.
- `.vscode/mcp.json`: **No sensitive values observed.** It configures Playwright MCP through `npx`; no credential/token value was observed. The displayed file appears to repeat the same JSON object; validity should be checked before commit.
- No secret values are included in this report.

## 4. Render-worker and Supabase migration changes

The render work is a separate, cross-cutting feature: render job API endpoints, worker services, validation/repository code, tests, two migrations, and architecture/runbook documents. The worker executes FFmpeg/FFprobe and uses Supabase service-role access. The migrations define render job/storage access controls and worker lease/retry/claim operations.

The runbook and ADRs say hosted migration application, storage setup, and worker deployment are not verified/applied. No live database status, deployment status, or test result was verified for this audit. **Do not commit/deploy the worker independently of its matching migrations, grants/RLS, storage configuration, and deployment settings.** Keep this feature in a separate review/commit series from screenplay or generation hardening unless the product release intentionally integrates them.

## 5. Generated, duplicate, experimental, or obsolete changes

- Screenshots listed under E and `todomvc-final.png` are generated artifacts; keep local unless explicitly needed as review evidence.
- `.superpowers/product-integration-repair-progress.md` and the dated repair plan appear task-specific and potentially historical. Treat as local notes unless the team intentionally maintains them.
- `use-script-workspace-source.txt` appears to duplicate an older hook snapshot; deletion is plausibly cleanup, but intent remains unverified.
- `project-structure.txt` appears to be a broken symbolic-link snapshot; deletion is plausibly cleanup, but intent remains unverified.
- `.vscode/mcp.json` is workstation tooling configuration and should generally remain local; verify its apparent duplicated JSON before any use.
- Other duplicate, experimental, or obsolete changes among the uncaptured paths: **UNKNOWN**.

## 6. Commit grouping recommendations

These are conditional candidates, not an endorsement to commit without the missing diffs and tests:

1. **Generation reliability/security:** AI generation route, generation-run persistence path, dispatcher, provider changes, corresponding tests, and only the required Supabase changes. Review request/response compatibility and RLS assumptions together.
2. **Screenplay/Story Bible/character sync:** group related screenplay extraction, provenance, proposal persistence, Story Bible UI/repository, and tests. First compare paths with PR #4 to avoid duplicate or conflicting work.
3. **Render-worker feature:** keep APIs, worker, render repositories/services/tests, migrations, and deployment/runbook configuration together as a distinct integration. Apply only after staging migration/RLS/storage and worker deployment verification.
4. **Documentation:** commit only documentation that matches the selected implementation and remove stale/unverified test claims.
5. **Keep local by default:** screenshots, `todomvc-final.png`, workstation MCP configuration, local environment files, and task-specific progress notes. Do not commit any actual `.env` file.

`README.md`, `.gitignore`, `playwright.config.ts`, `.env.example`, and all source/test changes not described above need exact diff review before declaring them safe candidates. No new dependency was established in the reviewed source changes; dependency-manifest status across all 156 paths is **UNKNOWN**.

## 7. Validation and uncertainty

- No build or test was run.
- No database migration or deployment was performed or verified.
- The inventory is partial; the full 156-path listing and complete per-file A–G classification are **UNKNOWN**.
- Exact diffs for several identified Story Bible, scene-extraction, shot-planner, auth, proxy, render API, test, and documentation paths are **UNKNOWN**.
- Deleted-file intent, local-only file status for paths not captured, and overlap with all GitHub changes are **UNKNOWN**.
- This report should not be used as evidence that the pending changes are safe to stage, commit, or deploy.
