import {
  UNCONFIGURED_MEDIA_ERROR,
  type GenerationEnvironment,
  type MediaGenerationProvider,
  type MediaGenerationRequest,
  type MediaGenerationResult,
  type MediaJobType,
} from "../types";
import { firstProviderUrl } from "../url";

const DEFAULT_MODEL = "gpt-image-1";

interface OpenAIImageResponse {
  error?: { message?: string };
  data?: Array<{ url?: string; b64_json?: string }>;
}

export class OpenAIImageProvider implements MediaGenerationProvider {
  readonly id = "openai-image";
  readonly supports: readonly MediaJobType[] = ["image"];

  constructor(
    private readonly env: GenerationEnvironment = process.env,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.env.OPENAI_API_KEY?.trim());
  }

  async generate(request: MediaGenerationRequest): Promise<MediaGenerationResult> {
    if (request.jobType !== "image") {
      return { status: "failed", provider: this.id, errorMessage: "OpenAI image generation does not support video jobs." };
    }
    if (!this.isConfigured()) {
      return { status: "failed", provider: this.id, errorMessage: UNCONFIGURED_MEDIA_ERROR };
    }
    const model = this.env.OPENAI_IMAGE_MODEL?.trim() || DEFAULT_MODEL;
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
          size: typeof request.parameters?.size === "string" ? request.parameters.size : "1024x1024",
        }),
      });
      const payload = (await response.json()) as OpenAIImageResponse;
      if (!response.ok) {
        return {
          status: "failed",
          provider: this.id,
          model,
          errorMessage: payload.error?.message || `OpenAI image request failed with status ${response.status}.`,
        };
      }
      const outputUrl = firstProviderUrl(payload.data);
      if (!outputUrl) {
        return {
          status: "failed",
          provider: this.id,
          model,
          errorMessage: "OpenAI returned no image URL. Base64-only payloads are not persisted as invented file URLs.",
        };
      }
      return { status: "completed", provider: this.id, model, outputUrl };
    } catch (error) {
      return {
        status: "failed",
        provider: this.id,
        model,
        errorMessage: error instanceof Error ? error.message : "OpenAI image request failed.",
      };
    }
  }
}
