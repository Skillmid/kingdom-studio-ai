import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const migrationPath = "supabase/migrations/202610090002_reconcile_productions.sql";

describe("production schema reconciliation migration", () => {
  it("adds repository-required fields and preserves legacy owner and cover values", () => {
    const sql = readFileSync(migrationPath, "utf8").toLowerCase();

    assert.match(sql, /add column if not exists created_by uuid/);
    assert.match(sql, /set created_by\s*=\s*owner_id/);
    assert.match(sql, /references auth\.users\s*\(id\)/);
    assert.match(sql, /add column if not exists target_duration_seconds integer/);
    assert.match(sql, /add column if not exists cover_image_url text/);
    assert.match(sql, /set cover_image_url\s*=\s*cover_image\s*where cover_image_url is null and cover_image is not null/);
    assert.match(sql, /add column if not exists last_opened_at timestamptz/);
    assert.match(sql, /add column if not exists deleted_at timestamptz/);
    assert.match(sql, /productions_owner_deleted_updated_idx/);
    assert.match(sql, /with check\s*\(auth\.uid\(\)\s*=\s*owner_id\)/);
  });
});
