import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canDispatchPersistedJob } from "./dispatch-authorization";

const job = { status: "queued" as const, productionId: "production-a", assetId: "asset-a" };
const asset = { id: "asset-a", productionId: "production-a", userApproved: true };

describe("generation dispatch authorization", () => {
  it("allows queued persisted jobs for approved assets in the same production", () => {
    assert.equal(canDispatchPersistedJob(job, asset), true);
  });
  it("rejects missing, unapproved, or cross-production assets", () => {
    assert.equal(canDispatchPersistedJob(job, null), false);
    assert.equal(canDispatchPersistedJob(job, { ...asset, userApproved: false }), false);
    assert.equal(canDispatchPersistedJob(job, { ...asset, productionId: "other" }), false);
  });
  it("rejects jobs outside the queued state", () => {
    assert.equal(canDispatchPersistedJob({ ...job, status: "failed" }, asset), false);
  });
});
