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
 * GPT Image models return inline base64; DALL·E models can return hosted URLs. Inline data is
 * handed to the server-side generation pipeline for durable Supabase Storage upload. It is never
 * written directly into assets.file_url.
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
    // Inline GPT Image output is eligible only after durable storage is explicitly configured.
    return jobType === "image" && (openAIModelReturnsUrl(this.model) || Boolean(this.env.SUPABASE_MEDIA_BUCKET?.trim()));
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
    if (!openAIModelReturnsUrl(model) && !this.env.SUPABASE_MEDIA_BUCKET?.trim()) {
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
          ...(/^(gpt-image-)/i.test(model) ? {} : { response_format: "url" }),
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
      if (outputUrl) return { status: "completed", provider: this.id, model, outputUrl };
      const inline = payload.data?.find((item) => typeof item?.b64_json === "string" && item.b64_json.length > 0);
      if (inline?.b64_json && this.env.SUPABASE_MEDIA_BUCKET?.trim()) {
        return { status: "completed", provider: this.id, model, outputBase64: inline.b64_json, outputMimeType: "image/png" };
      }
      if (inline?.b64_json) {
        return {
          status: "failed",
          provider: this.id,
          model,
          failureKind: "inline-data-requires-storage",
          errorMessage: INLINE_DATA_REQUIRES_STORAGE_ERROR,
        };
      }
      return {
        status: "failed",
        provider: this.id,
        model,
        failureKind: "provider",
        errorMessage: "OpenAI returned neither a hosted image URL nor inline image data.",
      };
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
