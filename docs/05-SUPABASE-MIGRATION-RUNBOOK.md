# Supabase Migration & Disaster Recovery Runbook

**Document Version:** 1.0.0<br>
**Target Migrations:**<br>
- `supabase/migrations/202610090001_create_story_bibles.sql`
- `supabase/migrations/202610090002_reconcile_productions.sql`
**Status:** **UNAPPLIED** on hosted environment (Local contract tests verified; awaiting explicit operator authorization and PITR backup).

---

## 1. Safety Principles & Operator Boundaries

1. **AI Advises, Creator Decides:**<br>
   No hosted database modification shall be executed autonomously. Every hosted migration step requires explicit operator invocation and authorization.
2. **Zero Data Loss:**<br>
   Existing creator screenplays, productions, characters, assets, and direction notes must remain fully intact. All migrations are purely additive or non-destructive reconciliations.
3. **Keep Hosted Migrations Unapplied:**<br>
   Migrations remain in repository form until all pre-flight gates and physical/logical backups are verified.

---

## 2. Backup & Disaster Recovery Options

Prior to applying any migration to the hosted Supabase environment, the operator must select and verify at least one of the following recovery options:

### Option A: Supabase Point-in-Time Recovery (PITR) — Recommended for Production
- **Applicability:** Supabase Pro tier or higher with PITR enabled.
- **Recovery Window:** Up to 7 or 30 days of continuous write-ahead log (WAL) archiving.
- **Procedure:**
  1. Open Supabase Dashboard -> **Project Settings** -> **Database** -> **Backups**.
  2. Confirm PITR status is active and note the exact timestamp before starting execution: `T_START = $(date -u +"%Y-%m-%dT%H:%M:%SZ")`.
  3. If an unrecoverable migration failure occurs, use the Supabase Dashboard to restore the database to `T_START` or create a point-in-time clone project to inspect recovered records.

### Option B: Logical Snapshot via `pg_dump` — Mandatory Baseline
- **Applicability:** All tiers, accessible via direct connection string or connection pooling port 5432/6543.
- **Pre-migration Command:**
  ```bash
  # Execute from a secure terminal with DB credentials
  pg_dump -h db.<PROJECT_REF>.supabase.co \
          -U postgres \
          -p 5432 \
          -d postgres \
          -F c \
          -b \
          -v \
          -f "pre_migration_backup_$(date +%Y%m%d_%H%M%S).dump"
  ```
- **Verification Command:**
  ```bash
  pg_restore -l "pre_migration_backup_$(date +%Y%m%d_%H%M%S).dump" | head -n 30
  ```
- **Recovery Procedure (Full Restore):**
  ```bash
  pg_restore -h db.<PROJECT_REF>.supabase.co \
             -U postgres \
             -p 5432 \
             -d postgres \
             --clean \
             --if-exists \
             "pre_migration_backup_YYYYMMDD_HHMMSS.dump"
  ```

---

## 3. Migration Plan: Step-by-Step Execution

### Pre-Flight Verification Queries (Read-Only)
Run the following SQL queries to inspect existing hosted schema without mutating data:

```sql
-- 1. Check if story_bibles already exists in any shape
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'story_bibles'
ORDER BY ordinal_position;

-- 2. Check current columns on productions table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'productions'
ORDER BY ordinal_position;

-- 3. Check for any orphan productions without owner_id
SELECT count(*) AS orphan_productions
FROM public.productions
WHERE owner_id IS NULL;
```

---

### Phase 1: Reconcile Productions Root Schema (`202610090002_reconcile_productions.sql`)

**Rationale:** `story_bibles` depends on `productions(id)` foreign key; therefore, the productions table must be reconciled first.

1. **Open Transaction:**
   ```sql
   BEGIN;
   ```
2. **Execute Migration:**
   Apply `supabase/migrations/202610090002_reconcile_productions.sql`:
   - Adds `created_by`, `target_duration_seconds`, `cover_image_url`, `last_opened_at`, `deleted_at`.
   - Backfills `created_by` from existing `owner_id`.
   - Safely migrates legacy `cover_image` to `cover_image_url` if present.
   - Enforces `created_by` foreign key to `auth.users(id)`.
   - Creates index on `(owner_id, deleted_at, updated_at DESC)`.
   - Updates RLS update policy for owner validation.
