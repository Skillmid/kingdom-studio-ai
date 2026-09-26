import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assetSchema } from "./asset.schema";

describe("assetSchema", () => {
  it("accepts a generic valid asset", () => {
    const result = assetSchema.safeParse({
      productionId: "11111111-1111-4111-8111-111111111111",
      assetNumber: 1,
      title: "Harbour clerk reference",
      assetType: "character-reference",
      description: "Ink-stained cuffs and a wool coat.",
    });
    assert.equal(result.success, true);
  });

  it("rejects an invalid asset number", () => {
    const result = assetSchema.safeParse({
      productionId: "not-a-uuid",
      assetNumber: 0,
    });
    assert.equal(result.success, false);
  });
});
