import type { Asset } from "../types/asset";
import type { GenerationJob, GenerationJobDraft, GenerationJobType } from "../types/generation-job";

import { isNonTransientFailure } from "@/platform/generation/types";

export const UNCONFIGURED_PROVIDER = "unconfigured";

/** Hard ceiling on provider attempts per job (attempt_count). Prevents retry loops and runaway spend. */
export const MAX_GENERATION_ATTEMPTS = 3;

/**
 * A running job without a provider task ID whose server-controlled `started_at` (written by the
 * atomic claim in /api/generation/run) is older than this most likely lost its server request
 * (crash between claim and persistence). The route's own limit is maxDuration = 60s, so 10 minutes
 * leaves a wide margin. The creator may then mark it failed with an UNKNOWN provider state.
 */
export const STALLED_RUNNING_JOB_MS = 10 * 60 * 1000;

export const STALLED_JOB_ERROR =
  "The server stopped before this generation result was saved, so the provider may have accepted (and billed) the request. Its status is unknown, so it was not retried to avoid a duplicate charge. Check the provider dashboard before starting a new attempt.";

/**
 * Job parameter keys that record a provider request whose outcome is unknown. They live in the
 * existing `generation_jobs.parameters` JSONB column (no schema change) and are never stripped by a
 * retry, so a stale browser tab cannot silently clear them.
 */
export const PROVIDER_STATE_UNKNOWN_AT = "providerStateUnknownAt";
export const PROVIDER_STATE_UNKNOWN_REASON = "providerStateUnknownReason";
/** Set only by an explicit creator confirmation that they checked the provider dashboard. */
export const PROVIDER_STATE_ACKNOWLEDGED_AT = "providerStateAcknowledgedAt";

export type ProviderStateUnknownReason = "timeout" | "network" | "provider-response" | "no-task-id" | "exception" | "stalled";

function providerLabel(provider: string | undefined): string {
  if (provider === "kling") return "Kling";
  if (provider === "openai-image") return "OpenAI";
  return "The provider";
}

/** Honest creator-facing message for a job whose provider state is unknown. */
export function providerStateUnknownMessage(job: Pick<GenerationJob, "provider" | "parameters">): string {
  const label = providerLabel(job.provider);
  const externalTaskId = typeof job.parameters.externalTaskId === "string" ? job.parameters.externalTaskId : undefined;
  const dashboard = label === "The provider" ? "the provider dashboard" : `the ${label} dashboard`;
  return (
    `${label} may have accepted this request; its status is unknown. It was not retried to avoid a duplicate charge. ` +
    `Check ${dashboard}${externalTaskId ? ` (external task ID ${externalTaskId})` : ""} before starting a new attempt.`
  );
}

/** True when the last provider request may have been accepted and the creator has not confirmed otherwise. */
export function hasUnknownProviderState(job: Pick<GenerationJob, "parameters">): boolean {
  const unknownAt = job.parameters[PROVIDER_STATE_UNKNOWN_AT];
  if (typeof unknownAt !== "string" || !unknownAt) return false;
  // withUnknownProviderState() removes any earlier acknowledgement, so one present here covers this request.
  const acknowledgedAt = job.parameters[PROVIDER_STATE_ACKNOWLEDGED_AT];
  return !(typeof acknowledgedAt === "string" && acknowledgedAt);
}

/** Records an unknown provider outcome on a job (any previous creator acknowledgement no longer applies). */
export function withUnknownProviderState<T extends Pick<GenerationJob, "parameters">>(
  job: T,
  at: string,
  reason: ProviderStateUnknownReason,
): T {
  const { [PROVIDER_STATE_ACKNOWLEDGED_AT]: _acknowledged, ...parameters } = job.parameters;
  void _acknowledged;
  return { ...job, parameters: { ...parameters, [PROVIDER_STATE_UNKNOWN_AT]: at, [PROVIDER_STATE_UNKNOWN_REASON]: reason } };
}

/**
 * Explicit creator decision after checking the provider dashboard: the unknown request did not
 * produce a task worth keeping, so a new paid attempt may be made. Never called automatically.
 */