3. **Verify Reconciliation:**
   ```sql
   SELECT id, title, created_by, owner_id, target_duration_seconds, cover_image_url
   FROM public.productions
   LIMIT 5;
   ```
4. **Commit:**
   ```sql
   COMMIT;
   ```

---

### Phase 2: Create / Reconcile Story Bibles Schema (`202610090001_create_story_bibles.sql`)

1. **Open Transaction:**
   ```sql
   BEGIN;
   ```
2. **Execute Migration:**
   Apply `supabase/migrations/202610090001_create_story_bibles.sql`:
   - Ensures `pgcrypto` extension for UUID generation.
   - Creates `story_bibles` table with full narrative, foundation, and AI-context fields.
   - Applies additive `ALTER TABLE ADD COLUMN IF NOT EXISTS` for partially provisioned legacy tables.
   - Populates default values for missing columns without modifying existing authored text.
   - Enforces unique constraint: exactly one Story Bible per production (`CONSTRAINT story_bibles_production_id_unique UNIQUE (production_id)`).
   - Establishes RLS policies ensuring only the production owner can SELECT, INSERT, UPDATE, or DELETE the Story Bible.
3. **Verify Integrity & RLS:**
   ```sql
   -- Verify table presence and constraints
   SELECT conname, contype
   FROM pg_constraint
   WHERE conrelid = 'public.story_bibles'::regclass;

   -- Verify RLS policies
   SELECT policyname, cmd, qual, with_check
   FROM pg_policies
   WHERE tablename = 'story_bibles';
   ```
4. **Commit:**
   ```sql
   COMMIT;
   ```

---

## 4. Post-Migration Application Verification

After applying both migrations in the isolated or hosted target:
1. **Run Application Contract Tests:**
   ```bash
   node --experimental-strip-types --experimental-loader ./scripts/ts-test-loader.mjs --test src/features/story-bible/repositories/story-bible-migration.test.ts src/features/productions/repositories/production-migration.test.ts
   ```
2. **Execute Full Automated Quality Gates:**
   - `npm test`
   - `npm run typecheck`
   - `npm run lint`
   - `npm run build`
   - `npx playwright test`
3. **Verify in Browser (Playwright):**
   - Access production Story Bible editor as production owner.
   - Verify all fields populate correctly.
   - Verify unauthenticated visitor or foreign owner is denied access with 404/redirect.

---

## 5. Rollback Procedures (If Migration Fails)

In the event of an unforeseen constraint violation or failure during phase execution:

### Rollback Phase 2 (`story_bibles`):
If `story_bibles` was created during this migration and was previously absent:
```sql
DROP TABLE IF EXISTS public.story_bibles CASCADE;
```
If `story_bibles` was already partially provisioned and updated, restore from the pre-migration `pg_dump` snapshot or PITR backup rather than dropping table.

### Rollback Phase 1 (`productions` column reconciliation):
```sql
ALTER TABLE public.productions
    DROP CONSTRAINT IF EXISTS productions_created_by_fkey;

DROP INDEX IF EXISTS public.productions_owner_deleted_updated_idx;

-- Note: Dropping columns should only be done if no data was written post-migration:
-- ALTER TABLE public.productions DROP COLUMN IF EXISTS created_by;
-- ALTER TABLE public.productions DROP COLUMN IF EXISTS target_duration_seconds;
-- ALTER TABLE public.productions DROP COLUMN IF EXISTS cover_image_url;
-- ALTER TABLE public.productions DROP COLUMN IF EXISTS last_opened_at;
-- ALTER TABLE public.productions DROP COLUMN IF EXISTS deleted_at;
```

---

## 6. Render Worker Staging Migration and Recovery

The render-job migrations depend on the previously applied `productions` and `render_sequences` tables. They have not been applied to hosted Supabase:

