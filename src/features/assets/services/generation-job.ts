import type { Asset } from "../types/asset";
import type { GenerationJob, GenerationJobDraft, GenerationJobType } from "../types/generation-job";

export const UNCONFIGURED_PROVIDER = "unconfigured";
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

export function draftJobFromAsset(
  asset: Pick<Asset, "id" | "productionId" | "kind" | "prompt" | "sourceKind" | "sourceId">,
): GenerationJobDraft {
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
    parameters: {},
    sourceEntityType: "asset",
    sourceEntityId: asset.id,
  };
}

export function startJob(job: GenerationJob, startedAt = new Date().toISOString()): GenerationJob {
  if (job.status !== "queued") {
    throw new Error(`Cannot start a generation job from status "${job.status}".`);
  }
  return {
    ...job,
    status: "running",
    startedAt,
    errorMessage: undefined,
    attemptCount: job.attemptCount + 1,
  };
}

export function completeJob(job: GenerationJob, outputUrl: string, completedAt = new Date().toISOString()): GenerationJob {
  if (job.status !== "running") {
    throw new Error(`Cannot complete a generation job from status "${job.status}".`);
  }
  const url = outputUrl.trim();
  if (!url) {
    throw new Error("A completed generation job requires an output URL from a provider.");
  }
  return {
    ...job,
    status: "completed",
    outputUrl: url,
    errorMessage: undefined,
    completedAt,
  };
}

export function failJob(job: GenerationJob, errorMessage: string, completedAt = new Date().toISOString()): GenerationJob {
  if (job.status !== "queued" && job.status !== "running") {
    throw new Error(`Cannot fail a generation job from status "${job.status}".`);
  }
  return {
    ...job,
    status: "failed",
    errorMessage: errorMessage.trim() || "Generation failed.",
    completedAt,
  };
}

export function cancelJob(job: GenerationJob, completedAt = new Date().toISOString()): GenerationJob {
  if (job.status === "completed") {
    throw new Error("A completed generation job cannot be cancelled.");
  }
  return {
    ...job,
    status: "cancelled",
    completedAt,
  };
}

export function retryJob(job: GenerationJob): GenerationJob {
  if (job.status !== "failed" && job.status !== "cancelled") {
    throw new Error(`Cannot retry a generation job from status "${job.status}".`);
  }
  return {
    ...job,
    status: "queued",
    errorMessage: undefined,
    outputUrl: undefined,
    startedAt: undefined,
    completedAt: undefined,
  };
}

export function dispatchUnconfiguredProvider(job: GenerationJob): GenerationJob {
  const running = job.status === "queued" ? startJob(job) : job;
  return failJob(running, UNCONFIGURED_PROVIDER_ERROR);
}

export function applyJobResultToAsset(
  asset: Asset,
  job: Pick<GenerationJob, "status" | "outputUrl" | "errorMessage">,
): Pick<Asset, "fileUrl" | "status" | "uncertaintyNotes"> {
  if (job.status === "completed" && job.outputUrl) {
    return { fileUrl: job.outputUrl, status: "ready", uncertaintyNotes: undefined };
  }
  if (job.status === "running" || job.status === "queued") {
    return { fileUrl: asset.fileUrl, status: "generating", uncertaintyNotes: asset.uncertaintyNotes };
  }
  if (job.status === "failed") {
    return { fileUrl: asset.fileUrl, status: "failed", uncertaintyNotes: job.errorMessage || asset.uncertaintyNotes };
  }
  return {
    fileUrl: asset.fileUrl,
    status: asset.fileUrl ? "ready" : "draft",
    uncertaintyNotes: asset.uncertaintyNotes,
  };
}
