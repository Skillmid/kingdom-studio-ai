import {
  INLINE_DATA_REQUIRES_STORAGE_ERROR,
  UNCONFIGURED_MEDIA_ERROR,
  type GenerationEnvironment,
  type MediaGenerationProvider,
  type MediaGenerationRequest,
  type MediaGenerationResult,
  type MediaJobType,
} from "../types";
import { openAIImageSize } from "../aspect-ratio";
import { isRequestDefinitelyNotSent, isTimeoutError } from "../timeout";
import { firstProviderUrl } from "../url";

const DEFAULT_MODEL = "gpt-image-1";

interface OpenAIImageResponse {
  error?: { message?: string };
  data?: Array<{ url?: string; b64_json?: string }>;
}

/**
 * Only the DALL·E models can return a hosted URL (`response_format: "url"`), which is what the
 * URL-based asset architecture stores in `assets.file_url`. Set OPENAI_IMAGE_MODEL=dall-e-3 (or
 * dall-e-2) to use OpenAI image generation today.
 * gpt-image-* models (including the default gpt-image-1) always return inline base64. Kingdom Studio
 * has no durable media storage yet, so those models are refused BEFORE the paid request. Base64 is
 * never written to file_url and no URL is invented. Supporting them requires a storage decision
 * (for example Supabase Storage), which is deliberately deferred.
 */
export function openAIModelReturnsUrl(model: string): boolean {
  return /^dall-e-[23]\b/i.test(model.trim());
}

export class OpenAIImageProvider implements MediaGenerationProvider {
  readonly id = "openai-image";
  readonly supports: readonly MediaJobType[] = ["image"];
  private readonly env: GenerationEnvironment;
  private readonly fetchImpl: typeof fetch;

  constructor(
    env: GenerationEnvironment = process.env as GenerationEnvironment,
    fetchImpl: typeof fetch = fetch,
  ) {
    this.env = env;
    this.fetchImpl = fetchImpl;
  }

  get model(): string {
    return this.env.OPENAI_IMAGE_MODEL?.trim() || DEFAULT_MODEL;
  }

  isConfigured(): boolean {
    return Boolean(this.env.OPENAI_API_KEY?.trim());
  }

  canDeliverUrl(jobType: MediaJobType): boolean {
    return jobType === "image" && openAIModelReturnsUrl(this.model);
  }

  async generate(request: MediaGenerationRequest): Promise<MediaGenerationResult> {
    if (request.jobType !== "image") {
      return {
        status: "failed",
        provider: this.id,
        failureKind: "unsupported-job",
        errorMessage: "OpenAI image generation does not support video jobs.",
      };
    }
    if (!this.isConfigured()) {
      return { status: "failed", provider: this.id, failureKind: "configuration", errorMessage: UNCONFIGURED_MEDIA_ERROR };
    }
    const model = this.model;
    // Refuse before spending money: this model can only return inline data.
    if (!openAIModelReturnsUrl(model)) {
      return {
        status: "failed",
        provider: this.id,
        model,
        failureKind: "inline-data-requires-storage",
        errorMessage: INLINE_DATA_REQUIRES_STORAGE_ERROR,
      };
    }
    const size =
      typeof request.parameters?.size === "string"
        ? request.parameters.size
        : openAIImageSize(request.parameters?.aspect_ratio, model);
    try {
      const response = await this.fetchImpl("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt: request.prompt,
          n: 1,
          size,
          response_format: "url",
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as OpenAIImageResponse;
      if (!response.ok) {
        return {
          status: "failed",
          provider: this.id,
          model,
          failureKind: response.status === 401 || response.status === 403 ? "configuration" : "provider",
          errorMessage: payload.error?.message || `OpenAI image request failed with status ${response.status}.`,
        };
      }
      const outputUrl = firstProviderUrl(payload.data);
      if (!outputUrl) {
        const inlineOnly = Array.isArray(payload.data) && payload.data.some((item) => typeof item?.b64_json === "string");
        return {
          status: "failed",
          provider: this.id,
          model,
          failureKind: inlineOnly ? "inline-data-requires-storage" : "provider",
          errorMessage: inlineOnly
            ? INLINE_DATA_REQUIRES_STORAGE_ERROR
            : "OpenAI returned no image URL. No file URL was invented.",
        };
      }
      return { status: "completed", provider: this.id, model, outputUrl };
    } catch (error) {
      return {
        status: "failed",
        provider: this.id,
        model,
        failureKind: isTimeoutError(error) ? "timeout" : "network",
        errorMessage: error instanceof Error ? error.message : "OpenAI image request failed.",
        // The request may have been processed (and billed) even though no response arrived.
        ...(isRequestDefinitelyNotSent(error) ? {} : { providerStateUnknown: true }),
      };
    }
  }
}
