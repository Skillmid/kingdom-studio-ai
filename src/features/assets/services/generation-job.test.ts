import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  UNCONFIGURED_PROVIDER_ERROR,
  applyJobResultToAsset,
  completeJob,
  dispatchUnconfiguredProvider,
  draftJobFromAsset,
  canGenerateAsset,
  planJobsFromAssets,
  selectNewJobProposals,
  startJob,
} from "./generation-job";
import type { Asset } from "../types/asset";
import type { GenerationJob } from "../types/generation-job";

const NOW = "2026-09-28T00:00:00.000Z";

function asset(partial: Partial<Asset> = {}): Asset {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    productionId: "11111111-1111-4111-8111-111111111111",
    kind: "character-reference",
    title: "Harbour Clerk reference",
    prompt: "Character reference still of Harbour Clerk in a salt-stained coat.",
    sourceKind: "character",
    provenance: "production-derived",
    userApproved: false,
    status: "draft",
    progress: 40,
    createdAt: NOW,
    updatedAt: NOW,
    ...partial,
  };
}

function job(partial: Partial<GenerationJob> = {}): GenerationJob {
  return {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    productionId: "11111111-1111-4111-8111-111111111111",
    assetId: asset().id,
    jobType: "image",
    status: "queued",
    prompt: asset().prompt,
    parameters: {},
    attemptCount: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...partial,
  };
}

describe("generation job lifecycle", () => {
  it("requires creator approval and a grounded prompt before generation", () => {
    assert.equal(canGenerateAsset(asset({ userApproved: false })), false);
    assert.equal(canGenerateAsset(asset({ userApproved: true, prompt: " " })), false);
    assert.equal(canGenerateAsset(asset({ userApproved: true })), true);
  });

  it("drafts an image job and refuses an empty prompt", () => {
    const draft = draftJobFromAsset(asset());
    assert.equal(draft.jobType, "image");
    assert.throws(() => draftJobFromAsset(asset({ prompt: "   " })), /requires a prompt/);
  });

  it("completes only with a provider URL and fails recoverably when unconfigured", () => {
    const completed = completeJob(startJob(job(), NOW), "https://cdn.example/clerk.png", NOW);
    assert.equal(completed.outputUrl, "https://cdn.example/clerk.png");
    const failed = dispatchUnconfiguredProvider(job());
    assert.equal(failed.status, "failed");
    assert.equal(failed.outputUrl, undefined);
    assert.equal(failed.errorMessage, UNCONFIGURED_PROVIDER_ERROR);
  });

  it("applies job results without fabricating media", () => {
    const ready = applyJobResultToAsset(asset(), { status: "completed", outputUrl: "https://cdn.example/clerk.png" });
    assert.equal(ready.status, "ready");
    const failed = applyJobResultToAsset(asset(), { status: "failed", errorMessage: UNCONFIGURED_PROVIDER_ERROR });
    assert.equal(failed.fileUrl, undefined);
  });
});

describe("planJobsFromAssets", () => {
  it("skips files, generating assets, and active jobs", () => {
    const drafts = planJobsFromAssets([
      asset(),
      asset({ id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", fileUrl: "https://cdn.example/existing.png" }),
    ]);
    assert.equal(drafts.length, 1);
    assert.deepEqual(selectNewJobProposals(drafts, [job({ status: "queued" })]), []);
  });
});
