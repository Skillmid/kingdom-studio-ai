import { completeJob, failJob, startJob } from "@/features/assets/services/generation-job";
import type { GenerationJob } from "@/features/assets/types/generation-job";
import { isMediaJobType, resolveMediaProvider } from "./registry";
import {
  UNCONFIGURED_MEDIA_ERROR,
  UNCONFIGURED_MEDIA_PROVIDER,
  type GenerationEnvironment,
  type MediaGenerationProvider,
  type MediaGenerationResult,
} from "./types";

export interface DispatchDependencies {
  env?: GenerationEnvironment;
  fetchImpl?: typeof fetch;
  resolveProvider?: typeof resolveMediaProvider;
  now?: () => string;
}

export async function dispatchGenerationJob(job: GenerationJob, deps: DispatchDependencies = {}): Promise<GenerationJob> {
  const now = deps.now?.() ?? new Date().toISOString();
  const running = job.status === "queued" ? startJob(job, now) : job;
  const prompt = running.prompt?.trim();
  if (!prompt) {
    return failJob(running, "A generation job requires a prompt grounded in production records or filmmaker input.", now);
  }
  if (!isMediaJobType(running.jobType)) {
    return failJob(
      running,
      `${running.jobType} generation is not implemented. The job remains recoverable and no media was invented.`,
      now,
    );
  }
  const provider: MediaGenerationProvider =
    deps.resolveProvider?.(running.jobType, deps.env, deps.fetchImpl, running.provider) ??
    resolveMediaProvider(running.jobType, deps.env, deps.fetchImpl, running.provider);
  const labeled: GenerationJob = { ...running, provider: provider.id };
  if (!provider.isConfigured()) return failJob(labeled, UNCONFIGURED_MEDIA_ERROR, now);
  const existingJobId = typeof labeled.parameters.providerJobId === "string" ? labeled.parameters.providerJobId : undefined;
  let result: MediaGenerationResult;
  try {
    result =
      existingJobId && provider.checkStatus
        ? await provider.checkStatus(existingJobId)
        : await provider.generate({
            jobType: running.jobType,
            prompt,
            parameters: labeled.parameters,
            referenceImageUrl:
              typeof labeled.parameters.referenceImageUrl === "string" ? labeled.parameters.referenceImageUrl : undefined,
          });
  } catch (error) {
    return failJob(labeled, error instanceof Error ? error.message : "Generation provider failed.", now);
  }
  const withProvider: GenerationJob = {
    ...labeled,
    provider: result.provider || provider.id,
    model: result.model || labeled.model,
    parameters: { ...labeled.parameters, ...(result.providerJobId ? { providerJobId: result.providerJobId } : {}) },
  };
  if (result.status === "completed") {
    const outputUrl = result.outputUrl?.trim();
    if (!outputUrl) return failJob(withProvider, "Provider completed without a media URL. No file URL was invented.", now);
    return completeJob(withProvider, outputUrl, now);
  }
  if (result.status === "failed") return failJob(withProvider, result.errorMessage || UNCONFIGURED_MEDIA_ERROR, now);
  return withProvider;
}

export function isUnconfiguredResult(job: Pick<GenerationJob, "provider" | "errorMessage">): boolean {
  return job.provider === UNCONFIGURED_MEDIA_PROVIDER || job.errorMessage === UNCONFIGURED_MEDIA_ERROR;
}
