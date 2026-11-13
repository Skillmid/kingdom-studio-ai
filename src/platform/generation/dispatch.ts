import {
  completeJob,
  failJob,
  providerStateUnknownMessage,
  startJob,
  withUnknownProviderState,
  type ProviderStateUnknownReason,
} from "@/features/assets/services/generation-job";
import type { GenerationJob } from "@/features/assets/types/generation-job";
import { isMediaJobType, resolveMediaProvider } from "./registry";
import { createTimeoutFetch, isTimeoutError, withDeadline } from "./timeout";
import {
  PROVIDER_REQUEST_TIMEOUT_MS,
  UNCONFIGURED_MEDIA_ERROR,
  UNCONFIGURED_MEDIA_PROVIDER,
  type GenerationEnvironment,
  type MediaFailureKind,
  type MediaGenerationProvider,
  type MediaGenerationResult,
} from "./types";

export interface DispatchDependencies {
  env?: GenerationEnvironment;
  fetchImpl?: typeof fetch;
  resolveProvider?: typeof resolveMediaProvider;
  now?: () => string;
  /** Ceiling for a single provider call. Defaults to PROVIDER_REQUEST_TIMEOUT_MS. */
  timeoutMs?: number;
}

/** Records why the last attempt failed so retries can decide whether to re-resolve the provider. */
function withFailureKind(job: GenerationJob, kind: MediaFailureKind | undefined): GenerationJob {
  if (!kind) return job;
  return { ...job, parameters: { ...job.parameters, lastFailureKind: kind } };
}

function fail(job: GenerationJob, message: string, now: string, kind?: MediaFailureKind): GenerationJob {
  return withFailureKind(failJob(job, message, now), kind);
}

/**
 * Deterministic client task ID for one attempt of one job. Sent to providers that accept it (Kling
 * `external_task_id`), so a request whose outcome is unknown can later be looked up at the provider
 * even if the server stopped before saving anything: it can always be recomputed from the job row.
 */
export function clientTaskIdForJob(job: Pick<GenerationJob, "id" | "attemptCount">): string {
  return `ks-${job.id}-${job.attemptCount}`;
}

/**
 * The provider may have accepted (and billed) the request but the outcome is unknown. The job is
 * failed (an existing status value) with the unknown-state marker in `parameters`, so it can never be
 * re-dispatched or retried automatically. See hasUnknownProviderState().
 */
function failWithUnknownProviderState(
  job: GenerationJob,
  detail: string,
  now: string,
  kind: MediaFailureKind,
  reason: ProviderStateUnknownReason,
): GenerationJob {
  const marked = withUnknownProviderState(job, now, reason);
  return fail(marked, `${providerStateUnknownMessage(marked)} Detail: ${detail}`, now, kind);
}

