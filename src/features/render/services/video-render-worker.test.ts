import test from "node:test";
import assert from "node:assert/strict";
import { writeFile, stat } from "node:fs/promises";

import {
  createVideoRenderJob,
  claimVideoRenderJob,
  cancelVideoRenderJob,
  retryVideoRenderJob,
  executeVideoRenderJob,
  type StorageUploader,
} from "./video-render-worker";
import type { VideoClipInput } from "./video-render-engine";

const validProbe = async () => ({
  formatNames: "mov,mp4,m4a,3gp,3g2,mj2",
  durationSeconds: 10,
  hasVideo: true,
});

const sampleClips: VideoClipInput[] = [
  {
    sequenceNumber: 1,
    title: "Opening Scene",
    durationSeconds: 4,
    sourceKind: "scene",
    sourceId: "scene-1",
  },
  {
    sequenceNumber: 2,
    title: "Second Scene",
    durationSeconds: 6,
    sourceKind: "scene",
    sourceId: "scene-2",
  },
];

test("Video Render Worker", async (t) => {
  await t.test("createVideoRenderJob validates inputs and initializes queued job", () => {
    assert.throws(() => createVideoRenderJob({ productionId: "", clips: sampleClips }), /productionId is required/);
    assert.throws(() => createVideoRenderJob({ productionId: "prod-1", clips: [] }), /at least one clip is required/);

    const job = createVideoRenderJob({
      productionId: "prod-1",
      renderId: "seq-1",
      clips: sampleClips,
      maxAttempts: 2,
    });

    assert.equal(job.productionId, "prod-1");
    assert.equal(job.renderId, "seq-1");
    assert.equal(job.status, "queued");
    assert.equal(job.attempts, 0);
    assert.equal(job.maxAttempts, 2);
    assert.equal(job.clips.length, 2);
  });

  await t.test("claimVideoRenderJob handles atomic transition and guards non-queued states", () => {
    const job = createVideoRenderJob({ productionId: "prod-1", clips: sampleClips });

    // Initial claim succeeds
    const claim1 = claimVideoRenderJob(job);
    assert.equal(claim1.claimed, true);
    assert.equal(claim1.job.status, "running");
    assert.equal(claim1.job.attempts, 1);
    assert.ok(claim1.job.startedAt);

    // Duplicate claim on already claimed job fails
    const claim2 = claimVideoRenderJob(claim1.job);
    assert.equal(claim2.claimed, false);
    assert.equal(claim2.job.attempts, 1);

    // Cannot claim job that reached max attempts
    const exhaustedJob = { ...job, status: "queued" as const, attempts: 3, maxAttempts: 3 };
    const claimExhausted = claimVideoRenderJob(exhaustedJob);
    assert.equal(claimExhausted.claimed, false);
  });

  await t.test("cancelVideoRenderJob updates status and rejects cancelling completed jobs", () => {
    const job = createVideoRenderJob({ productionId: "prod-1", clips: sampleClips });

    // Can cancel queued job
    const cancelled = cancelVideoRenderJob(job, "Creator canceled");
    assert.equal(cancelled.status, "cancelled");
    assert.equal(cancelled.error, "Creator canceled");
    assert.ok(cancelled.completedAt);

    // Cancelling already cancelled job is idempotent
    const cancelledAgain = cancelVideoRenderJob(cancelled);
    assert.equal(cancelledAgain.status, "cancelled");

    // Cannot cancel completed job
    const completedJob = { ...job, status: "completed" as const };
    assert.throws(() => cancelVideoRenderJob(completedJob), /Cannot cancel a completed render job/);
  });

  await t.test("executeVideoRenderJob transitions status and handles runner failure", async () => {
    const job = createVideoRenderJob({ productionId: "prod-1", clips: sampleClips });

    const failingRunner = async () => ({
      stdout: "",
      stderr: "FFmpeg process crashed with signal SIGSEGV",
      exitCode: 139,
    });

    const result = await executeVideoRenderJob(job, { runner: failingRunner });

    assert.equal(result.status, "failed");
    assert.equal(result.attempts, 1);
    assert.match(result.error ?? "", /FFmpeg process crashed/);
  });

  await t.test("executeVideoRenderJob handles storage upload failure gracefully", async () => {
    const job = createVideoRenderJob({ productionId: "prod-storage-fail", clips: sampleClips });

    const mockRunner = async (_cmd: string, args: string[]) => {
      const outputPath = args[args.length - 1];
      const buffer = Buffer.alloc(32);
      buffer.write("ftyp", 4, "latin1");
      await writeFile(outputPath, buffer);
      return { stdout: "ok", stderr: "", exitCode: 0 };
    };

    const failingStorage: StorageUploader = {
      async upload() {
        throw new Error("S3/Supabase Storage connection dropped (503 Service Unavailable)");
      },
    };

    const result = await executeVideoRenderJob(job, {
      runner: mockRunner,
      probe: validProbe,
      storageUploader: failingStorage,
    });

    assert.equal(result.status, "failed");
    assert.match(result.error ?? "", /503 Service Unavailable/);
  });

  await t.test("executeVideoRenderJob respects pre-cancelled job", async () => {
    const job = createVideoRenderJob({ productionId: "prod-1", clips: sampleClips });
    const cancelledJob = cancelVideoRenderJob(job);

    let runnerCalled = false;
    const runner = async () => {
      runnerCalled = true;
      return { stdout: "", stderr: "", exitCode: 0 };
    };

    const result = await executeVideoRenderJob(cancelledJob, { runner });
    assert.equal(result.status, "cancelled");
    assert.equal(runnerCalled, false, "Runner should not be called for cancelled job");
  });

  await t.test("executeVideoRenderJob completes successfully, records metadata and uploads to storage", async () => {
    const job = createVideoRenderJob({ productionId: "prod-abc", clips: sampleClips });

    const mockRunner = async (_cmd: string, args: string[]) => {
      const outputPath = args[args.length - 1];
      // Write mock MP4 with ftyp marker (byte 4..7)
      const buffer = Buffer.alloc(32);
      buffer.write("ftyp", 4, "latin1");
      await writeFile(outputPath, buffer);
      return { stdout: "ok", stderr: "", exitCode: 0 };
    };

    let uploadedKey = "";
    let uploadedFile = "";
    const mockStorage: StorageUploader = {
      async upload(localFilePath, storageKey) {
        uploadedFile = localFilePath;
        uploadedKey = storageKey;
        return { storageUrl: `https://storage.example.com/${storageKey}` };
      },
    };

    const completed = await executeVideoRenderJob(job, {
      runner: mockRunner,
      probe: validProbe,
      storageUploader: mockStorage,
      cleanupLocalFileAfterUpload: true,
    });

    assert.equal(completed.status, "completed");
    assert.equal(completed.attempts, 1);
    assert.equal(completed.durationSeconds, 10);
    assert.match(uploadedKey, new RegExp(`^productions/prod-abc/renders/${job.id}/[0-9a-f-]+\\.mp4$`));
    assert.equal(completed.storageKey, uploadedKey);
    assert.equal(completed.storageUrl, `https://storage.example.com/${uploadedKey}`);

    // Verify local cleanup was triggered
    let fileExists = true;
    try {
      await stat(uploadedFile);
    } catch {
      fileExists = false;
    }
    assert.equal(fileExists, false, "Local file should be cleaned up after upload");
  });

  await t.test("retryVideoRenderJob resets failed job and enforces maxAttempts cap", async () => {
    const job = createVideoRenderJob({ productionId: "prod-1", clips: sampleClips, maxAttempts: 2 });

    assert.throws(() => retryVideoRenderJob(job), /only failed jobs can be retried/);

    const failedJob = {
      ...job,
      status: "failed" as const,
      attempts: 1,
      error: "Temporary network timeout",
    };

    const retried = retryVideoRenderJob(failedJob);
    assert.equal(retried.status, "queued");
    assert.equal(retried.error, undefined);
    assert.equal(retried.attempts, 1);

    const maxedJob = {
      ...failedJob,
      attempts: 2,
    };
    assert.throws(() => retryVideoRenderJob(maxedJob), /reached maximum attempt limit/);
  });
});
