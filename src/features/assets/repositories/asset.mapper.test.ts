import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { toAssetDatabase, toGenerationJobDatabase } from "./asset.mapper";

describe("toAssetDatabase", () => {
  it("omits undefined columns on partial updates", () => {
    const row = toAssetDatabase({ status: "ready", fileUrl: "https://cdn.example/gate.png" });
    assert.deepEqual(row, { file_url: "https://cdn.example/gate.png", status: "ready" });
    assert.equal("title" in row, false);
    assert.equal("production_id" in row, false);
  });

  it("applies create defaults without inventing a file URL", () => {
    const row = toAssetDatabase(
      { productionId: "11111111-1111-4111-8111-111111111111", kind: "image", title: "Harbour still" },
      { includeDefaults: true },
    );
    assert.equal(row.production_id, "11111111-1111-4111-8111-111111111111");
    assert.equal(row.source_kind, "user");
    assert.equal(row.provenance, "user");
    assert.equal("file_url" in row, false);
  });
});

describe("toGenerationJobDatabase", () => {
  it("omits undefined columns so a status update cannot wipe the prompt", () => {
    const row = toGenerationJobDatabase({ status: "failed", errorMessage: "provider timeout" });
    assert.deepEqual(row, { status: "failed", error_message: "provider timeout" });
    assert.equal("prompt" in row, false);
  });
});
