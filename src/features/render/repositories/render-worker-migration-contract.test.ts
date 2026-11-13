import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, it } from "node:test";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "202611020002_render_worker_leases_and_retries.sql",
);
const jobSchemaPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "202611020001_create_video_render_jobs.sql",
);

describe("render worker migration contract", () => {
  it("uses row locks and lease tokens to fence concurrent workers", async () => {
    const sql = await readFile(migrationPath, "utf8");
    assert.match(sql, /FOR UPDATE SKIP LOCKED/i);
    assert.match(sql, /lease_token\s*=\s*p_lease_token/i);
    assert.match(sql, /lease_expires_at\s*>\s*timezone\('utc', now\(\)\)/i);
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.complete_video_render_job/i);
    assert.match(sql, /AND status = 'running'/i);
  });

  it("recovers expired leases, enforces retry caps, and applies capped exponential backoff", async () => {
    const sql = await readFile(migrationPath, "utf8");
    assert.match(sql, /lease_expires_at <= timezone\('utc', now\(\)\)/i);
    assert.match(sql, /attempts < max_attempts/i);
    assert.match(sql, /LEAST\(900, 5 \* power\(2, GREATEST\(0, attempts - 1\)\)\)/i);
    assert.match(sql, /cancel_requested[\s\S]*?status = 'cancelled'/i);
  });

  it("restricts worker RPCs to service_role and user actions to authenticated owners", async () => {
    const sql = await readFile(migrationPath, "utf8");
    const schema = await readFile(jobSchemaPath, "utf8");
    assert.match(schema, /GRANT SELECT, INSERT ON TABLE public\.video_render_jobs TO authenticated/i);
    assert.match(schema, /GRANT SELECT ON TABLE public\.video_render_jobs TO service_role/i);
    assert.match(schema, /REVOKE ALL ON TABLE public\.video_render_jobs FROM PUBLIC, anon/i);
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.claim_video_render_job[\s\S]*?FROM PUBLIC, anon, authenticated/i);
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.claim_video_render_job[\s\S]*?TO service_role/i);
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.cancel_video_render_job[\s\S]*?TO authenticated/i);
    assert.match(sql, /production\.owner_id = auth\.uid\(\)/i);
  });

  it("binds completed storage metadata to the owning job and current lease", async () => {
    const [schema, sql] = await Promise.all([
      readFile(jobSchemaPath, "utf8"),
      readFile(migrationPath, "utf8"),
    ]);
    assert.match(schema, /video_render_jobs_storage_key_shape/i);
    assert.match(schema, /video_render_jobs_storage_url_matches_key/i);
    assert.match(sql, /p_storage_key = 'productions\/' \|\| production_id::text \|\| '\/renders\/' \|\| id::text/i);
    assert.match(sql, /p_storage_url IN \('storage:\/\/' \|\| p_storage_key, 'local:\/\/' \|\| p_storage_key\)/i);
  });
});
