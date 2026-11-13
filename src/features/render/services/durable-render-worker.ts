import { mkdir, rm, statfs } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { availableParallelism, cpus, totalmem } from "node:os";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";

import { SupabaseVideoRenderJobRepository } from "../repositories/video-render-job.repository";
import type { VideoRenderFailureCode, VideoRenderJob } from "../types/video-render-job";
import { executeVideoRenderJob } from "./video-render-worker";
import { createRenderStorageAdapter, isLocalSupabaseUrl } from "./render-storage";

const LEASE_SECONDS = 90;
const DEFAULT_MIN_FREE_DISK_BYTES = 1024 * 1024 * 1024;
const DEFAULT_MAX_INPUT_BYTES = 512 * 1024 * 1024;
const execFileAsync = promisify(execFile);

export interface DurableRenderWorkerOptions {
  supabase: SupabaseClient;
  supabaseUrl: string;
  scratchDirectory: string;
  concurrency: number;
  pollIntervalMs: number;
  maxInputBytes?: number;
  minFreeDiskBytes?: number;
  maxMemoryBytes?: number;
  maxJobDurationMs?: number;
  ffmpegPath?: string;
  ffprobePath?: string;
}

export interface DurableRenderWorker {
  close(): Promise<void>;
  isReady(): Promise<boolean>;
  activeJobCount(): number;
}

function log(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, string | number | boolean | undefined> = {},
): void {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: "render-worker",
    event,
    ...details,
  }));
}

function failureFor(error: unknown): { code: VideoRenderFailureCode; retryable: boolean; message: string } {
  const message = error instanceof Error ? error.message : String(error);
  const code = message.match(/^(source_url_invalid|source_fetch_failed|unsupported_media_type|input_too_large):/)?.[1];
  if (code === "source_url_invalid") return { code: "source_url_invalid", retryable: false, message };
  if (code === "unsupported_media_type") return { code: "unsupported_media_type", retryable: false, message };
  if (code === "input_too_large") return { code: "input_too_large", retryable: false, message };
  if (code === "source_fetch_failed") return { code: "source_fetch_failed", retryable: true, message };
  return { code: message.includes("upload") || message.includes("Storage") ? "storage_upload_failed" : "unknown", retryable: true, message };
}

async function assertResources(
  scratchDirectory: string,
  minFreeDiskBytes: number,
  maxMemoryBytes: number,
): Promise<void> {
  const memoryUsage = process.memoryUsage().rss;
  const disk = await statfs(scratchDirectory);
  const freeDiskBytes = Number(disk.bavail) * Number(disk.bsize);
  if (memoryUsage >= maxMemoryBytes || freeDiskBytes < minFreeDiskBytes) {
    throw new Error(
      `Worker resource limit reached (RSS ${memoryUsage} bytes; free disk ${freeDiskBytes} bytes).`,
    );
  }
}

