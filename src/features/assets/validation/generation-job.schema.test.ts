import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { generationJobSchema } from "./generation-job.schema";

describe("generationJobSchema", () => {
  it("accepts a queued image job", () => {
    const result = generationJobSchema.safeParse({
      productionId: "11111111-1111-4111-8111-111111111111",
      assetId: "22222222-2222-4222-8222-222222222222",
      jobType: "image",
      prompt: "CU of a harbour clerk at dawn.",
      status: "queued",
    });
    assert.equal(result.success, true);
  });

  it("rejects an unknown job status", () => {
    const result = generationJobSchema.safeParse({
      productionId: "11111111-1111-4111-8111-111111111111",
      status: "done",
    });
    assert.equal(result.success, false);
  });
});
