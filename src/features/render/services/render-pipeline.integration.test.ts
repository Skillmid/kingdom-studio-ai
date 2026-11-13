import test from "node:test";
import assert from "node:assert/strict";
import { stat, writeFile } from "node:fs/promises";

import { executeVideoRenderJob } from "./video-render-worker";
import {
  LocalMockRenderStorageAdapter,
  type RenderStorageAdapter,
  verifyLocalPlaybackGrant,
} from "./render-storage";
import { InMemoryVideoRenderJobRepository } from "../repositories/video-render-job.repository";
import type { VideoClipInput } from "./video-render-engine";

const validProbe = async () => ({
  formatNames: "mov,mp4,m4a,3gp,3g2,mj2",
  durationSeconds: 8,
  hasVideo: true,
});

const OWNER_ID = "22222222-2222-4222-8222-222222222222";
const FOREIGN_USER_ID = "99999999-9999-4999-8999-999999999999";
const PRODUCTION_ID = "11111111-1111-4111-8111-111111111111";

const mockClips: VideoClipInput[] = [
  {
    sequenceNumber: 1,
    title: "Opening Citadel View",
    durationSeconds: 3.5,
    sourceKind: "shot",
    sourceId: "shot-001",
  },
  {
    sequenceNumber: 2,
    title: "Council Chamber Dialogue",
    durationSeconds: 4.5,
    sourceKind: "shot",
    sourceId: "shot-002",
  },
];

