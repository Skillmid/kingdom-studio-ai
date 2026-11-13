import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { storyBibleSchema } from "../validation/story-bible.schema";

const migrationPath = "supabase/migrations/202610090001_create_story_bibles.sql";

describe("Story Bible migration contract", () => {
  it("creates every persisted Story Bible DTO field and enforces production ownership", () => {
    const sql = readFileSync(migrationPath, "utf8").toLowerCase();
    const dtoFields = Object.keys(storyBibleSchema.shape);

    assert.match(sql, /create table if not exists public\.story_bibles/);
    for (const field of dtoFields) {
      assert.match(sql, new RegExp(`\\b${field}\\b`), `missing DTO field: ${field}`);
    }
    assert.match(sql, /references public\.productions\s*\(id\)\s*on delete cascade/);
    assert.match(sql, /unique index[^;]*story_bibles_production_id/);
    assert.match(sql, /enable row level security/);
    assert.match(sql, /drop policy if exists "users can manage story bibles of their productions"/);
    assert.match(sql, /productions\.owner_id\s*=\s*auth\.uid\(\)/);
    assert.match(sql, /for select/);
    assert.match(sql, /for insert/);
    assert.match(sql, /for update/);
    assert.match(sql, /for delete/);
  });
});