export function acknowledgeUnknownProviderState(job: GenerationJob, at: string): GenerationJob {
  if (!hasUnknownProviderState(job)) throw new Error("This generation job has no unknown provider state to confirm.");
  // "queued" only happens when an older client re-queued an unknown job; the server still refuses it until confirmed.
  if (job.status !== "failed" && job.status !== "queued") {
    throw new Error(`Cannot confirm a provider check for a job in status "${job.status}".`);
  }
  return { ...job, parameters: { ...job.parameters, [PROVIDER_STATE_ACKNOWLEDGED_AT]: at } };
}

export interface JobDraftOptions {
  /** Production aspect ratio (e.g. "16:9", "2.39:1"); each provider maps it to a supported value. */
  aspectRatio?: string | null;
}
export const UNCONFIGURED_PROVIDER_ERROR =
  "No generation provider is configured. The job remains recoverable and no media was invented.";

const JOB_TYPE_BY_KIND: Partial<Record<Asset["kind"], GenerationJobType>> = {
  "character-reference": "image",
  "location-reference": "image",
  image: "image",
  video: "video",
  audio: "audio",
  music: "audio",
  document: "document",
};

export function jobTypeForAsset(asset: Pick<Asset, "kind">): GenerationJobType {
  return JOB_TYPE_BY_KIND[asset.kind] ?? "image";
}

export function isAssetGenerationSupported(asset: Pick<Asset, "kind">): boolean {
  const jobType = jobTypeForAsset(asset);
  return jobType === "image" || jobType === "video";
}

export function canGenerateAsset(asset: Pick<Asset, "kind" | "userApproved" | "prompt">): boolean {
  return isAssetGenerationSupported(asset) && asset.userApproved && Boolean(asset.prompt?.trim());
}

export function canCheckGenerationJobStatus(
  job: Pick<GenerationJob, "status" | "provider" | "parameters">,
): boolean {
  return (
    job.status === "running" &&
    Boolean(job.provider?.trim()) &&
    typeof job.parameters.providerJobId === "string" &&
    Boolean(job.parameters.providerJobId.trim())
  );
}

export function draftJobFromAsset(
  asset: Pick<Asset, "id" | "productionId" | "kind" | "prompt" | "sourceKind" | "sourceId">,
  options: JobDraftOptions = {},
): GenerationJobDraft {
  if (!isAssetGenerationSupported(asset)) {
    throw new Error("Generation is currently supported for image and video assets only.");
  }

  const prompt = asset.prompt?.trim();
  if (!prompt) {
    throw new Error("A generation job requires a prompt grounded in production records or filmmaker input.");
  }
  return {
    productionId: asset.productionId,
    assetId: asset.id,
    jobType: jobTypeForAsset(asset),
    status: "queued",
    prompt,
    parameters: jobParametersFromOptions(options),
    sourceEntityType: "asset",
    sourceEntityId: asset.id,
  };
}

export function jobParametersFromOptions(options: JobDraftOptions = {}): Record<string, unknown> {
  const aspectRatio = options.aspectRatio?.trim();
  return aspectRatio ? { aspect_ratio: aspectRatio } : {};
}

export function startJob(job: GenerationJob, startedAt = new Date().toISOString()): GenerationJob {
  if (job.status !== "queued") throw new Error(`Cannot start a generation job from status "${job.status}".`);
  return { ...job, status: "running", startedAt, errorMessage: undefined, attemptCount: job.attemptCount + 1 };
}

export function completeJob(job: GenerationJob, outputUrl: string, completedAt = new Date().toISOString()): GenerationJob {
  if (job.status !== "running") throw new Error(`Cannot complete a generation job from status "${job.status}".`);
  const url = outputUrl.trim();
  if (!url) throw new Error("A completed generation job requires an output URL from a provider.");
  return { ...job, status: "completed", outputUrl: url, errorMessage: undefined, completedAt };
}

export function failJob(job: GenerationJob, errorMessage: string, completedAt = new Date().toISOString()): GenerationJob {
  if (job.status !== "queued" && job.status !== "running") {
    throw new Error(`Cannot fail a generation job from status "${job.status}".`);
  }
  return { ...job, status: "failed", errorMessage: errorMessage.trim() || "Generation failed.", completedAt };
}

export function cancelJob(job: GenerationJob, completedAt = new Date().toISOString()): GenerationJob {
  if (job.status === "completed") throw new Error("A completed generation job cannot be cancelled.");
  return { ...job, status: "cancelled", completedAt };
}

