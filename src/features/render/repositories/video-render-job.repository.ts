import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateVideoRenderJobInput, VideoRenderFailureCode, VideoRenderJob } from "../types/video-render-job";
import {
  createVideoRenderJob,
  claimVideoRenderJob,
  cancelVideoRenderJob,
  retryVideoRenderJob,
} from "../services/video-render-worker";

export interface IVideoRenderJobRepository {
  create(input: CreateVideoRenderJobInput): Promise<VideoRenderJob>;
  findById(id: string): Promise<VideoRenderJob | null>;
  findByProductionId(productionId: string): Promise<VideoRenderJob[]>;
  cancel(id: string, reason?: string): Promise<VideoRenderJob>;
  retry(id: string): Promise<VideoRenderJob>;
}

/**
 * In-memory repository implementation for local development, fast automated test isolation,
 * and reliable execution without external network dependencies.
 */
export class InMemoryVideoRenderJobRepository implements IVideoRenderJobRepository {
  private readonly jobs = new Map<string, VideoRenderJob>();

  async create(input: CreateVideoRenderJobInput): Promise<VideoRenderJob> {
    const job = createVideoRenderJob(input);
    this.jobs.set(job.id, job);
    return { ...job };
  }

  async findById(id: string): Promise<VideoRenderJob | null> {
    const job = this.jobs.get(id);
    return job ? { ...job } : null;
  }

