import { KlingMediaProvider } from "./providers/kling.provider";
import { OpenAIImageProvider } from "./providers/openai-image.provider";
import { unconfiguredMediaProvider } from "./providers/unconfigured.provider";
import { readGenerationEnvironment, type GenerationEnvironment, type MediaGenerationProvider, type MediaJobType } from "./types";

export function createMediaProviders(
  env: GenerationEnvironment = readGenerationEnvironment(),
  fetchImpl: typeof fetch = fetch,
): MediaGenerationProvider[] {
  return [new OpenAIImageProvider(env, fetchImpl), new KlingMediaProvider(env, fetchImpl), unconfiguredMediaProvider];
}

export function resolveMediaProvider(
  jobType: MediaJobType,
  env: GenerationEnvironment = readGenerationEnvironment(),
  fetchImpl: typeof fetch = fetch,
  preferredProvider?: string,
): MediaGenerationProvider {
  return selectMediaProvider(createMediaProviders(env, fetchImpl), jobType, preferredProvider);
}

/**
 * Chooses a provider that can actually complete the job:
 * 1. a configured provider that can deliver a durable URL (the preferred one first),
 * 2. otherwise a configured provider that cannot deliver a URL — it fails early with a
 *    specific, non-transient reason (e.g. inline data requires storage) before any paid call,
 * 3. otherwise the unconfigured provider.
 */
export function selectMediaProvider(
  providers: MediaGenerationProvider[],
  jobType: MediaJobType,
  preferredProvider?: string,
): MediaGenerationProvider {
  const configured = providers.filter(
    (provider) =>
      provider.id !== unconfiguredMediaProvider.id && provider.supports.includes(jobType) && provider.isConfigured(),
  );
  const deliverable = configured.filter((provider) => provider.canDeliverUrl?.(jobType) ?? true);
  if (preferredProvider) {
    const preferred = deliverable.find((provider) => provider.id === preferredProvider);
    if (preferred) return preferred;
  }
  const order = jobType === "video" ? ["kling"] : ["openai-image", "kling"];
  for (const id of order) {
    const match = deliverable.find((provider) => provider.id === id);
    if (match) return match;
  }
  if (deliverable[0]) return deliverable[0];
  return configured[0] ?? unconfiguredMediaProvider;
}

export function isMediaJobType(value: string): value is MediaJobType {
  return value === "image" || value === "video";
}
