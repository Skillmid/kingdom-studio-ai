# SDD ledger — plan: docs/superpowers/plans/2026-10-09-product-integration-repair.md

Baseline: branch `codex/character-ai-profile-sync-integration`, HEAD `d0c4ba0188bf33c01ae249756c3b996d1f7bb351`, 78 pre-existing changed paths, no staged files. Existing user changes preserved.

Pre-flight: Task 1 to 2 share the user-scoped Supabase SSR client only; current `createClient()` is available and the cookie-backed client is the authority. Task 3 consumes Task 1 route guard and existing production context; retain RLS filtering. Task 4 reuses current asset services/repositories. Task 5 depends on all prior findings.

Ruling: Keep work in the existing feature branch/worktree because the user explicitly requires preserving and continuing its substantial uncommitted implementation; do not create a clean worktree that could hide/overwrite it.
Ruling: The user explicitly requires uninterrupted native implementation, so this plan is executed inline rather than stopping for plan review.

Task 1: implemented. Signed-out Studio redirects pass focused E2E. Owner/foreign-owner browser cases remain blocked on an isolated authenticated Supabase environment.
Task 2: migrations and static contracts implemented for Story Bible and production root schema. Postgres runtime assertions were added but not executed; no migrations applied.
Task 3: server-side workspace preload/ownership implemented; dynamic authenticated save/reload E2E remains unverified because test environment has no usable authenticated Supabase session.
Task 4: global Assets now routes to production-scoped assets; generic AI Director global landing remains a navigation shell as documented.
Task 5: docs and audits reconciled. npm test: 8 import + 268 suite pass; typecheck, lint, build and diff check pass. Full E2E remains 12 pass/30 fail due test fixture/auth boundary. No hosted changes, commits, or pushes.
Status: implementation complete to the safe limit of the available environment; release acceptance is blocked on isolated Postgres/Supabase verification and authenticated E2E fixtures. Preserve this ledger and continue when that environment is available.
