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
  selectQueuedJobsForApprovedAssets,
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

  it("only allows generation for asset types supported by the media providers", () => {
    for (const kind of ["audio", "music", "document"] as const) {
      const unsupported = asset({ kind, userApproved: true });
      assert.equal(canGenerateAsset(unsupported), false);
      assert.throws(
        () => draftJobFromAsset(unsupported),
        /currently supported for image and video assets only/,
      );
    }
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
      asset({ id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", kind: "audio" }),
      asset({ id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", kind: "document" }),
    ]);
    assert.equal(drafts.length, 1);
    assert.deepEqual(selectNewJobProposals(drafts, [job({ status: "queued" })]), []);
  });

  it("does not dispatch previously queued jobs for unsupported asset types", () => {
    const unsupportedAsset = asset({ kind: "audio", userApproved: true });
    const unsupportedJob = job({
      assetId: unsupportedAsset.id,
      jobType: "audio",
    });

    assert.deepEqual(
      selectQueuedJobsForApprovedAssets(
        unsupportedAsset.productionId,
        [unsupportedJob],
        [unsupportedAsset],
      ),
      [],
    );
  });

  it("selects persisted queued jobs only for approved assets in the same production", () => {
    const approvedAsset = asset({ userApproved: true });
    const unapprovedAsset = asset({
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      userApproved: false,
    });
    const approvedJob = job();
    const unapprovedJob = job({
      id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      assetId: unapprovedAsset.id,
    });
    const otherProductionJob = job({
      id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      productionId: "99999999-9999-4999-8999-999999999999",
    });
    const activeJob = job({
      id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      status: "running",
    });
    const wrongTypeJob = job({
      id: "12121212-1212-4212-8212-121212121212",
      jobType: "video",
    });

    const selected = selectQueuedJobsForApprovedAssets(
      approvedAsset.productionId,
      [approvedJob, unapprovedJob, otherProductionJob, activeJob, wrongTypeJob],
      [approvedAsset, unapprovedAsset],
    );

    assert.deepEqual(selected.map(({ job: selectedJob }) => selectedJob.id), [approvedJob.id]);
  });
});
