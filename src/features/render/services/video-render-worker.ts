import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

import type { CreateVideoRenderJobInput, VideoRenderJob } from "../types/video-render-job";
import type { VideoRenderFailureCode } from "../types/video-render-job";
import {
  renderVideoAssembly,
  type ProcessRunner,
  type VideoProbe,
} from "./video-render-engine";
import { downloadSecureMedia, MAX_SECURE_MEDIA_BYTES } from "./secure-media";

export interface StorageUploader {
  upload(localFilePath: string, storageKey: string): Promise<{ storageUrl: string }>;
  delete?(storageKey: string): Promise<void>;
}

export interface VideoRenderWorkerOptions {
  runner?: ProcessRunner;
  probe?: VideoProbe;
  storageUploader?: StorageUploader;
  outputDirectory?: string;
  cleanupLocalFileAfterUpload?: boolean;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void | Promise<void>;
  maxInputBytes?: number;
}

const DEFAULT_MAX_ATTEMPTS = 3;

/**
 * Initializes a new VideoRenderJob in the queued state.
 */
export function createVideoRenderJob(input: CreateVideoRenderJobInput): VideoRenderJob {
  if (!input.productionId || input.productionId.trim().length === 0) {
    throw new Error("Cannot create video render job: productionId is required.");
  }
  if (!input.clips || input.clips.length === 0) {
    throw new Error("Cannot create video render job: at least one clip is required.");
  }

  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    productionId: input.productionId,
    renderId: input.renderId,
    status: "queued",
    progress: 0,
    attempts: 0,
    maxAttempts: input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
    retryable: true,
    cancelRequested: false,
    warnings: [],
    clips: [...input.clips],
    config: input.config ?? {},
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Atomically attempts to claim a queued job for worker execution.
 * Returns { claimed: true, job } if transition succeeded, or { claimed: false, job } if not claimable.
 */
export function claimVideoRenderJob(
  job: VideoRenderJob,
  startedAt: string = new Date().toISOString()
): { claimed: boolean; job: VideoRenderJob } {
  if (job.status !== "queued") {
    return { claimed: false, job };
  }
  if (job.attempts >= job.maxAttempts) {
    return { claimed: false, job };
  }

  const updatedJob: VideoRenderJob = {
    ...job,
    status: "running",
    attempts: job.attempts + 1,
    startedAt,
    updatedAt: startedAt,
  };

  return { claimed: true, job: updatedJob };
}

/**
 * Cancels a queued or running video render job. Completed jobs cannot be cancelled.
 */
export function cancelVideoRenderJob(
  job: VideoRenderJob,
  reason?: string
): VideoRenderJob {
  if (job.status === "cancelled") {
    return job;
  }
  if (job.status !== "queued" && job.status !== "running") {
    throw new Error(job.status === "completed"
      ? "Cannot cancel a completed render job."
      : `Cannot cancel a render job with status '${job.status}'.`);
  }

  const now = new Date().toISOString();
  return {
    ...job,
    status: "cancelled",
    error: reason ?? "Render job was cancelled by creator.",
    completedAt: now,
    updatedAt: now,
  };
}

/**
 * Requeues a failed video render job for an explicit retry, respecting the max attempts cap.
 */
export function retryVideoRenderJob(job: VideoRenderJob): VideoRenderJob {
  if (job.status !== "failed") {
    throw new Error(`Cannot retry job with status '${job.status}'; only failed jobs can be retried.`);
  }
  if (job.attempts >= job.maxAttempts) {
    throw new Error(`Cannot retry job: reached maximum attempt limit of ${job.maxAttempts}.`);
  }

  const now = new Date().toISOString();
  return {
    ...job,
    status: "queued",
    error: undefined,
    startedAt: undefined,
    completedAt: undefined,
    updatedAt: now,
  };
}

/**
 * Executes a VideoRenderJob through rendering, validation, and optional storage upload.
 */
export async function executeVideoRenderJob(
  job: VideoRenderJob,
  options: VideoRenderWorkerOptions = {}
): Promise<VideoRenderJob> {
  const now = new Date().toISOString();

  // Guard terminal or cancelled states
  if (job.status === "completed") {
    return job;
  }
  if (job.status === "cancelled") {
    return job;
  }
  if (job.attempts >= job.maxAttempts && job.status !== "running") {
    return {
      ...job,
      status: "failed",
      error: `Render failed: maximum retry limit of ${job.maxAttempts} exceeded.`,
      updatedAt: now,
    };
  }

  // If the job was not already claimed as running, claim it now
  const nextAttempt = job.status === "running" ? job.attempts : job.attempts + 1;
  const runningJob: VideoRenderJob = {
    ...job,
    status: "running",
    progress: Math.max(job.progress, 1),
    attempts: nextAttempt,
    startedAt: job.startedAt ?? now,
    updatedAt: now,
  };

  const outputDirectory = options.outputDirectory ?? join(tmpdir(), "kingdom-studio-ai", "renders");
  const localTargetFilePath = join(outputDirectory, `${runningJob.id}.mp4`);
  const storageKey = `productions/${runningJob.productionId}/renders/${runningJob.id}/${runningJob.leaseToken ?? randomUUID()}.mp4`;
  const downloadedPaths: string[] = [];
  let executionSucceeded = false;
  let uploadStarted = false;

  try {
    let totalInputBytes = 0;
    const maxInputBytes = options.maxInputBytes ?? 512 * 1024 * 1024;
    const renderClips = [];
    for (const clip of runningJob.clips) {
      if (!clip.mediaUrl) {
        renderClips.push(clip);
        continue;
      }
      const remainingInputBytes = maxInputBytes - totalInputBytes;
      if (remainingInputBytes <= 0) {
        throw new Error("input_too_large: Total downloaded source media exceeds the render input limit.");
      }
      const downloaded = await downloadSecureMedia(
        clip.mediaUrl,
        join(outputDirectory, `${runningJob.id}-source-${clip.sequenceNumber}`),
        {
          signal: options.signal,
          timeoutMs: runningJob.config.timeoutMs ?? 120_000,
          maxBytes: Math.min(MAX_SECURE_MEDIA_BYTES, remainingInputBytes),
        },
      );
      totalInputBytes += downloaded.bytes;
      downloadedPaths.push(downloaded.filePath);
      renderClips.push({ ...clip, mediaUrl: downloaded.filePath, inputFormat: downloaded.format });
    }

    let progressWrites = Promise.resolve();
    const renderResult = await renderVideoAssembly(renderClips, localTargetFilePath, {
      config: runningJob.config,
      runner: options.runner,
      probe: options.probe,
      signal: options.signal,
      scratchDirectory: outputDirectory,
      onProgress: (fraction) => {
        const progress = Math.max(1, Math.min(99, Math.round(fraction * 100)));
        progressWrites = progressWrites.then(() => options.onProgress?.(progress)).then(() => undefined);
      },
    });
    await progressWrites;

    if (options.signal?.aborted) {
      return {
        ...runningJob,
        status: "cancelled",
        retryable: false,
        failureCode: "cancelled",
        error: "Render job was cancelled by creator.",
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (!renderResult.success || !renderResult.outputFilePath) {
      const timedOut = renderResult.error?.includes("timed out") ?? false;
      const outputValidationFailure = renderResult.error?.includes("FFprobe") === true
        || renderResult.error?.includes("output validation") === true;
      return {
        ...runningJob,
        status: "failed",
        retryable: timedOut || !outputValidationFailure,
        failureCode: timedOut
          ? "ffmpeg_timeout"
          : outputValidationFailure
            ? "output_validation_failed"
            : "ffmpeg_failed",
        error: renderResult.error ?? "Unknown rendering failure.",
        warnings: renderResult.warnings,
        updatedAt: new Date().toISOString(),
      };
    }

    let storageUrl: string | undefined;

    // Production-scoped storage upload
    if (options.storageUploader) {
      uploadStarted = true;
      const uploadResult = await options.storageUploader.upload(renderResult.outputFilePath, storageKey);
      storageUrl = uploadResult.storageUrl;

      if (options.signal?.aborted) {
        await options.storageUploader.delete?.(storageKey);
        return {
          ...runningJob,
          status: "cancelled",
          retryable: false,
          failureCode: "cancelled",
          error: "Render job was cancelled by creator.",
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    }

    const finishedAt = new Date().toISOString();
    executionSucceeded = true;
    return {
      ...runningJob,
      status: "completed",
      progress: 100,
      outputPath: options.cleanupLocalFileAfterUpload ? undefined : renderResult.outputFilePath,
      storageUrl,
      storageKey,
      fileSizeBytes: renderResult.fileSizeBytes,
      durationSeconds: renderResult.durationSeconds,
      retryable: false,
      failureCode: undefined,
      warnings: renderResult.warnings,
      completedAt: finishedAt,
      updatedAt: finishedAt,
    };
  } catch (caught) {
    if (uploadStarted) {
      await options.storageUploader?.delete?.(storageKey).catch((cleanupError: unknown) => {
        console.error(JSON.stringify({
          level: "error",
          service: "render-worker",
          jobId: runningJob.id,
          stage: "failed_upload_cleanup",
          error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
        }));
      });
    }
    if (options.signal?.aborted) {
      const cancelledAt = new Date().toISOString();
      return {
        ...runningJob,
        status: "cancelled",
        retryable: false,
        failureCode: "cancelled",
        error: "Render job was cancelled by creator.",
        completedAt: cancelledAt,
        updatedAt: cancelledAt,
      };
    }
    const message = caught instanceof Error ? caught.message : String(caught);
    const failureCode = message.match(/^(source_url_invalid|source_fetch_failed|unsupported_media_type|input_too_large):/)?.[1] as VideoRenderFailureCode | undefined;
    const storageFailure = message.includes("upload") || message.includes("Storage");
    return {
      ...runningJob,
      status: "failed",
      retryable: !failureCode || failureCode === "source_fetch_failed" || failureCode === "ffmpeg_timeout" || storageFailure,
      failureCode: failureCode ?? (storageFailure ? "storage_upload_failed" : "unknown"),
      error: `Unexpected worker execution error: ${message}`,
      updatedAt: new Date().toISOString(),
    };
  } finally {
    if (options.cleanupLocalFileAfterUpload || !executionSucceeded || options.signal?.aborted) {
      try {
        await unlink(localTargetFilePath);
      } catch (caught) {
        if (!(caught instanceof Error && "code" in caught && caught.code === "ENOENT")) {
          console.error("Unable to remove temporary render output.", caught);
        }
      }
      await Promise.all(downloadedPaths.map((filePath) => unlink(filePath).catch((caught: unknown) => {
        if (!(caught instanceof Error && "code" in caught && caught.code === "ENOENT")) {
          console.error(JSON.stringify({
            level: "error",
            service: "render-worker",
            jobId: runningJob.id,
            stage: "source_cleanup_failed",
            filePath,
            error: caught instanceof Error ? caught.message : String(caught),
          }));
        }
      })));
    }
  }
}
