import { KlingMediaProvider } from "./providers/kling.provider";
import { OpenAIImageProvider } from "./providers/openai-image.provider";
import { unconfiguredMediaProvider } from "./providers/unconfigured.provider";
import type { GenerationEnvironment, MediaGenerationProvider, MediaJobType } from "./types";

export function createMediaProviders(
  env: GenerationEnvironment = process.env,
  fetchImpl: typeof fetch = fetch,
): MediaGenerationProvider[] {
  return [new OpenAIImageProvider(env, fetchImpl), new KlingMediaProvider(env, fetchImpl), unconfiguredMediaProvider];
}

export function resolveMediaProvider(
  jobType: MediaJobType,
  env: GenerationEnvironment = process.env,
  fetchImpl: typeof fetch = fetch,
  preferredProvider?: string,
): MediaGenerationProvider {
  const providers = createMediaProviders(env, fetchImpl);
  const configured = providers.filter((provider) => provider.supports.includes(jobType) && provider.isConfigured());

  if (preferredProvider) {
    const preferred = configured.find((provider) => provider.id === preferredProvider);
    if (preferred) return preferred;
  }

  if (jobType === "video") {
    return configured.find((provider) => provider.id === "kling") ?? unconfiguredMediaProvider;
  }

  return (
    configured.find((provider) => provider.id === "openai-image") ??
    configured.find((provider) => provider.id === "kling") ??
    unconfiguredMediaProvider
  );
}

export function isMediaJobType(value: string): value is MediaJobType {
  return value === "image" || value === "video";
}
