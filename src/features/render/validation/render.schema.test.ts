import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { exportPackageSchema, renderClipSchema, renderSequenceSchema } from "./render.schema";

const productionId = "11111111-1111-4111-8111-111111111111";

describe("renderClipSchema", () => {
  it("accepts a generic sequenced clip", () => {
    const result = renderClipSchema.safeParse({
      productionId,
      sequenceNumber: 1,
      title: "Harbour wide",
      sourceKind: "shot",
      sourceId: "22222222-2222-4222-8222-222222222222",
    });
    assert.equal(result.success, true);
  });

  it("rejects a zero sequence number and unknown source kind", () => {
    const result = renderClipSchema.safeParse({
      productionId: "not-a-uuid",
      sequenceNumber: 0,
      sourceKind: "theme-song",
    });
    assert.equal(result.success, false);
  });
});

describe("renderSequenceSchema", () => {
  it("accepts a production sequence payload", () => {
    const result = renderSequenceSchema.safeParse({
      productionId,
      title: "Assembly cut",
      itemCount: 3,
      readyItemCount: 1,
      missingMediaCount: 2,
      totalDurationSeconds: 12,
    });
    assert.equal(result.success, true);
  });
});

describe("exportPackageSchema", () => {
  it("rejects an unknown export format", () => {
    const result = exportPackageSchema.safeParse({
      productionId,
      format: "final-cut-xml",
    });
    assert.equal(result.success, false);
  });
});
