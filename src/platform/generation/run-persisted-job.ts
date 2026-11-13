/**
 * Server-side orchestration for one persisted generation job.
 *
 * Invariants:
 * - A queued job is claimed atomically (conditional UPDATE ... WHERE status = 'queued') before
 *   any provider call, so two requests (double click, two tabs, retry after a dropped response)
 *   cannot both start a paid provider task.
 * - The provider result (task ID, output URL, failure) is persisted by the server, not the browser.
 * - The linked asset is moved to "generating" on claim and to its final state after dispatch,
 *   so it is never left "generating" after a failure the server observed.
 *
 * - A job whose last provider request has an UNKNOWN outcome (timeout after sending, connection lost,
 *   provider 5xx, accepted without a task ID, or marked stalled) is never dispatched again, and no
 *   other job for the same asset is dispatched either, until the creator explicitly confirms they
 *   checked the provider dashboard. This is enforced here, on the server, not only in the UI.
 *
 * Residual risk (documented, not solvable without a worker/webhook): if the server process dies
 * after the provider accepted a task but before the result is saved, the job stays "running"
 * without a task ID. After STALLED_RUNNING_JOB_MS (measured from the server-written started_at) the
 * creator can mark it stalled, which records it as failed with an unknown provider state.
 * Kling create requests carry a deterministic external_task_id (ks-<job id>-<attempt>) so a future
 * reconciliation step can look the task up; no reconciliation is implemented.
 */
import { withCalculatedProgress } from "@/features/assets/services/asset-completion";
import {
  applyJobResultToAsset,
  hasReachedAttemptLimit,
  hasUnknownProviderState,
  MAX_GENERATION_ATTEMPTS,
  providerStateUnknownMessage,
} from "@/features/assets/services/generation-job";
import type { Asset } from "@/features/assets/types/asset";
import type { GenerationJob } from "@/features/assets/types/generation-job";
import { canDispatchPersistedJob } from "./dispatch-authorization";
import { dispatchGenerationJob, type DispatchDependencies } from "./dispatch";

export interface PersistedJobStore {
  loadJob(jobId: string): Promise<GenerationJob | null>;
  loadAsset(assetId: string): Promise<Asset | null>;
  /** All jobs for an asset (RLS-scoped), used to refuse a new paid dispatch while another is unknown. */
  loadAssetJobs(assetId: string): Promise<GenerationJob[]>;
  /** Conditional claim: only succeeds while the row is still queued with the expected attempt count. */
  claimQueuedJob(job: GenerationJob, startedAt: string): Promise<GenerationJob | null>;
  /** Conditional save: only succeeds while the row is still running. */
  saveJobResult(job: GenerationJob): Promise<GenerationJob | null>;
  updateAsset(assetId: string, patch: Partial<Asset>): Promise<Asset | null>;
}

export type RunPersistedJobOutcome =
  | { ok: true; status: 200; job: GenerationJob; asset: Asset | null; warning?: string }
  | { ok: false; status: 404 | 409 | 500; error: string; job?: GenerationJob };

export interface RunDependencies extends DispatchDependencies {
  dispatch?: typeof dispatchGenerationJob;
}

export async function runPersistedGenerationJob(
  jobId: string,
  store: PersistedJobStore,
  deps: RunDependencies = {},
): Promise<RunPersistedJobOutcome> {
  const job = await store.loadJob(jobId);
  if (!job) return { ok: false, status: 404, error: "Generation job not found or access denied." };

  const asset = job.assetId ? await store.loadAsset(job.assetId) : null;
  const authority = asset ? { id: asset.id, productionId: asset.productionId, userApproved: asset.userApproved } : null;
  if (!canDispatchPersistedJob(job, authority)) {
    return {
      ok: false,
      status: 409,
      job,
      error:
        job.status === "running"
          ? "This generation job is already running. Use “Check provider status” once the provider has returned a task ID."
          : "Only queued jobs or running jobs with a provider task ID for creator-approved assets can be dispatched.",
    };
  }

  let active = job;
  if (job.status === "queued") {
    // Never start a new paid provider task while a previous request may have been accepted.
    if (hasUnknownProviderState(job)) {
      return { ok: false, status: 409, job, error: providerStateUnknownMessage(job) };
    }
    const unknownSibling = job.assetId
      ? (await store.loadAssetJobs(job.assetId)).find(
          (other) => other.id !== job.id && other.jobType === job.jobType && hasUnknownProviderState(other),
        )
      : undefined;
    if (unknownSibling) {
      return { ok: false, status: 409, job, error: providerStateUnknownMessage(unknownSibling) };
    }
    if (hasReachedAttemptLimit(job)) {
      return {
        ok: false,
        status: 409,
        job,
        error: `This generation job has already used ${job.attemptCount} of ${MAX_GENERATION_ATTEMPTS} attempts.`,
      };
    }
    const startedAt = deps.now?.() ?? new Date().toISOString();
    const claimed = await store.claimQueuedJob(job, startedAt);
    if (!claimed) {
      return {
        ok: false,
        status: 409,
        job,
        error: "This generation job was already claimed by another request. Refresh to see its current status.",
      };
    }
    active = claimed;
    if (asset) await store.updateAsset(asset.id, { status: "generating" }).catch(() => null);
  }

  const dispatch = deps.dispatch ?? dispatchGenerationJob;
  const dispatched = await dispatch(active, deps);

  let saved: GenerationJob | null;
  try {
    saved = await store.saveJobResult(dispatched);
  } catch (error) {
    const taskId = typeof dispatched.parameters.providerJobId === "string" ? ` Provider task ID: ${dispatched.parameters.providerJobId}.` : "";
    return {
      ok: false,
      status: 500,
      error: `The provider responded but the result could not be saved (${error instanceof Error ? error.message : "database error"}).${taskId}`,
    };
  }
  if (!saved) {
    return {
      ok: false,
      status: 409,
      job: dispatched,
      error: "The job changed while the provider was running (for example it was marked stalled). The provider result was not saved.",
    };
  }

  if (!asset) return { ok: true, status: 200, job: saved, asset: null };

  const patch = applyJobResultToAsset(asset, saved);
  const scored = withCalculatedProgress({ ...asset, ...patch });
  const updatedAsset = await store
    .updateAsset(asset.id, { ...patch, progress: scored.progress, status: patch.status })
    .catch(() => null);
  if (!updatedAsset) {
    return {
      ok: true,
      status: 200,
      job: saved,
      asset: { ...asset, ...patch },
      warning: "The job result was saved, but the asset could not be updated. Refresh the Assets page.",
    };
  }
  return { ok: true, status: 200, job: saved, asset: updatedAsset };
}
