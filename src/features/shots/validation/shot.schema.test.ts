import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { shotSchema } from "./shot.schema";

describe("shotSchema", () => {
  it("accepts a generic valid shot payload", () => {
    const result = shotSchema.safeParse({
      productionId: "11111111-1111-4111-8111-111111111111",
      sceneId: "22222222-2222-4222-8222-222222222222",
      shotNumber: 2,
      shotType: "close-up",
      framing: "CU",
      subject: "Harbour clerk",
      action: "Checks the ledger",
    });

    assert.equal(result.success, true);
  });

  it("rejects an invalid shot number and unknown shot type", () => {
    const result = shotSchema.safeParse({
      productionId: "not-a-uuid",
      shotNumber: 0,
      shotType: "hero-insert",
      framing: "MS",
    });

    assert.equal(result.success, false);
  });
});
