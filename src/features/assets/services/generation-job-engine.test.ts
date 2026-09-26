import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AssetProposal } from "../types/asset";
import {
  applyCompletedJobToAsset,
  canTransitionJob,
  isRecoverableJob,
  planJobsFromAssets,
  selectNewJobProposals,
  transitionJob,
} from "./generation-job-engine";

const PRODUCTION_ID = "11111111-1111-4111-8111-111111111111";
const ASSET_ID = "22222222-2222-4222-8222-222222222222";

function asset(partial: Partial<AssetProposal> & { id?: string } = {}): AssetProposal & { id?: string } {
  return {
    productionId: PRODUCTION_ID,
    assetNumber: 1,
    title: "Radio operator reference",
    assetType: "character-reference",
    generationPrompt: "Character reference still of a radio operator in a wool jumper.",
    characterIds: [],
    provenance: "production-derived",
    userApproved: false,
    status: "draft",
    progress: 50,
    ...partial,
  };
}

describe("planJobsFromAssets", () => {
  it("queues jobs only for assets that have a prompt and no file", () => {
    const jobs = planJobsFromAssets([
      asset({ id: ASSET_ID }),
      asset({ id: "33333333-3333-4333-8333-333333333333", generationPrompt: "Should not queue", fileUrl: "https://cdn.example/still.jpg" }),
      asset({ id: "44444444-4444-4444-8444-444444444444", generationPrompt: undefined }),
    ]);
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0]?.assetId, ASSET_ID);
    assert.equal(jobs[0]?.status, "queued");
    assert.equal(jobs[0]?.jobType, "image");
    assert.match(jobs[0]?.prompt ?? "", /wool jumper/i);
    assert.equal(/Michael|Esther|Tunde|Kunle|The Message/i.test(JSON.stringify(jobs)), false);
  });

  it("does not invent an output URL while planning", () => {
    const jobs = planJobsFromAssets([asset({ id: ASSET_ID })]);
    assert.equal(jobs[0]?.outputUrl, undefined);
    assert.equal(jobs[0]?.errorMessage, undefined);
  });
});

describe("selectNewJobProposals", () => {
  it("skips assets that already have a queued, running, or completed job", () => {
    const proposals = planJobsFromAssets([asset({ id: ASSET_ID })]);
    const selected = selectNewJobProposals(proposals, [{ assetId: ASSET_ID, status: "completed", prompt: "existing" }]);
    assert.equal(selected.length, 0);
  });

  it("allows a new job after failure so generation is recoverable", () => {
    const proposals = planJobsFromAssets([asset({ id: ASSET_ID })]);
    const selected = selectNewJobProposals(proposals, [{ assetId: ASSET_ID, status: "failed", prompt: "previous attempt" }]);
    assert.equal(selected.length, 1);
  });
});

describe("transitionJob", () => {
  it("moves queued to running and increments attempts", () => {
    const next = transitionJob({ status: "queued" as const, attemptCount: 0 }, "running", { now: "2026-09-26T12:00:00.000Z" });
    assert.equal(next.status, "running");
    assert.equal(next.attemptCount, 1);
    assert.equal(next.startedAt, "2026-09-26T12:00:00.000Z");
  });

  it("records failure without dropping recoverability", () => {
    const failed = transitionJob({ status: "running" as const, attemptCount: 1 }, "failed", {
      errorMessage: "Provider timeout.", now: "2026-09-26T12:01:00.000Z",
    });
    assert.equal(failed.status, "failed");
    assert.equal(failed.errorMessage, "Provider timeout.");
    assert.equal(isRecoverableJob(failed), true);
    const retried = transitionJob(failed, "queued");
    assert.equal(retried.status, "queued");
    assert.equal(retried.errorMessage, undefined);
  });

  it("rejects illegal transitions", () => {
    assert.equal(canTransitionJob("completed", "queued"), false);
    assert.throws(() => transitionJob({ status: "completed" as const, attemptCount: 1 }, "failed"));
  });
});

describe("applyCompletedJobToAsset", () => {
  it("attaches output only after a completed job with a URL", () => {
    const pending = applyCompletedJobToAsset(asset({ id: ASSET_ID }), {
      status: "running", outputUrl: "https://cdn.example/pending.jpg", assetId: ASSET_ID,
    });
    assert.equal(pending.fileUrl, undefined);
    const attached = applyCompletedJobToAsset(asset({ id: ASSET_ID }), {
      status: "completed", outputUrl: "https://cdn.example/operator.jpg", assetId: ASSET_ID,
    });
    assert.equal(attached.fileUrl, "https://cdn.example/operator.jpg");
  });
});