  async findByProductionId(productionId: string): Promise<VideoRenderJob[]> {
    const results: VideoRenderJob[] = [];
    for (const job of this.jobs.values()) {
      if (job.productionId === productionId) {
        results.push({ ...job });
      }
    }
    return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async claim(id: string, startedAt?: string): Promise<VideoRenderJob | null> {
    const job = this.jobs.get(id);
    if (!job) return null;

    const { claimed, job: claimedJob } = claimVideoRenderJob(job, startedAt);
    if (!claimed) return null;

    this.jobs.set(id, claimedJob);
    return { ...claimedJob };
  }

  async update(id: string, updates: Partial<VideoRenderJob>): Promise<VideoRenderJob> {
    const job = this.jobs.get(id);
    if (!job) {
      throw new Error(`Video render job '${id}' not found.`);
    }

    const updatedJob: VideoRenderJob = {
      ...job,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.jobs.set(id, updatedJob);
    return { ...updatedJob };
  }

  async updateProgress(id: string, progress: number): Promise<VideoRenderJob | null> {
    const job = this.jobs.get(id);
    if (!job || job.status !== "running") return null;
    return this.update(id, { progress: Math.max(job.progress, Math.min(99, progress)) });
  }

  async finalizeExecution(id: string, result: VideoRenderJob): Promise<VideoRenderJob | null> {
    const job = this.jobs.get(id);
    if (!job || job.status !== "running") return null;
    return this.update(id, result);
  }

  async cancel(id: string, reason?: string): Promise<VideoRenderJob> {
    const job = this.jobs.get(id);
    if (!job) {
      throw new Error(`Video render job '${id}' not found.`);
    }

    const cancelledJob = cancelVideoRenderJob(job, reason);
    this.jobs.set(id, cancelledJob);
    return { ...cancelledJob };
  }

  async retry(id: string): Promise<VideoRenderJob> {
    const job = this.jobs.get(id);
    if (!job) {
      throw new Error(`Video render job '${id}' not found.`);
    }

    const retriedJob = retryVideoRenderJob(job);
    this.jobs.set(id, retriedJob);
    return { ...retriedJob };
  }

  clear(): void {
    this.jobs.clear();
  }
}

/**
 * SupabaseVideoRenderJobRepository handles database persistence when configured.
 */
export class SupabaseVideoRenderJobRepository implements IVideoRenderJobRepository {
  private readonly supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async create(input: CreateVideoRenderJobInput): Promise<VideoRenderJob> {
    const job = createVideoRenderJob(input);
    const { data, error } = await this.supabase
      .from("video_render_jobs")
      .insert({
        id: job.id,
        production_id: job.productionId,
        render_id: job.renderId,
        status: job.status,
        progress: job.progress,
        attempts: job.attempts,
        max_attempts: job.maxAttempts,
        retryable: job.retryable,
        cancel_requested: job.cancelRequested,
        clips: job.clips,
        config: job.config,
        warnings: job.warnings,
        created_at: job.createdAt,
        updated_at: job.updatedAt,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create video render job in Supabase: ${error.message}`);
    }

    return this.fromRow(data);
  }

  async findById(id: string): Promise<VideoRenderJob | null> {
    const { data, error } = await this.supabase
      .from("video_render_jobs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load video render job '${id}': ${error.message}`);
    }

    return data ? this.fromRow(data) : null;
  }

  async findByProductionId(productionId: string): Promise<VideoRenderJob[]> {
    const { data, error } = await this.supabase
      .from("video_render_jobs")
      .select("*")
      .eq("production_id", productionId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list video render jobs for production '${productionId}': ${error.message}`);
    }

    return (data ?? []).map((row: unknown) => this.fromRow(row));
  }

  async claimNext(workerId: string, leaseSeconds: number): Promise<VideoRenderJob | null> {
    const { data, error } = await this.supabase.rpc("claim_video_render_job", {
      p_worker_id: workerId,
      p_lease_seconds: leaseSeconds,
    });
    if (error) throw new Error(`Unable to claim the next render job: ${error.message}`);
    const row = Array.isArray(data) ? data[0] : data;
    return row ? this.fromRow(row) : null;
  }

  async heartbeat(id: string, leaseToken: string, leaseSeconds: number): Promise<VideoRenderJob | null> {
    const { data, error } = await this.supabase.rpc("heartbeat_video_render_job", {
      p_job_id: id,
      p_lease_token: leaseToken,
      p_lease_seconds: leaseSeconds,
    });
    if (error) throw new Error(`Unable to renew render lease '${id}': ${error.message}`);
    const row = Array.isArray(data) ? data[0] : data;
    return row ? this.fromRow(row) : null;
  }

  async updateLeasedProgress(id: string, leaseToken: string, progress: number): Promise<VideoRenderJob | null> {
    const { data, error } = await this.supabase.rpc("update_video_render_progress", {
      p_job_id: id,
      p_lease_token: leaseToken,
      p_progress: progress,
    });
    if (error) throw new Error(`Unable to persist render progress '${id}': ${error.message}`);
    const row = Array.isArray(data) ? data[0] : data;
    return row ? this.fromRow(row) : null;
  }

  async completeLeasedJob(id: string, leaseToken: string, result: VideoRenderJob): Promise<VideoRenderJob | null> {
    if (!result.storageKey || !result.storageUrl || !result.fileSizeBytes || !result.durationSeconds) {
      throw new Error("Cannot complete a render without validated output and private storage metadata.");
    }
    const { data, error } = await this.supabase.rpc("complete_video_render_job", {
      p_job_id: id,
      p_lease_token: leaseToken,
      p_storage_key: result.storageKey,
      p_storage_url: result.storageUrl,
      p_file_size_bytes: result.fileSizeBytes,
      p_duration_seconds: result.durationSeconds,
      p_warnings: result.warnings,
    });
    if (error) throw new Error(`Unable to complete render job '${id}': ${error.message}`);
    const row = Array.isArray(data) ? data[0] : data;
    return row ? this.fromRow(row) : null;
  }

  async failLeasedJob(
    id: string,
    leaseToken: string,
    failureCode: VideoRenderFailureCode,
    message: string,
    retryable: boolean,
  ): Promise<VideoRenderJob | null> {
    const { data, error } = await this.supabase.rpc("fail_video_render_job", {
      p_job_id: id,
      p_lease_token: leaseToken,
      p_failure_code: failureCode,
      p_error: message,
      p_retryable: retryable,
    });
    if (error) throw new Error(`Unable to record render failure '${id}': ${error.message}`);
    const row = Array.isArray(data) ? data[0] : data;
    return row ? this.fromRow(row) : null;
  }

  async releaseLeasedJob(id: string, leaseToken: string): Promise<VideoRenderJob | null> {
    const { data, error } = await this.supabase.rpc("release_video_render_job", {
      p_job_id: id,
      p_lease_token: leaseToken,
    });
    if (error) throw new Error(`Unable to release render lease '${id}': ${error.message}`);
    const row = Array.isArray(data) ? data[0] : data;
    return row ? this.fromRow(row) : null;
  }

  async cancel(id: string, reason?: string): Promise<VideoRenderJob> {
    const { data, error } = await this.supabase.rpc("cancel_video_render_job", {
      p_job_id: id,
      p_reason: reason ?? null,
    });
    if (error) throw new Error(`Failed to cancel video render job '${id}': ${error.message}`);
    const row = Array.isArray(data) ? data[0] : data;
    if (row) return this.fromRow(row);
    throw new Error(`Video render job '${id}' could not be cancelled or is not owned by this user.`);
  }

  async retry(id: string): Promise<VideoRenderJob> {
    const { data, error } = await this.supabase.rpc("retry_video_render_job", { p_job_id: id });
    if (error) throw new Error(`Failed to retry video render job '${id}': ${error.message}`);
    const row = Array.isArray(data) ? data[0] : data;
    if (row) return this.fromRow(row);
    throw new Error(`Video render job '${id}' is not eligible for retry or is not owned by this user.`);
  }

  private fromRow(row: unknown): VideoRenderJob {
    const r = row as {
      id: string;
      production_id: string;
      render_id?: string;
      status: VideoRenderJob["status"];
      progress: number;
      attempts: number;
      max_attempts: number;
      retryable?: boolean;
      failure_code?: VideoRenderFailureCode;
      cancel_requested?: boolean;
      lease_owner?: string;
      lease_token?: string;
      lease_expires_at?: string;
      next_attempt_at?: string;
      storage_key?: string;
      output_path?: string;
      storage_url?: string;
      file_size_bytes?: number;
      duration_seconds?: number;
      error?: string;
      warnings?: string[];
      clips: VideoRenderJob["clips"];
      config: VideoRenderJob["config"];
      started_at?: string;
      completed_at?: string;
      created_at: string;
      updated_at: string;
    };

    return {
      id: r.id,
      productionId: r.production_id,
      renderId: r.render_id,
      status: r.status,
      progress: r.progress ?? 0,
      attempts: r.attempts,
      maxAttempts: r.max_attempts,
      outputPath: r.output_path,
      storageUrl: r.storage_url,
      fileSizeBytes: r.file_size_bytes,
      durationSeconds: r.duration_seconds,
      error: r.error,
      failureCode: r.failure_code,
      retryable: r.retryable ?? false,
      cancelRequested: r.cancel_requested ?? false,
      warnings: r.warnings ?? [],
      clips: r.clips ?? [],
      config: r.config ?? {},
      startedAt: r.started_at,
      completedAt: r.completed_at,
      leaseOwner: r.lease_owner,
      leaseToken: r.lease_token,
      leaseExpiresAt: r.lease_expires_at,
      nextAttemptAt: r.next_attempt_at,
      storageKey: r.storage_key,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
}