export async function dispatchGenerationJob(job: GenerationJob, deps: DispatchDependencies = {}): Promise<GenerationJob> {
  const now = deps.now?.() ?? new Date().toISOString();
  const timeoutMs = deps.timeoutMs ?? PROVIDER_REQUEST_TIMEOUT_MS;
  const running = job.status === "queued" ? startJob(job, now) : job;
  const prompt = running.prompt?.trim();
  if (!prompt) {
    return fail(running, "A generation job requires a prompt grounded in production records or filmmaker input.", now, "unsupported-job");
  }
  if (!isMediaJobType(running.jobType)) {
    return fail(
      running,
      `${running.jobType} generation is not implemented. The job remains recoverable and no media was invented.`,
      now,
      "unsupported-job",
    );
  }
  const fetchImpl = createTimeoutFetch(deps.fetchImpl ?? fetch, timeoutMs);
  const provider: MediaGenerationProvider =
    deps.resolveProvider?.(running.jobType, deps.env, fetchImpl, running.provider) ??
    resolveMediaProvider(running.jobType, deps.env, fetchImpl, running.provider);
  const existingJobId = typeof running.parameters.providerJobId === "string" ? running.parameters.providerJobId : undefined;
  const clientTaskId = !existingJobId && provider.acceptsClientTaskId ? clientTaskIdForJob(running) : undefined;
  const labeled: GenerationJob = {
    ...running,
    provider: provider.id,
    parameters: clientTaskId ? { ...running.parameters, externalTaskId: clientTaskId } : running.parameters,
  };
  if (!provider.isConfigured()) return fail(labeled, UNCONFIGURED_MEDIA_ERROR, now, "configuration");
  if (existingJobId && !provider.checkStatus) {
    return fail(labeled, `The ${provider.id} provider cannot check the status of an existing generation job.`, now, "unsupported-job");
  }
  let result: MediaGenerationResult;
  try {
    const call =
      existingJobId && provider.checkStatus
        ? provider.checkStatus(existingJobId, running.jobType)
        : provider.generate({
            jobType: running.jobType,
            prompt,
            parameters: labeled.parameters,
            referenceImageUrl:
              typeof labeled.parameters.referenceImageUrl === "string" ? labeled.parameters.referenceImageUrl : undefined,
            clientTaskId,
          });
    // Belt and braces: providers that do not use the injected fetch still cannot hang the request.
    result = await withDeadline(call, timeoutMs + 1_000);
  } catch (error) {
    const timedOut = isTimeoutError(error);
    const message = error instanceof Error ? error.message : "Generation provider failed.";
    if (existingJobId) {
      // The provider task may still be running; keep it checkable instead of discarding the task ID.
      return { ...labeled, errorMessage: `Status check did not complete: ${error instanceof Error ? error.message : "unknown error"}` };
    }
    // The provider call was started and did not report a classified outcome: it may have been accepted.
    return failWithUnknownProviderState(labeled, message, now, timedOut ? "timeout" : "provider", timedOut ? "timeout" : "exception");
  }
  if (
    !existingJobId &&
    result.status === "failed" &&
    (result.providerStateUnknown || result.failureKind === "timeout")
  ) {
    const reason: ProviderStateUnknownReason =
      result.failureKind === "timeout" ? "timeout" : result.failureKind === "network" ? "network" : "provider-response";
    return failWithUnknownProviderState(
      { ...labeled, model: result.model || labeled.model },
      result.errorMessage || "The provider did not confirm the outcome.",
      now,
      result.failureKind ?? "provider",
      reason,
    );
  }
  if (
    existingJobId &&
    result.status === "failed" &&
    (result.failureKind === "network" || result.failureKind === "timeout")
  ) {
    // A failed *status check* is not a failed provider task. Keep the job running and checkable.
    return {
      ...labeled,
      errorMessage: `Status check did not complete: ${result.errorMessage ?? "network error"}. The provider task is still pending.`,
    };
  }
  // A status check whose response omits the task ID keeps the ID it was checking.
  const taskId = result.providerJobId?.trim() || existingJobId;
  if (result.status === "running" && !taskId) {
    // The provider answered "accepted/running" but gave no task ID: it may be generating (and billing)
    // a task that cannot be checked. Never treat this as an ordinary retryable failure.
    return failWithUnknownProviderState(
      { ...labeled, model: result.model || labeled.model },
      "Generation provider returned a running job without a task ID, so its status cannot be checked.",
      now,
      "provider",
      "no-task-id",
    );
  }
  const { lastFailureKind: _previousFailure, ...cleanParameters } = labeled.parameters;
  void _previousFailure;
  const withProvider: GenerationJob = {
    ...labeled,
    provider: result.provider || provider.id,
    model: result.model || labeled.model,
    errorMessage: undefined,
    parameters: { ...cleanParameters, ...(taskId ? { providerJobId: taskId } : {}) },
  };
  if (result.status === "completed") {
    const outputUrl = result.outputUrl?.trim();
    if (!outputUrl) return fail(withProvider, "Provider completed without a media URL. No file URL was invented.", now, "provider");
    return completeJob(withProvider, outputUrl, now);
  }
  if (result.status === "failed") {
    return fail(withProvider, result.errorMessage || UNCONFIGURED_MEDIA_ERROR, now, result.failureKind ?? "provider");
  }
  return withProvider;
}

export function isUnconfiguredResult(job: Pick<GenerationJob, "provider" | "errorMessage">): boolean {
  return job.provider === UNCONFIGURED_MEDIA_PROVIDER || job.errorMessage === UNCONFIGURED_MEDIA_ERROR;
}
