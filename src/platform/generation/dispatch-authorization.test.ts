import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canDispatchPersistedJob } from "./dispatch-authorization";

const job = {
  status: "queued" as const,
  productionId: "production-a",
  assetId: "asset-a",
  provider: undefined,
  parameters: {},
};
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
  it("allows approved running jobs with a provider task ID to be checked", () => {
    assert.equal(
      canDispatchPersistedJob(
        {
          ...job,
          status: "running",
          provider: "kling",
          parameters: { providerJobId: "provider-task-123" },
        },
        asset,
      ),
      true,
    );
  });
  it("allows status checks for jobs that were approved before dispatch", () => {
    assert.equal(
      canDispatchPersistedJob(
        {
          ...job,
          status: "running",
          provider: "kling",
          parameters: { providerJobId: "provider-task-123" },
        },
        { ...asset, userApproved: false },
      ),
      true,
    );
  });
  it("rejects running jobs that cannot be safely checked", () => {
    assert.equal(
      canDispatchPersistedJob(
        { ...job, status: "running", provider: "kling" },
        asset,
      ),
      false,
    );
    assert.equal(
      canDispatchPersistedJob(
        {
          ...job,
          status: "running",
          parameters: { providerJobId: "provider-task-123" },
        },
        asset,
      ),
      false,
    );
  });
});
