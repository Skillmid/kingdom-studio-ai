import type { Asset, AssetProposal } from "../types/asset";
import type {
  GenerationJob,
  GenerationJobProposal,
  GenerationJobStatus,
  GenerationJobType,
} from "../types/generation-job";
import { inferJobTypeForAsset } from "./asset-planner";

const ALLOWED_TRANSITIONS: Record<GenerationJobStatus, GenerationJobStatus[]> = {
  queued: ["running", "cancelled"],
  running: ["completed", "failed", "cancelled"],
  failed: ["queued"],
  cancelled: ["queued"],
  completed: [],
};

function clean(value?: string): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function canTransitionJob(from: GenerationJobStatus, to: GenerationJobStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function transitionJob<T extends Pick<GenerationJob, "status" | "attemptCount">>(
  job: T,
  nextStatus: GenerationJobStatus,
  extras: {
    now?: string;
    outputUrl?: string;
    errorMessage?: string;
    externalJobId?: string;
    outputAssetId?: string;
  } = {},
): T & {
  status: GenerationJobStatus;
  attemptCount: number;
  startedAt?: string;
  completedAt?: string;
  outputUrl?: string;
  errorMessage?: string;
  externalJobId?: string;
  outputAssetId?: string;
} {
  if (!canTransitionJob(job.status, nextStatus)) {
    throw new Error(`Cannot move a ${job.status} generation job to ${nextStatus}.`);
  }

  const now = extras.now ?? new Date().toISOString();
  const next = {
    ...job,
    status: nextStatus,
    attemptCount: job.attemptCount,
  } as T & {
    status: GenerationJobStatus;
    attemptCount: number;
    startedAt?: string;
    completedAt?: string;
    outputUrl?: string;
    errorMessage?: string;
    externalJobId?: string;
    outputAssetId?: string;
  };

  if (nextStatus === "running") {
    next.startedAt = now;
    next.attemptCount = job.attemptCount + 1;
    next.errorMessage = undefined;
  }

  if (nextStatus === "completed") {
    next.completedAt = now;
    next.outputUrl = extras.outputUrl;
    next.outputAssetId = extras.outputAssetId;
    next.errorMessage = undefined;
  }

  if (nextStatus === "failed") {
    next.completedAt = now;
    next.errorMessage = extras.errorMessage || "Generation failed.";
  }

  if (nextStatus === "cancelled") {
    next.completedAt = now;
    next.errorMessage = extras.errorMessage;
  }

  if (nextStatus === "queued") {
    next.startedAt = undefined;
    next.completedAt = undefined;
    next.errorMessage = undefined;
    next.outputUrl = undefined;
  }

  if (extras.externalJobId) next.externalJobId = extras.externalJobId;
  return next;
}

export function planJobsFromAssets(
  assets: Array<(Asset | AssetProposal) & { id?: string }>,
  options: { provider?: string; model?: string } = {},
): GenerationJobProposal[] {
  return assets
    .filter((asset) => clean(asset.generationPrompt) && !clean(asset.fileUrl))
    .map((asset) => {
      const jobType: GenerationJobType = inferJobTypeForAsset(asset.assetType);
      return {
        productionId: asset.productionId,
        assetId: asset.id,
        sceneId: asset.sceneId,
        shotId: asset.shotId,
        panelId: asset.panelId,
        characterId: asset.characterId,
        locationId: asset.locationId,
        jobType,
        provider: options.provider,
        model: options.model,
        prompt: asset.generationPrompt,
        parameters: {
          assetType: asset.assetType,
          assetNumber: asset.assetNumber,
        },
        status: "queued" as const,
        attemptCount: 0,
      };
    });
}

export function selectNewJobProposals(
  proposals: GenerationJobProposal[],
  existing: Array<Pick<GenerationJob, "assetId" | "status" | "prompt">>,
): GenerationJobProposal[] {
  const blocking = new Set(
    existing
      .filter((job) => job.status === "queued" || job.status === "running" || job.status === "completed")
      .map((job) => job.assetId)
      .filter((id): id is string => Boolean(id)),
  );

  return proposals.filter((proposal) => {
    if (!proposal.assetId) return true;
    return !blocking.has(proposal.assetId);
  });
}

export function applyCompletedJobToAsset<T extends Partial<Asset> | AssetProposal>(
  asset: T,
  job: Pick<GenerationJob | GenerationJobProposal, "status" | "outputUrl" | "assetId">,
): T {
  if (job.status !== "completed") return asset;
  if (!clean(job.outputUrl)) return asset;
  return { ...asset, fileUrl: job.outputUrl };
}

export function isRecoverableJob(job: Pick<GenerationJob, "status">): boolean {
  return job.status === "failed" || job.status === "cancelled";
}
