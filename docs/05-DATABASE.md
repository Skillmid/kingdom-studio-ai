# Database and Migration Guide

**Status:** Repository schema reference; hosted migration history is unverified.
**Database:** Supabase Postgres with authenticated user sessions and row-level security (RLS).

## Data model

Every screenplay-driven artifact is scoped to a `productions` row. `productions.owner_id` references `auth.users.id`; child-table access policies derive ownership through the parent production.

```text
Auth user
└── productions
    ├── story_bibles
    ├── screenplays ── screenplay_revisions
    ├── screenplay_analyses / screenplay_reviews
    ├── scenes ── locations
    ├── characters
    ├── shots ── storyboard_panels
    ├── director_notes
    ├── assets ── generation_jobs
    └── render_sequences ── render_clips
        └── export_packages
```

The exact foreign keys vary by workflow. Consult the migration before changing a relationship; a diagram does not replace the SQL contract.

## Tables in the checked-in migrations

| Tables | Purpose |
|---|---|
| `productions` | Root owner-scoped filmmaking project. |
| `screenplays`, `screenplay_revisions` | Current screenplay and immutable revision snapshots. |
| `screenplay_analyses`, `screenplay_reviews` | Analysis and review results associated with productions/screenplays. |
| `scenes`, `locations`, `characters` | Production story entities; later migrations add screenplay provenance and detail fields. |
| `shots`, `storyboard_panels`, `director_notes` | Scene planning, visual boards, and director guidance. |
| `assets`, `generation_jobs` | Production media metadata and persisted generation state. |
| `render_sequences`, `render_clips`, `export_packages` | Render/edit planning and delivery-manifest metadata. |
| `story_bibles` | One creator-reviewed story foundation per production; base/reconciliation migration was added on 2026-10-09 and is **not yet applied or database-engine validated**. |

Migration files are ordered by their timestamped filenames under `supabase/migrations/`. The current repository includes the production, screenplay, scene/location, analysis/review, character provenance, shot/storyboard/director note, asset/job, render/export, and Story Bible migrations. The hosted project's migration history and exact live schema were not confirmed during this repair.

## Authentication and RLS

- Browser operations use the public publishable key with the user's Supabase session.
- Server routes use the cookie-aware client in `src/lib/supabase/server.ts`.
- `src/proxy.ts` refreshes Supabase session cookies on Studio requests. Server layouts verify JWT claims before rendering, and production workspace lookup checks the production through the user's RLS-scoped client and verifies `owner_id`.
- Child-row RLS policies should authorize through the referenced production. For any new table, provide policies for each required operation and ensure updates validate both the old and new parent relationship.
- Never put service-role credentials in browser code. The audited routes did not need them.

RLS in repository migrations is not proof of the live database's policy state. Verify the live policies and migration history with read-only database inspection before release.

## Story Bible schema

`src/features/story-bible/validation/story-bible.schema.ts` is the application DTO contract. Migration `202610090001_create_story_bibles.sql` creates/reconciles its persisted fields and includes:

- a UUID row identifier;
- required `production_id` referencing `productions(id)` with `ON DELETE CASCADE`;
- a unique production relationship (one Story Bible per production);
- title, narrative, creator-foundation, creative-direction, and AI-context fields;
- timestamps and the existing `update_updated_at_column()` trigger;
- RLS select/insert/update/delete policies requiring ownership of the production.

The migration preserves existing authored values, fills only missing defaultable fields, and raises explicit errors for legacy rows without a production or duplicate Story Bibles per production. Such rows need a reviewed manual reconciliation; the migration does not delete or guess at ownership.

A static migration contract test checks that each DTO field and ownership rule appears in the SQL. It does **not** execute Postgres DDL. The environment had no Docker or `psql`; the Supabase CLI schema-only inspection attempt did not return, so this migration remains unverified against clean Postgres and the hosted schema. Do not mark it applied or push it to a hosted/production database until both upgrade and clean-install paths are tested.

`supabase/tests/story_bibles_schema.sql` adds runtime catalog assertions for the columns, production FK, uniqueness, RLS enablement, and owner policies. Run it with `supabase test db` after migrations in an isolated local/test database; it has not been executed in this environment.

## Production root schema reconciliation

Migration `202610090002_reconcile_productions.sql` adds the production fields currently used by the repository (`created_by`, `target_duration_seconds`, `cover_image_url`, `deleted_at`, and `last_opened_at`). It backfills only null `created_by` values from `owner_id`, sets a zero duration default for legacy rows, and copies the legacy `cover_image` value only into an empty new URL field. It does not remove legacy columns or records. The migration makes `created_by` required and references `auth.users`; existing rows without a valid owner will cause a failure for manual review.

`supabase/tests/productions_schema.sql` checks the fields, owner foreign key, RLS, and owner-scoped SELECT/INSERT/UPDATE/DELETE policies. This test has not been run against Postgres. The migration's runtime behavior and compatibility with the hosted schema remain unverified.

## Safe migration workflow

1. Inspect the current supported migration set and the target database schema/history using read-only access.
2. Back up a non-production database or use an isolated test project with no user data.
3. Apply migrations to a clean local/isolated database; verify constraints, indexes, RLS, and representative repository reads/writes.
4. Test upgrades from the supported existing schema, including any legacy Story Bible records. Resolve any explicit migration exception without deleting approved content.
5. Review the SQL diff and migration plan. Apply to hosted environments only through the project's approved release process.
6. Verify application persistence and owner/foreign-owner access after migration.

`supabase db push` is not a substitute for review or a production rollout plan.

## Render and media persistence boundary

The render/export tables and planner currently describe sequences, clips, missing-media readiness, and manifest/package metadata. The audited implementation did not demonstrate a video encoder or retrievable hosted output. Treat these records as render/export planning until an actual stored output and authorized retrieval path is implemented and verified.
