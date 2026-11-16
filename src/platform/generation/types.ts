export type MediaJobType = "image" | "video";

export type MediaGenerationStatus = "completed" | "failed" | "running";

/**
 * Why a provider could not deliver media. Used to decide whether a retry may
 * reuse the same provider (transient) or must re-resolve one (non-transient).
 */
export type MediaFailureKind =
  | "configuration"
  | "unsupported-job"
  | "inline-data-requires-storage"
  | "timeout"
  | "provider"
  | "network";

export const NON_TRANSIENT_FAILURE_KINDS: readonly MediaFailureKind[] = [
  "configuration",
  "unsupported-job",
  "inline-data-requires-storage",
];

export function isNonTransientFailure(kind: unknown): boolean {
  return typeof kind === "string" && (NON_TRANSIENT_FAILURE_KINDS as readonly string[]).includes(kind);
}

export interface MediaGenerationRequest {
  jobType: MediaJobType;
  prompt: string;
  parameters?: Record<string, unknown>;
  referenceImageUrl?: string;
  /**
   * Deterministic client-supplied task ID (derived from the job ID and attempt number). Providers that
   * support one (Kling `external_task_id`) send it so a request whose outcome is unknown can later be
   * looked up at the provider. Providers without such a field ignore it.
   */
  clientTaskId?: string;
}

export interface MediaGenerationResult {
  status: MediaGenerationStatus;
  provider: string;
  model?: string;
  outputUrl?: string;
  /** Inline image bytes are transient provider output and must be uploaded before completion is persisted. */
  outputBase64?: string;
  outputMimeType?: string;
  providerJobId?: string;
  errorMessage?: string;
  failureKind?: MediaFailureKind;
  /**
   * True when the request may have reached the provider but its outcome is unknown (timeout after
   * sending, connection lost after sending, provider 5xx, unreadable success response). Such a job
   * must not be retried automatically, because the provider may already be running (and billing) it.
   */
  providerStateUnknown?: boolean;
}

export interface MediaGenerationProvider {
  readonly id: string;
  readonly supports: readonly MediaJobType[];
  /** Whether `generate` forwards `clientTaskId` to the provider so the task can be looked up later. */
  readonly acceptsClientTaskId?: boolean;
  isConfigured(): boolean;
  /**
   * Whether the provider can return a durable http(s) media URL for this job
   * type with its current configuration. Providers that can only return inline
   * (base64) data cannot complete a job until durable storage exists.
   * Defaults to true when not implemented.
   */
  canDeliverUrl?(jobType: MediaJobType): boolean;
  generate(request: MediaGenerationRequest): Promise<MediaGenerationResult>;
  checkStatus?(providerJobId: string, jobType: MediaJobType): Promise<MediaGenerationResult>;
}

export interface GenerationEnvironment {
  KLING_ACCESS_KEY?: string;
  KLING_SECRET_KEY?: string;
  KLING_API_KEY?: string;
  KLING_API_BASE_URL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_IMAGE_MODEL?: string;
  SUPABASE_MEDIA_BUCKET?: string;
}

export function readGenerationEnvironment(
  env: NodeJS.ProcessEnv | GenerationEnvironment = process.env,
): GenerationEnvironment {
  return {
    KLING_ACCESS_KEY: env.KLING_ACCESS_KEY,
    KLING_SECRET_KEY: env.KLING_SECRET_KEY,
    KLING_API_KEY: env.KLING_API_KEY,
    KLING_API_BASE_URL: env.KLING_API_BASE_URL,
    OPENAI_API_KEY: env.OPENAI_API_KEY,
    OPENAI_IMAGE_MODEL: env.OPENAI_IMAGE_MODEL,
    SUPABASE_MEDIA_BUCKET: env.SUPABASE_MEDIA_BUCKET,
  };
}

export const UNCONFIGURED_MEDIA_PROVIDER = "unconfigured";
export const UNCONFIGURED_MEDIA_ERROR =
  "No generation provider is configured. The job remains recoverable and no media was invented.";

export const INLINE_DATA_REQUIRES_STORAGE_ERROR =
  "The image provider returned inline image data, but durable media storage is not configured. Configure the production-media Supabase Storage bucket and its owner-only policies before retrying.";

/** Default ceiling for a single provider HTTP call made from a request handler. */
export const PROVIDER_REQUEST_TIMEOUT_MS = 45_000;
