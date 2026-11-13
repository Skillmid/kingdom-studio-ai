import type { VideoClipInput, VideoRenderConfig } from "../services/video-render-engine";

export type VideoRenderJobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type VideoRenderFailureCode =
  | "worker_lease_expired"
  | "worker_shutdown"
  | "worker_resource_limit"
  | "source_url_invalid"
  | "source_fetch_failed"
  | "unsupported_media_type"
  | "input_too_large"
  | "ffmpeg_failed"
  | "ffmpeg_timeout"
  | "output_validation_failed"
  | "storage_upload_failed"
  | "cancelled"
  | "unknown";

export interface VideoRenderJob {
  id: string;
  productionId: string;
  renderId?: string;
  status: VideoRenderJobStatus;
  progress: number;
  attempts: number;
  maxAttempts: number;
  outputPath?: string;
  storageUrl?: string;
  fileSizeBytes?: number;
  durationSeconds?: number;
  error?: string;
  failureCode?: VideoRenderFailureCode;
  retryable: boolean;
  warnings: string[];
  clips: VideoClipInput[];
  config: VideoRenderConfig;
  startedAt?: string;
  completedAt?: string;
  leaseOwner?: string;
  leaseToken?: string;
  leaseExpiresAt?: string;
  nextAttemptAt?: string;
  cancelRequested: boolean;
  storageKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVideoRenderJobInput {
  productionId: string;
  renderId?: string;
  clips: VideoClipInput[];
  config?: VideoRenderConfig;
  maxAttempts?: number;
}
