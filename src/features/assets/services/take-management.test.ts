import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Asset } from "../types/asset";
import type { GenerationJob } from "../types/generation-job";
import {
  canCreateNewTake,
  compareTakes,
  extractTakesFromAssetJobs,
  selectActiveTake,
} from "./take-management";

const BASE_ASSET: Asset = {
  id: "asset-1111-1111",
  productionId: "prod-1111-1111",
  kind: "video",
  title: "Close up of Mary at sunset",
  prompt: "Cinematic close-up of Mary looking towards the horizon with golden rim light.",
  sourceKind: "shot",
  provenance: "generated",
  userApproved: true,
  status: "ready",
  progress: 100,
  fileUrl: "https://cdn.example.com/takes/take-1.mp4",
  createdAt: "2026-11-12T10:00:00.000Z",
  updatedAt: "2026-11-12T10:05:00.000Z",
};

function createJob(overrides: Partial<GenerationJob> = {}): GenerationJob {
  return {
    id: "job-1",
    productionId: BASE_ASSET.productionId,
    assetId: BASE_ASSET.id,
    jobType: "video",
    status: "completed",
    provider: "kling",
    model: "kling-v1",
    prompt: BASE_ASSET.prompt,
    parameters: { aspect_ratio: "16:9" },
    outputUrl: "https://cdn.example.com/takes/take-1.mp4",
    attemptCount: 1,
    createdAt: "2026-11-12T10:00:00.000Z",
    completedAt: "2026-11-12T10:02:00.000Z",
    updatedAt: "2026-11-12T10:02:00.000Z",
    ...overrides,
  };
}

describe("Take Management Service", () => {
  it("extracts chronological takes and identifies the active take matching asset.fileUrl", () => {
    const job1 = createJob({
      id: "job-take-1",
      outputUrl: "https://cdn.example.com/takes/take-1.mp4",
      createdAt: "2026-11-12T10:00:00.000Z",
      completedAt: "2026-11-12T10:02:00.000Z",
    });

    const job2 = createJob({
      id: "job-take-2",
      outputUrl: "https://cdn.example.com/takes/take-2.mp4",
      createdAt: "2026-11-12T10:10:00.000Z",
      completedAt: "2026-11-12T10:12:00.000Z",
    });

    const job3 = createJob({
      id: "job-take-3",
      outputUrl: "https://cdn.example.com/takes/take-3.mp4",
      createdAt: "2026-11-12T10:20:00.000Z",
      completedAt: "2026-11-12T10:22:00.000Z",
    });

    // Asset has take 2 active
    const asset = { ...BASE_ASSET, fileUrl: "https://cdn.example.com/takes/take-2.mp4" };
    const takes = extractTakesFromAssetJobs(asset, [job3, job1, job2]);

    assert.equal(takes.length, 3);
    assert.equal(takes[0].takeNumber, 1);
    assert.equal(takes[0].id, "job-take-1");
    assert.equal(takes[0].isActive, false);

    assert.equal(takes[1].takeNumber, 2);
    assert.equal(takes[1].id, "job-take-2");
    assert.equal(takes[1].isActive, true);

    assert.equal(takes[2].takeNumber, 3);
    assert.equal(takes[2].id, "job-take-3");
    assert.equal(takes[2].isActive, false);
  });

  it("ignores non-completed or output-less jobs when extracting takes", () => {
    const completedJob = createJob({ id: "job-ok", status: "completed", outputUrl: "https://cdn.example.com/1.mp4" });
    const failedJob = createJob({ id: "job-fail", status: "failed", outputUrl: undefined });
    const runningJob = createJob({ id: "job-running", status: "running", outputUrl: undefined });
    const otherAssetJob = createJob({ id: "job-other", assetId: "other-asset-id" });

    const takes = extractTakesFromAssetJobs(BASE_ASSET, [completedJob, failedJob, runningJob, otherAssetJob]);
    assert.equal(takes.length, 1);
    assert.equal(takes[0].id, "job-ok");
    assert.equal(takes[0].takeNumber, 1);
  });

  it("validates eligibility to create a new take", () => {
    // Normal approved asset with only completed jobs -> can create new take
    assert.equal(canCreateNewTake(BASE_ASSET, [createJob()]), true);

    // Unapproved asset -> cannot create new take
    assert.equal(canCreateNewTake({ ...BASE_ASSET, userApproved: false }, [createJob()]), false);

    // Asset with a currently running job -> cannot create new take
    const runningJob = createJob({ id: "running-job", status: "running" });
    assert.equal(canCreateNewTake(BASE_ASSET, [createJob(), runningJob]), false);

    // Asset with a currently queued job -> cannot create new take
    const queuedJob = createJob({ id: "queued-job", status: "queued" });
    assert.equal(canCreateNewTake(BASE_ASSET, [createJob(), queuedJob]), false);

    // Asset with an unconfirmed unknown provider state -> cannot create new take
    const unknownJob = createJob({
      id: "unknown-job",
      status: "failed",
      parameters: { providerStateUnknownAt: "2026-11-12T10:00:00.000Z" },
    });
    assert.equal(canCreateNewTake(BASE_ASSET, [unknownJob]), false);
  });

  it("non-destructively selects a take and restores its output URL to the asset", () => {
    const takes = extractTakesFromAssetJobs(BASE_ASSET, [
      createJob({ id: "take-1", outputUrl: "https://cdn.example.com/take-1.mp4" }),
      createJob({ id: "take-2", outputUrl: "https://cdn.example.com/take-2.mp4" }),
    ]);

    // Select Take 2
    const patch = selectActiveTake(BASE_ASSET, takes[1]);
    assert.equal(patch.fileUrl, "https://cdn.example.com/take-2.mp4");
    assert.equal(patch.status, "ready");

    // Restoring Take 1
    const restorePatch = selectActiveTake(BASE_ASSET, takes[0]);
    assert.equal(restorePatch.fileUrl, "https://cdn.example.com/take-1.mp4");
    assert.equal(restorePatch.status, "ready");
  });

  it("throws when selecting a take belonging to a different asset", () => {
    const takeFromOther = {
      id: "foreign-job",
      assetId: "completely-different-asset",
      takeNumber: 1,
      outputUrl: "https://cdn.example.com/foreign.mp4",
      parameters: {},
      createdAt: "2026-11-12T10:00:00.000Z",
      isActive: false,
    };

    assert.throws(
      () => selectActiveTake(BASE_ASSET, takeFromOther),
      /Cannot assign a take belonging to a different asset/,
    );
  });

  it("compares takes and identifies prompt/provider differences", () => {
    const take1 = {
      id: "take-1",
      assetId: BASE_ASSET.id,
      takeNumber: 1,
      outputUrl: "https://cdn.example.com/take-1.mp4",
      provider: "kling",
      prompt: "Mary at sunset, wide angle",
      parameters: { aspect_ratio: "16:9" },
      createdAt: "2026-11-12T10:00:00.000Z",
      isActive: true,
    };

    const take2 = {
      id: "take-2",
      assetId: BASE_ASSET.id,
      takeNumber: 2,
      outputUrl: "https://cdn.example.com/take-2.mp4",
      provider: "kling",
      prompt: "Mary at sunset, extreme close up with lens flare",
      parameters: { aspect_ratio: "16:9" },
      createdAt: "2026-11-12T10:15:00.000Z",
      isActive: false,
    };

    const comparison = compareTakes(take1, take2);
    assert.equal(comparison.isSameProvider, true);
    assert.equal(comparison.isSamePrompt, false);
    assert.equal(comparison.isSameOutputUrl, false);
    assert.equal(comparison.activeTakeNumber, 1);
  });
});