1. Confirm the staging project reference and confirm that `20260627131515_create_productions.sql` and `202609280003_create_render_and_export_tables.sql` are present in its migration history.
2. Review `202611020001_create_video_render_jobs.sql` and `202611020002_render_worker_leases_and_retries.sql`; the first creates the private job/storage schema, the second adds fenced lease, retry, cancellation, and ownership-checked RPCs.
3. Take a staging database backup and verify it is readable. Record the current migration list and check the production/render foreign keys, table grants, RLS policies, storage bucket privacy, RPC grants, and indexes.
4. In a staging-only checkout linked to the staging project, run `supabase migration list --linked` and `supabase db push --dry-run`. Have an operator review the exact pending migration list before applying anything.
5. After explicit staging approval, apply only the two render migrations. Verify the resulting table constraints and indexes, and invoke claim/heartbeat/fail/retry/cancel RPCs with staging fixtures and owner/service-role identities. Do not copy production data into fixtures.
6. Deploy the worker to staging only after the migration checks pass. Keep `SUPABASE_SERVICE_ROLE_KEY` in a server-side secret manager, limit egress to the required Supabase endpoints and public HTTPS media sources, and set CPU, memory, disk, input, and job-duration limits.
7. Exercise duplicate claims, lease expiry after worker termination, automatic backoff, cancellation, upload failure, private storage, and signed playback. Verify that a different production owner cannot read, cancel, retry, sign, or play the render.

### Local render migration verification (not executed in this environment)

The local Supabase CLI is available, but this machine has no Docker executable/daemon, no standalone `psql` or PostgreSQL server tools, and no listener on the configured local database port. Therefore neither render migration has been applied or executed here. Do not substitute a linked or hosted database.

When Docker is available, perform this only against a disposable local Supabase project:

1. Confirm the Docker daemon is healthy with `docker info`, then start the local stack with `npx supabase start`.
2. Reset only the local database and replay every repository migration in filename order with `npx supabase db reset --local --no-seed`. Confirm both `202611020001_create_video_render_jobs.sql` and `202611020002_render_worker_leases_and_retries.sql` appear in the local migration history. Do not use `--linked` or `--db-url`.
3. Execute the catalog, index, RLS, storage-bucket and grant assertions with `npx supabase db query --local --file supabase/tests/render_worker_schema.sql`. The command must exit successfully; the script rolls back and creates no fixtures.
4. Create a disposable local owner, production, approved render sequence and one queued render job through the local Studio/API. Stop all local render workers before the manual claim-race check.
5. In two independent local SQL sessions, begin a transaction in each and call `public.claim_video_render_job` as `service_role`, using distinct worker UUIDs and the same 15-second lease. Keep session A open after it returns the job. Session B must return no row while A holds the claim. Commit A and confirm only one attempt was consumed.
6. In session A, record the returned lease token; verify `heartbeat_video_render_job` extends a live lease. To simulate an abruptly terminated worker without waiting, expire only this disposable row’s lease using a privileged local SQL session. The first claim call must recover it and schedule backoff; after the calculated delay (5 seconds after attempt 1), a second worker may claim it with a new token. Calls to progress, complete, fail and release using the old token must return no row and leave the new lease unchanged.
7. Cancel a running job as its owner using the authenticated role and the local owner’s JWT subject. Verify cancellation is requested, then verify the active lease cannot complete the job and the next worker heartbeat/claim observes cancellation. For retry coverage, fail a separate job as retryable, verify the 5-second first backoff and incremented attempt, then repeat until `max_attempts`; the exhausted job must not be claimable or owner-retryable.
8. For process-restart behavior, run two local workers against the local database, submit a render that remains active long enough to capture its worker PID and lease token, and terminate only that identified worker process without a graceful signal. Verify lease recovery, duplicate-claim prevention and stale-token fencing using the steps above. Repeat with a graceful SIGINT/SIGTERM and verify the worker releases its own active lease and removes its job scratch directory.
9. After verification, stop the local stack with `npx supabase stop`. All fixtures and resets must remain confined to this disposable local project.

The catalog assertions do not prove transaction races or worker-process recovery. Those require the separate-session and worker tests above; record their output before considering the migration ready for staging.

### Staging recovery

- Stop the staging worker first; do not delete the render table or storage bucket as a rollback shortcut.
- Existing queued/running jobs remain durable. Restart the worker after the database is healthy; expired leases are recovered by the next atomic claim. Review attempts and retryable failure codes before allowing retries to continue.
- If an RPC or schema defect is found, keep workers stopped, preserve job rows and private objects, and use a forward corrective migration after review. Restore the staging backup only if data integrity cannot be recovered safely with a forward fix.
- Reconcile orphaned lease-specific storage objects using a reviewed staging-only report. Do not run broad deletes or apply any of these migrations to production without separate explicit approval.
