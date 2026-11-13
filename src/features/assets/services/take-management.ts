import type { Asset } from "../types/asset";
import type { GenerationJob } from "../types/generation-job";
import { canGenerateAsset, hasUnknownProviderState } from "./generation-job";

export interface AssetTake {
  id: string;
  assetId: string;
  takeNumber: number;
  outputUrl: string;
  provider?: string;
  model?: string;
  prompt?: string;
  parameters: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
  isActive: boolean;
}

export interface TakeComparison {
  takeA: AssetTake;
  takeB: AssetTake;
  isSameProvider: boolean;
  isSamePrompt: boolean;
  isSameOutputUrl: boolean;
  activeTakeNumber?: number;
}

/**
 * Extracts all valid takes for an asset from its completed generation jobs,
 * ordered chronologically and identifying the currently active take.
 */
export function extractTakesFromAssetJobs(
  asset: Pick<Asset, "id" | "fileUrl">,
  jobs: GenerationJob[],
): AssetTake[] {
  const completedJobsWithOutput = jobs
    .filter(
      (job) =>
        job.assetId === asset.id &&
        job.status === "completed" &&
        typeof job.outputUrl === "string" &&
        job.outputUrl.trim().length > 0,
    )
    .sort((a, b) => {
      const timeA = Date.parse(a.completedAt ?? a.createdAt);
      const timeB = Date.parse(b.completedAt ?? b.createdAt);
      return timeA - timeB;
    });

  const normalizedAssetFileUrl = asset.fileUrl?.trim() ?? "";

  return completedJobsWithOutput.map((job, index) => {
    const outputUrl = job.outputUrl!.trim();
    const isActive =
      normalizedAssetFileUrl.length > 0
        ? outputUrl === normalizedAssetFileUrl
        : index === completedJobsWithOutput.length - 1;

    return {
      id: job.id,
      assetId: asset.id,
      takeNumber: index + 1,
      outputUrl,
      provider: job.provider,
      model: job.model,
      prompt: job.prompt,
      parameters: job.parameters ?? {},
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      isActive,
    };
  });
}

/**
 * Checks whether an asset is eligible to generate a new take.
 * Requires an approved asset with prompt, no jobs currently running or queued for this asset,
 * and no unconfirmed unknown provider states.
 */
export function canCreateNewTake(
  asset: Pick<Asset, "id" | "kind" | "userApproved" | "prompt">,
  jobs: GenerationJob[],
): boolean {
  if (!canGenerateAsset(asset)) return false;

  const assetJobs = jobs.filter((job) => job.assetId === asset.id);
  const hasActiveJob = assetJobs.some(
    (job) => job.status === "queued" || job.status === "running",
  );
  if (hasActiveJob) return false;

  const hasUnknownState = assetJobs.some((job) => hasUnknownProviderState(job));
  if (hasUnknownState) return false;

  return true;
}

/**
 * Non-destructively selects an active take for an asset.
 * Returns the patch to apply to the asset row.
 */
export function selectActiveTake(
  asset: Pick<Asset, "id">,
  take: Pick<AssetTake, "assetId" | "outputUrl">,
): Pick<Asset, "fileUrl" | "status" | "uncertaintyNotes"> {
  if (take.assetId !== asset.id) {
    throw new Error("Cannot assign a take belonging to a different asset.");
  }

  const outputUrl = take.outputUrl?.trim();
  if (!outputUrl) {
    throw new Error("A take must have a valid media output URL to be made active.");
  }

  return {
    fileUrl: outputUrl,
    status: "ready",
    uncertaintyNotes: undefined,
  };
}

/**
 * Compares two takes side by side.
 */
export function compareTakes(takeA: AssetTake, takeB: AssetTake): TakeComparison {
  return {
    takeA,
    takeB,
    isSameProvider: (takeA.provider ?? "").trim() === (takeB.provider ?? "").trim(),
    isSamePrompt: (takeA.prompt ?? "").trim() === (takeB.prompt ?? "").trim(),
    isSameOutputUrl: takeA.outputUrl.trim() === takeB.outputUrl.trim(),
    activeTakeNumber: takeA.isActive
      ? takeA.takeNumber
      : takeB.isActive
        ? takeB.takeNumber
        : undefined,
  };
}