test("Render Pipeline Integration & Production Verification", async (t) => {
  const repo = new InMemoryVideoRenderJobRepository();
  const storage: RenderStorageAdapter = new LocalMockRenderStorageAdapter();

  await t.test("Full lifecycle: submit -> claim -> render -> upload -> signed URL access", async () => {
    // 1. Submit render job
    const createdJob = await repo.create({
      productionId: PRODUCTION_ID,
      renderId: "seq-alpha",
      clips: mockClips,
      config: { width: 1280, height: 720, fps: 24 },
    });

    assert.equal(createdJob.status, "queued");
    assert.equal(createdJob.attempts, 0);

    // 2. Atomic claim by worker
    const claimedJob = await repo.claim(createdJob.id);
    assert.ok(claimedJob);
    assert.equal(claimedJob.status, "running");
    assert.equal(claimedJob.attempts, 1);

    // 3. Second claim fails (duplicate claim prevention)
    const duplicateClaim = await repo.claim(createdJob.id);
    assert.equal(duplicateClaim, null, "Concurrent worker must not claim an already running job");

    // 4. Execute rendering with storage upload
    const mockRunner = async (_cmd: string, args: string[]) => {
      const outputPath = args[args.length - 1];
      const buffer = Buffer.alloc(32);
      buffer.write("ftyp", 4, "latin1");
      await writeFile(outputPath, buffer);
      return { stdout: "ok", stderr: "", exitCode: 0 };
    };

    const executedJob = await executeVideoRenderJob(claimedJob, {
      runner: mockRunner,
      probe: validProbe,
      storageUploader: storage,
      cleanupLocalFileAfterUpload: true,
    });

    assert.equal(executedJob.status, "completed");
    assert.ok(executedJob.storageUrl);

    // Update repository with completed job
    await repo.update(executedJob.id, executedJob);

    // 5. Authorized playback access for owner
    const isOwnerAuthorized = storage.verifyAccess(OWNER_ID, OWNER_ID);
    assert.equal(isOwnerAuthorized, true, "Production owner must be authorized for playback");

    const storageKey = executedJob.storageKey;
    assert.ok(storageKey);
    assert.match(storageKey, new RegExp(`^productions/${executedJob.productionId}/renders/${executedJob.id}/`));
    const signedAccess = await storage.createSignedPlaybackUrl(storageKey, 3600);
    assert.ok(signedAccess.signedUrl);
    const grant = new URL(signedAccess.signedUrl);
    assert.equal(grant.protocol, "local:");
    assert.equal(grant.pathname, "/playback");
    assert.equal(verifyLocalPlaybackGrant(
      executedJob.id,
      grant.searchParams.get("key") ?? "",
      grant.searchParams.get("expires") ?? "",
      grant.searchParams.get("sig") ?? "",
    ), true);
    assert.equal(verifyLocalPlaybackGrant(
      "99999999-9999-4999-8999-999999999999",
      grant.searchParams.get("key") ?? "",
      grant.searchParams.get("expires") ?? "",
      grant.searchParams.get("sig") ?? "",
    ), false);
    assert.ok(new Date(signedAccess.expiresAt).getTime() > Date.now());

    // 6. Access denial for foreign user
    const isForeignUserAuthorized = storage.verifyAccess(FOREIGN_USER_ID, OWNER_ID);
    assert.equal(isForeignUserAuthorized, false, "Foreign user must be denied playback access");
  });

  await t.test("Recovery from storage upload failure", async () => {
    const job = await repo.create({
      productionId: PRODUCTION_ID,
      clips: mockClips,
    });

    const claimed = await repo.claim(job.id);
    assert.ok(claimed);

    let outputFilePath = "";
    const mockRunner = async (_cmd: string, args: string[]) => {
      const outputPath = args[args.length - 1];
      outputFilePath = outputPath;
      const buffer = Buffer.alloc(32);
      buffer.write("ftyp", 4, "latin1");
      await writeFile(outputPath, buffer);
      return { stdout: "ok", stderr: "", exitCode: 0 };
    };

    const failingStorage: RenderStorageAdapter = {
      async upload() {
        throw new Error("Supabase Storage error: 504 Gateway Timeout");
      },
      async createSignedPlaybackUrl() {
        throw new Error("Not implemented");
      },
      verifyAccess() {
        return false;
      },
      async delete() {},
    };

    const failedExecution = await executeVideoRenderJob(claimed, {
      runner: mockRunner,
      probe: validProbe,
      storageUploader: failingStorage,
    });

    assert.equal(failedExecution.status, "failed");
    assert.match(failedExecution.error ?? "", /504 Gateway Timeout/);
    await assert.rejects(stat(outputFilePath), { code: "ENOENT" });

    await repo.update(failedExecution.id, failedExecution);

    // Re-queue failed job for retry
    const retriedJob = await repo.retry(failedExecution.id);
    assert.equal(retriedJob.status, "queued");
    assert.equal(retriedJob.error, undefined);
    assert.equal(retriedJob.attempts, 1);
  });

  await t.test("Recovery from interrupted rendering / FFmpeg crash", async () => {
    const job = await repo.create({
      productionId: PRODUCTION_ID,
      clips: mockClips,
    });

    const claimed = await repo.claim(job.id);
    assert.ok(claimed);

    const crashingRunner = async () => ({
      stdout: "",
      stderr: "Encoder error: unhandled exception in libx264",
      exitCode: 1,
    });

    const failedJob = await executeVideoRenderJob(claimed, {
      runner: crashingRunner,
      storageUploader: storage,
    });

    assert.equal(failedJob.status, "failed");
    assert.match(failedJob.error ?? "", /Encoder error/);
  });

  await t.test("Enforces attempt cap on exhausted retries", async () => {
    const job = await repo.create({
      productionId: PRODUCTION_ID,
      clips: mockClips,
      maxAttempts: 2,
    });

    // Attempt 1 fails
    const claim1 = await repo.claim(job.id);
    assert.ok(claim1);
    const failed1 = { ...claim1, status: "failed" as const };
    await repo.update(job.id, failed1);

    // Retry 1 succeeds
    const retried1 = await repo.retry(job.id);
    assert.equal(retried1.status, "queued");

    // Attempt 2 fails
    const claim2 = await repo.claim(job.id);
    assert.ok(claim2);
    const failed2 = { ...claim2, status: "failed" as const };
    await repo.update(job.id, failed2);

    // Attempt 3 is blocked by cap
    await assert.rejects(
      async () => repo.retry(job.id),
      /reached maximum attempt limit of 2/
    );
  });

  await t.test("Cancellation behavior for queued and running jobs", async () => {
    const job = await repo.create({
      productionId: PRODUCTION_ID,
      clips: mockClips,
    });

    // Cancel queued job
    const cancelledJob = await repo.cancel(job.id, "Director cancelled sequence");
    assert.equal(cancelledJob.status, "cancelled");
    assert.equal(cancelledJob.error, "Director cancelled sequence");

    // Worker refuses to execute cancelled job
    let runnerRan = false;
    const runner = async () => {
      runnerRan = true;
      return { stdout: "", stderr: "", exitCode: 0 };
    };

    const result = await executeVideoRenderJob(cancelledJob, { runner });
    assert.equal(result.status, "cancelled");
    assert.equal(runnerRan, false);
  });

  await t.test("Cancellation wins over a late render finalization", async () => {
    const job = await repo.create({
      productionId: PRODUCTION_ID,
      clips: mockClips,
    });
    const claimed = await repo.claim(job.id);
    assert.ok(claimed);

    const cancelled = await repo.cancel(job.id, "Creator cancelled during rendering.");
    assert.equal(cancelled.status, "cancelled");
    const lateFinalization = await repo.finalizeExecution(job.id, {
      ...claimed,
      status: "completed",
      progress: 100,
      completedAt: new Date().toISOString(),
    });
    assert.equal(lateFinalization, null);
    assert.equal((await repo.findById(job.id))?.status, "cancelled");
    assert.equal(await repo.updateProgress(job.id, 80), null);
  });
});
