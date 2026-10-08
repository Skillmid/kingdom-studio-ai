import { createHs256Jwt } from "../jwt";
import {
  UNCONFIGURED_MEDIA_ERROR,
  type GenerationEnvironment,
  type MediaGenerationProvider,
  type MediaGenerationRequest,
  type MediaGenerationResult,
  type MediaJobType,
} from "../types";
import { firstProviderUrl } from "../url";

const DEFAULT_BASE_URL = "https://api-singapore.klingai.com";

interface KlingTaskPayload {
  code?: number;
  message?: string;
  data?: {
    task_id?: string;
    task_status?: string;
    task_status_msg?: string;
    task_result?: { videos?: Array<{ url?: string }>; images?: Array<{ url?: string }> };
  };
}

export class KlingMediaProvider implements MediaGenerationProvider {
  readonly id = "kling";
  readonly supports: readonly MediaJobType[] = ["image", "video"];
  private readonly env: GenerationEnvironment;
  private readonly fetchImpl: typeof fetch;

  constructor(
    env: GenerationEnvironment = process.env as GenerationEnvironment,
    fetchImpl: typeof fetch = fetch,
  ) {
    this.env = env;
    this.fetchImpl = fetchImpl;
  }

  isConfigured(): boolean {
    return Boolean(this.env.KLING_API_KEY?.trim() || (this.env.KLING_ACCESS_KEY?.trim() && this.env.KLING_SECRET_KEY?.trim()));
  }

  async generate(request: MediaGenerationRequest): Promise<MediaGenerationResult> {
    if (!this.isConfigured()) return { status: "failed", provider: this.id, errorMessage: UNCONFIGURED_MEDIA_ERROR };
    const path = request.jobType === "video" ? "/v1/videos/text2video" : "/v1/images/generations";
    const model = typeof request.parameters?.model === "string" ? request.parameters.model : request.jobType === "video" ? "kling-v2-6" : "kling-v1";
    const aspectRatio = typeof request.parameters?.aspect_ratio === "string" ? request.parameters.aspect_ratio : "16:9";
    try {
      return this.mapPayload(await this.requestJson("POST", path, request.jobType === "video"
        ? { model_name: model, prompt: request.prompt, duration: String(request.parameters?.duration ?? "5"), mode: "std", aspect_ratio: aspectRatio }
        : { model_name: model, prompt: request.prompt, n: 1, aspect_ratio: aspectRatio }), model);
    } catch (error) {
      return { status: "failed", provider: this.id, model, errorMessage: error instanceof Error ? error.message : "Kling request failed." };
    }
  }

  async checkStatus(providerJobId: string, jobType: MediaJobType): Promise<MediaGenerationResult> {
    if (!this.isConfigured()) return { status: "failed", provider: this.id, errorMessage: UNCONFIGURED_MEDIA_ERROR };
    const encodedId = encodeURIComponent(providerJobId);
    try {
      const path = jobType === "video"
        ? `/v1/videos/text2video/${encodedId}`
        : `/v1/images/generations/${encodedId}`;
      return this.mapPayload(await this.requestJson("GET", path));
    } catch (error) {
      return { status: "failed", provider: this.id, providerJobId, errorMessage: error instanceof Error ? error.message : "Kling status request failed." };
    }
  }

  private mapPayload(payload: KlingTaskPayload, model?: string): MediaGenerationResult {
    if (payload.code && payload.code !== 0) {
      return { status: "failed", provider: this.id, model, providerJobId: payload.data?.task_id, errorMessage: payload.message || payload.data?.task_status_msg || "Kling returned an error." };
    }
    const status = (payload.data?.task_status ?? "").toLowerCase();
    const outputUrl = firstProviderUrl(payload.data?.task_result?.videos, payload.data?.task_result?.images);
    if (status === "succeed" || status === "succeeded" || outputUrl) {
      if (!outputUrl) return { status: "failed", provider: this.id, model, providerJobId: payload.data?.task_id, errorMessage: "Kling completed without a media URL. No file URL was invented." };
      return { status: "completed", provider: this.id, model, outputUrl, providerJobId: payload.data?.task_id };
    }
    if (status === "failed") {
      return { status: "failed", provider: this.id, model, providerJobId: payload.data?.task_id, errorMessage: payload.data?.task_status_msg || payload.message || "Kling generation failed." };
    }
    return { status: "running", provider: this.id, model, providerJobId: payload.data?.task_id };
  }

  private async requestJson(method: "GET" | "POST", path: string, body?: unknown): Promise<KlingTaskPayload> {
    const baseUrl = (this.env.KLING_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
    const response = await this.fetchImpl(`${baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${this.authorizationToken()}`, "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(body) : undefined,
    });
    const payload = (await response.json()) as KlingTaskPayload;
    if (!response.ok) throw new Error(payload.message || `Kling request failed with status ${response.status}.`);
    return payload;
  }

  private authorizationToken(): string {
    if (this.env.KLING_API_KEY?.trim()) return this.env.KLING_API_KEY.trim();
    const accessKey = this.env.KLING_ACCESS_KEY?.trim();
    const secretKey = this.env.KLING_SECRET_KEY?.trim();
    if (!accessKey || !secretKey) throw new Error(UNCONFIGURED_MEDIA_ERROR);
    return createHs256Jwt(accessKey, secretKey);
  }
}