async function processJob(
  job: VideoRenderJob,
  repository: SupabaseVideoRenderJobRepository,
  storage: ReturnType<typeof createRenderStorageAdapter>,
  options: DurableRenderWorkerOptions,
  minFreeDiskBytes: number,
  maxMemoryBytes: number,
  shuttingDown: () => boolean,
  shutdownSignal: AbortSignal,
): Promise<void> {
  const leaseToken = job.leaseToken;
  if (!leaseToken) throw new Error(`Claimed job '${job.id}' has no lease token.`);

  const startedAt = Date.now();
  const jobScratchDirectory = join(options.scratchDirectory, job.id, leaseToken);
  const controller = new AbortController();
  let leaseLost = false;
  let cancelled = job.cancelRequested;
  let timedOut = false;
  let resourceFailure: Error | undefined;
  let heartbeatInFlight = false;
  let progressWrite = Promise.resolve();

  const heartbeat = setInterval(() => {
    if (heartbeatInFlight || controller.signal.aborted) return;
    heartbeatInFlight = true;
    void assertResources(options.scratchDirectory, minFreeDiskBytes, maxMemoryBytes)
      .then(() => repository.heartbeat(job.id, leaseToken, LEASE_SECONDS))
      .then((lease) => {
        if (!lease) {
          leaseLost = true;
          controller.abort(new Error("Render lease was lost."));
        } else if (lease.cancelRequested) {
          cancelled = true;
          controller.abort(new Error("Render cancellation was requested."));
        }
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.message.startsWith("Worker resource limit")) {
          resourceFailure = error;
          controller.abort(error);
          return;
        }
        leaseLost = true;
        log("error", "lease_heartbeat_failed", {
          jobId: job.id,
          error: error instanceof Error ? error.message : String(error),
        });
        controller.abort(error);
      })
      .finally(() => {
        heartbeatInFlight = false;
      });
  }, Math.max(1_000, Math.min(10_000, Math.floor(LEASE_SECONDS * 1000 / 3))));
  const abortForShutdown = () => controller.abort(new Error("Worker is shutting down."));
  shutdownSignal.addEventListener("abort", abortForShutdown, { once: true });
  if (shutdownSignal.aborted) abortForShutdown();
  const jobTimeout = setTimeout(() => {
    timedOut = true;
    controller.abort(new Error("Render job exceeded its configured time limit."));
  }, options.maxJobDurationMs ?? 300_000);

  try {
    if (job.cancelRequested) {
      controller.abort(new Error("Render cancellation was requested."));
    } else {
      await assertResources(options.scratchDirectory, minFreeDiskBytes, maxMemoryBytes);
    }
    await mkdir(jobScratchDirectory, { recursive: true });

    const result = await executeVideoRenderJob({
      ...job,
      config: {
        ...job.config,
        ffmpegPath: options.ffmpegPath ?? job.config.ffmpegPath,
        ffprobePath: options.ffprobePath ?? job.config.ffprobePath,
      threads: Math.max(1, Math.floor(availableParallelism() / options.concurrency)),
    },
    }, {
      storageUploader: storage,
      outputDirectory: jobScratchDirectory,
      cleanupLocalFileAfterUpload: true,
      maxInputBytes: options.maxInputBytes ?? DEFAULT_MAX_INPUT_BYTES,
      signal: controller.signal,
      onProgress: (progress) => {
        progressWrite = progressWrite.then(async () => {
          await repository.updateLeasedProgress(job.id, leaseToken, progress);
        });
        return progressWrite;
      },
    });
    await progressWrite;

    if (leaseLost) return;
    if (shuttingDown()) {
      if (result.storageKey) {
        await storage.delete(result.storageKey).catch((error: unknown) => {
          log("error", "shutdown_upload_cleanup_failed", {
            jobId: job.id,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }
      await repository.releaseLeasedJob(job.id, leaseToken);
      return;
    }
    if (timedOut) {
      await repository.failLeasedJob(job.id, leaseToken, "ffmpeg_timeout", "Render job exceeded its configured time limit.", true);
      return;
    }
    if (resourceFailure) {
      await repository.failLeasedJob(job.id, leaseToken, "worker_resource_limit", resourceFailure.message, true);
      return;
    }
    if (cancelled || result.status === "cancelled") {
      await repository.failLeasedJob(job.id, leaseToken, "cancelled", "Render job was cancelled by creator.", false);
      if (result.storageKey) await storage.delete(result.storageKey);
      return;
    }
    if (result.status === "completed") {
      let completed: VideoRenderJob | null;
      try {
        completed = await repository.completeLeasedJob(job.id, leaseToken, result);
      } catch (error) {
        let persisted: VideoRenderJob | null | undefined;
        try {
          persisted = await repository.findById(job.id);
        } catch {
          persisted = undefined;
        }
        if (persisted?.status === "completed" && persisted.storageKey === result.storageKey) {
          log("warn", "completion_reconciled_after_rpc_error", {
            jobId: job.id,
            productionId: job.productionId,
          });
          return;
        }
        if (persisted !== undefined && persisted?.status !== "completed" && result.storageKey) {
          await storage.delete(result.storageKey).catch((cleanupError: unknown) => {
            log("error", "failed_upload_cleanup_failed", {
              jobId: job.id,
              error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
            });
          });
        }
        throw error;
      }
      if (!completed && result.storageKey) await storage.delete(result.storageKey);
      log(completed ? "info" : "warn", completed ? "job_completed" : "completion_fenced", {
        jobId: job.id,
        productionId: job.productionId,
        attempt: job.attempts,
        durationMs: Date.now() - startedAt,
        outputBytes: result.fileSizeBytes,
      });
      return;
    }

    const code = result.failureCode ?? "unknown";
    await repository.failLeasedJob(job.id, leaseToken, code, result.error ?? "Rendering failed.", result.retryable);
    log("warn", "job_failed", {
      jobId: job.id,
      productionId: job.productionId,
      attempt: job.attempts,
      durationMs: Date.now() - startedAt,
      failureCode: code,
      retryable: result.retryable,
    });
  } catch (error) {
    if (leaseLost) return;
    if (shuttingDown()) {
      await repository.releaseLeasedJob(job.id, leaseToken).catch((releaseError: unknown) => {
        log("error", "shutdown_release_failed", {
          jobId: job.id,
          error: releaseError instanceof Error ? releaseError.message : String(releaseError),
        });
      });
      return;
    }
    if (timedOut) {
      await repository.failLeasedJob(job.id, leaseToken, "ffmpeg_timeout", "Render job exceeded its configured time limit.", true);
      return;
    }
    if (resourceFailure) {
      await repository.failLeasedJob(job.id, leaseToken, "worker_resource_limit", resourceFailure.message, true);
      return;
    }
    if (cancelled || controller.signal.aborted) {
      await repository.failLeasedJob(job.id, leaseToken, "cancelled", "Render job was cancelled by creator.", false);
      return;
    }
    const failure = error instanceof Error && error.message.startsWith("Worker resource limit")
      ? { code: "worker_resource_limit" as const, retryable: true, message: error.message }
      : failureFor(error);
    await repository.failLeasedJob(job.id, leaseToken, failure.code, failure.message, failure.retryable);
    log("error", "job_execution_failed", {
      jobId: job.id,
      productionId: job.productionId,
      durationMs: Date.now() - startedAt,
      failureCode: failure.code,
      error: failure.message,
    });
  } finally {
    clearInterval(heartbeat);
    clearTimeout(jobTimeout);
    shutdownSignal.removeEventListener("abort", abortForShutdown);
    await rm(jobScratchDirectory, { recursive: true, force: true }).catch((error: unknown) => {
      log("error", "scratch_cleanup_failed", {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }
}

export function startDurableRenderWorker(options: DurableRenderWorkerOptions): DurableRenderWorker {
  const repository = new SupabaseVideoRenderJobRepository(options.supabase);
  const storage = createRenderStorageAdapter(options.supabase, options.supabaseUrl);
  const minFreeDiskBytes = options.minFreeDiskBytes ?? DEFAULT_MIN_FREE_DISK_BYTES;
  const maxMemoryBytes = options.maxMemoryBytes ?? Math.floor(totalmem() * 0.75);
  const workerId = randomUUID();
  const active = new Map<string, Promise<void>>();
  const shutdownController = new AbortController();
  let stopping = false;
  let ready = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  async function poll(): Promise<void> {
    if (stopping) return;
    try {
      while (!stopping && active.size < options.concurrency) {
        const job = await repository.claimNext(workerId, LEASE_SECONDS);
        if (!job) break;
        if (stopping) {
          if (job.leaseToken) await repository.releaseLeasedJob(job.id, job.leaseToken);
          break;
        }
        const controller = new AbortController();
        const onShutdown = () => controller.abort(new Error("Worker is shutting down."));
        shutdownController.signal.addEventListener("abort", onShutdown, { once: true });
        const task = processJob(
          job,
          repository,
          storage,
          options,
          minFreeDiskBytes,
          maxMemoryBytes,
          () => stopping,
          controller.signal,
        ).catch((error: unknown) => {
          log("error", "job_processor_crashed", {
            jobId: job.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }).finally(() => {
          active.delete(job.id);
          shutdownController.signal.removeEventListener("abort", onShutdown);
        });
        active.set(job.id, task);
      }
    } catch (error) {
      log("error", "queue_poll_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    if (!stopping) timer = setTimeout(() => void poll(), options.pollIntervalMs);
  }

  const startupTask = (async () => {
    await mkdir(options.scratchDirectory, { recursive: true });
    await assertResources(options.scratchDirectory, minFreeDiskBytes, maxMemoryBytes);
    await execFileAsync(options.ffmpegPath ?? process.env["FFMPEG_PATH"] ?? "ffmpeg", ["-version"], {
      timeout: 10_000,
      windowsHide: true,
    });
    await execFileAsync(options.ffprobePath ?? process.env["FFPROBE_PATH"] ?? "ffprobe", ["-version"], {
      timeout: 10_000,
      windowsHide: true,
    });
    if (stopping) return;
    ready = true;
    log("info", "worker_ready", {
      workerId,
      concurrency: options.concurrency,
      cpuCount: cpus().length,
      leaseSeconds: LEASE_SECONDS,
    });
    await poll();
  })().catch((error: unknown) => {
    ready = false;
    log("error", "worker_startup_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  });

  return {
    async close() {
      stopping = true;
      ready = false;
      shutdownController.abort();
      if (timer) clearTimeout(timer);
      await startupTask;
      await Promise.all(active.values());
      log("info", "worker_stopped", { workerId });
    },
    async isReady() {
      if (!ready || stopping) return false;
      try {
        await assertResources(options.scratchDirectory, minFreeDiskBytes, maxMemoryBytes);
        const { error } = await options.supabase.from("video_render_jobs").select("id").limit(1);
        if (error) return false;
        if (isLocalSupabaseUrl(options.supabaseUrl)) return true;
        const { error: storageError } = await options.supabase.storage.from("renders").list("", { limit: 1 });
        return !storageError;
      } catch {
        return false;
      }
    },
    activeJobCount() {
      return active.size;
    },
  };
}