export function hasReachedAttemptLimit(job: Pick<GenerationJob, "attemptCount">): boolean {
  return job.attemptCount >= MAX_GENERATION_ATTEMPTS;
}

export function canRetryJob(job: Pick<GenerationJob, "status" | "attemptCount"> & Partial<Pick<GenerationJob, "parameters">>): boolean {
  if (job.parameters && hasUnknownProviderState({ parameters: job.parameters })) return false;
  return (job.status === "failed" || job.status === "cancelled") && !hasReachedAttemptLimit(job);
}

/**
 * Re-queues a failed/cancelled job for an explicit creator retry.
 * - Clears the provider task ID and last failure so a fresh provider call is made.
 * - Drops the provider pin when the last failure was non-transient (configuration,
 *   unsupported job, inline data without storage) so selection can pick a provider that works.
 */
export function retryJob(job: GenerationJob): GenerationJob {
  if (job.status !== "failed" && job.status !== "cancelled") {
    throw new Error(`Cannot retry a generation job from status "${job.status}".`);
  }
  if (hasUnknownProviderState(job)) {
    throw new Error(providerStateUnknownMessage(job));
  }
  if (hasReachedAttemptLimit(job)) {
    throw new Error(
      `This generation job has used ${job.attemptCount} of ${MAX_GENERATION_ATTEMPTS} attempts. Review the prompt and provider configuration, then queue a new job.`,
    );
  }
  // The unknown-state markers are deliberately kept (audit trail); the attempt-specific task IDs are not.
  const { providerJobId: _taskId, externalTaskId: _externalTaskId, lastFailureKind, ...parameters } = job.parameters;
  void _taskId;
  void _externalTaskId;
  const unpinProvider = job.provider === UNCONFIGURED_PROVIDER || isNonTransientFailure(lastFailureKind);
  return {
    ...job,
    status: "queued",
    provider: unpinProvider ? undefined : job.provider,
    parameters,
    errorMessage: undefined,
    outputUrl: undefined,
    startedAt: undefined,
    completedAt: undefined,
  };
}

/** Database patch for a retry. Uses explicit nulls because undefined values are dropped by the mapper. */
export function retryPersistencePatch(retried: GenerationJob) {
  return {
    status: retried.status,
    provider: retried.provider ?? null,
    parameters: retried.parameters,
    error_message: null,
    output_url: null,
    started_at: null,
    completed_at: null,
  };
}

/**
 * A job is stalled only when ALL of the following hold:
 * - status is "running" (it actually entered RUNNING via the server's atomic claim);
 * - it has no provider task ID (a job with one is checked with "Check provider status" instead);
 * - `started_at` is present and at least `thresholdMs` before `now`.
 *
 * `started_at` is written only by the server claim (and cleared by a retry), so this does not depend
 * on any `updated_at` trigger. queued, completed, failed and cancelled jobs are never stalled, and a
 * running job without `started_at` is never stalled. `now` is passed in (no clock read here).
 */
export function isStalledJob(
  job: Pick<GenerationJob, "status" | "parameters" | "startedAt">,
  now: number,
  thresholdMs: number = STALLED_RUNNING_JOB_MS,
): boolean {
  if (job.status !== "running") return false;
  if (typeof job.parameters.providerJobId === "string" && job.parameters.providerJobId.trim()) return false;
  if (!job.startedAt) return false;
  const startedAt = Date.parse(job.startedAt);
  return Number.isFinite(startedAt) && Number.isFinite(now) && now - startedAt >= thresholdMs;
}

/**
 * The failed job written when the creator marks a stalled job. The provider may have accepted the
 * request before the server stopped, so the job is recorded with an UNKNOWN provider state and is
 * not retryable until the creator confirms they checked the provider. Never triggers a retry.
 */
export function markStalledJobFailed(job: GenerationJob, now: number, thresholdMs: number = STALLED_RUNNING_JOB_MS): GenerationJob {
  if (!isStalledJob(job, now, thresholdMs)) {
    throw new Error("Only running jobs without a provider task that started at least 10 minutes ago can be marked stalled.");
  }
  const at = new Date(now).toISOString();
  return withUnknownProviderState({ ...failJob(job, STALLED_JOB_ERROR, at) }, at, "stalled");
}

