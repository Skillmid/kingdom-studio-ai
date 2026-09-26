import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assetSchema } from "./asset.schema";
import { generationJobSchema } from "./generation-job.schema";

describe("assetSchema", () => {
  it("accepts a generic production-derived asset", () => {
    const result = assetSchema.safeParse({
      productionId: "11111111-1111-4111-8111-111111111111",
      kind: "character-reference",
      title: "Harbour Clerk",
      sourceKind: "character",
      sourceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      provenance: "production-derived",
    });

    assert.equal(result.success, true);
  });

  it("rejects an unknown kind and an invalid production id", () => {
    const result = assetSchema.safeParse({
      productionId: "not-a-uuid",
      kind: "spaceship",
      sourceKind: "user",
    });

    assert.equal(result.success, false);
  });
});

describe("generationJobSchema", () => {
  it("defaults a queued job with empty parameters", () => {
    const result = generationJobSchema.safeParse({
      productionId: "11111111-1111-4111-8111-111111111111",
      jobType: "image",
      prompt: "Close-up of an open harbour ledger at dawn.",
    });

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.status, "queued");
      assert.deepEqual(result.data.parameters, {});
    }
  });

  it("rejects an invalid job type", () => {
    const result = generationJobSchema.safeParse({
      productionId: "11111111-1111-4111-8111-111111111111",
      jobType: "teleport",
    });

    assert.equal(result.success, false);
  });
});
