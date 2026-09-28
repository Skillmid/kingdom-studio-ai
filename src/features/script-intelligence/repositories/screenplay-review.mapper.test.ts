import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toScreenplayReviewDatabase } from "./screenplay-review.mapper";

describe("screenplay focused-review persistence mapper", () => {
  it("stores a review with the requested review type and exact revision provenance", () => {
    const review = {
      type: "dialogue" as const,
      summary: "Two voices remain distinct.",
      score: 82,
      issues: [],
      createdAt: "2026-09-28T10:00:00.000Z",
    };
    const row = toScreenplayReviewDatabase({
      productionId: "production-id",
      screenplayId: "screenplay-id",
      revisionId: "revision-id",
      screenplayVersion: 4,
      reviewType: "dialogue",
      review,
    });

    assert.equal(row.production_id, "production-id");
    assert.equal(row.screenplay_id, "screenplay-id");
    assert.equal(row.revision_id, "revision-id");
    assert.equal(row.screenplay_version, 4);
    assert.equal(row.review_type, "dialogue");
    assert.deepEqual(row.review, review);
  });
});