export function dispatchUnconfiguredProvider(job: GenerationJob): GenerationJob {
  const running = job.status === "queued" ? startJob(job) : job;
  return failJob(running, UNCONFIGURED_PROVIDER_ERROR);
}

export function planJobsFromAssets(
  assets: Array<Pick<Asset, "id" | "productionId" | "kind" | "prompt" | "sourceKind" | "sourceId" | "fileUrl" | "status">>,
): GenerationJobDraft[] {
  const drafts: GenerationJobDraft[] = [];
  for (const asset of assets) {
    if (
      !isAssetGenerationSupported(asset) ||
      asset.fileUrl?.trim() ||
      asset.status === "generating" ||
      !asset.prompt?.trim()
    ) continue;
    drafts.push(draftJobFromAsset(asset));
  }
  return drafts;
}

export function selectNewJobProposals(
  drafts: GenerationJobDraft[],
  existing: Array<Pick<GenerationJob, "assetId" | "status" | "jobType"> & Partial<Pick<GenerationJob, "parameters">>>,
): GenerationJobDraft[] {
  const blocking = new Set(
    existing
      .filter(
        (job) =>
          job.assetId &&
          (job.status === "queued" ||
            job.status === "running" ||
            job.status === "completed" ||
            // A possibly accepted provider request blocks a new paid job until the creator confirms.
            (job.parameters !== undefined && hasUnknownProviderState({ parameters: job.parameters }))),
      )
      .map((job) => `${job.assetId}:${job.jobType}`),
  );
  return drafts.filter((draft) => !draft.assetId || !blocking.has(`${draft.assetId}:${draft.jobType}`));
}

export function selectQueuedJobsForApprovedAssets(
  productionId: string,
  jobs: GenerationJob[],
  assets: Array<Pick<Asset, "id" | "productionId" | "kind" | "prompt" | "userApproved">>,
): Array<{ job: GenerationJob; assetId: string }> {
  const approvedById = new Map(
    assets
      .filter((asset) => asset.productionId === productionId && canGenerateAsset(asset))
      .map((asset) => [asset.id, asset]),
  );

  return jobs.flatMap((job) => {
    if (job.status !== "queued" || job.productionId !== productionId || !job.assetId) {
      return [];
    }

    const asset = approvedById.get(job.assetId);
    if (!asset || job.jobType !== jobTypeForAsset(asset)) return [];

    return [{ job, assetId: asset.id }];
  });
}

/**
 * Provenance after a successful generation: production-derived records become "generated".
 * Creator-authored ("user") records keep their provenance so creator ownership is never erased.
 */
export function provenanceAfterGeneration(asset: Pick<Asset, "provenance">): Asset["provenance"] {
  return asset.provenance === "user" ? "user" : "generated";
}

export function applyJobResultToAsset(
  asset: Asset,
  job: Pick<GenerationJob, "status" | "outputUrl" | "errorMessage">,
): Pick<Asset, "fileUrl" | "status" | "uncertaintyNotes"> & Partial<Pick<Asset, "provenance">> {
  if (job.status === "completed" && job.outputUrl) {
    return { fileUrl: job.outputUrl, status: "ready", uncertaintyNotes: undefined, provenance: provenanceAfterGeneration(asset) };
  }
  if (job.status === "running" || job.status === "queued") {
    return { fileUrl: asset.fileUrl, status: "generating", uncertaintyNotes: asset.uncertaintyNotes };
  }
  if (job.status === "failed") {
    return { fileUrl: asset.fileUrl, status: "failed", uncertaintyNotes: job.errorMessage || asset.uncertaintyNotes };
  }
  return { fileUrl: asset.fileUrl, status: asset.fileUrl ? "ready" : "draft", uncertaintyNotes: asset.uncertaintyNotes };
}

export function jobPersistencePatch(
  job: Pick<
    GenerationJob,
    "status" | "provider" | "model" | "outputUrl" | "errorMessage" | "attemptCount" | "startedAt" | "completedAt"
  > & Partial<Pick<GenerationJob, "parameters">>,
): Partial<GenerationJob> {
  return {
    ...(job.parameters ? { parameters: job.parameters } : {}),
    status: job.status,
    provider: job.provider,
    model: job.model,
    outputUrl: job.outputUrl,
    errorMessage: job.errorMessage,
    attemptCount: job.attemptCount,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
  };
}
