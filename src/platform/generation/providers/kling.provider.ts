import { createHs256Jwt } from "../jwt";
import {
  UNCONFIGURED_MEDIA_ERROR,
  type GenerationEnvironment,
  type MediaGenerationProvider,
  type MediaGenerationRequest,
  type MediaGenerationResult,
  type MediaJobType,
} from "../types";
import { klingAspectRatio } from "../aspect-ratio";
import { isRequestDefinitelyNotSent, isTimeoutError } from "../timeout";
import { firstProviderUrl } from "../url";

/** Kling rejects prompts longer than 2,500 characters. */
export const KLING_MAX_PROMPT_LENGTH = 2500;

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

/** Kling answered with an HTTP error status. Carries the status so callers can classify the outcome. */
export class KlingHttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "KlingHttpError";
    this.status = status;
  }
}

/** Kling answered 2xx but the body was not a readable JSON task payload. */
export class KlingUnreadableResponseError extends Error {
  constructor(status: number) {
    super(`Kling answered with status ${status} but the response could not be read.`);
    this.name = "KlingUnreadableResponseError";
  }
}

/**
 * Whether a failed create-task request may still have been accepted by Kling.
 *
 * Definitely NOT accepted (safe to treat as an ordinary, retryable failure):
 * - Kling answered with a 4xx status (validation, authentication, quota/concurrency rejection);
 * - the connection was never established (DNS failure, connection refused, unreachable, connect timeout).
 *
 * UNKNOWN (must not be retried automatically): timeouts and aborts after the request was sent,
 * connection resets, Kling 5xx (its documented 5xx codes include an internal timeout), an unreadable
 * 2xx response, and any unrecognised error.
 */
export function klingCreateOutcomeIsUnknown(error: unknown): boolean {
  if (error instanceof KlingHttpError) return error.status >= 500;
  return !isRequestDefinitelyNotSent(error);
}

export class KlingMediaProvider implements MediaGenerationProvider {
  readonly id = "kling";
  readonly supports: readonly MediaJobType[] = ["image", "video"];
  /** Kling accepts a client-defined `external_task_id` (unique per account) that can be queried later. */
  readonly acceptsClientTaskId = true;
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
    if (!this.isConfigured()) {
      return { status: "failed", provider: this.id, failureKind: "configuration", errorMessage: UNCONFIGURED_MEDIA_ERROR };
    }
    if (request.prompt.length > KLING_MAX_PROMPT_LENGTH) {
      return {
        status: "failed",
        provider: this.id,
        failureKind: "unsupported-job",
        errorMessage: `Kling accepts prompts up to ${KLING_MAX_PROMPT_LENGTH} characters; this prompt has ${request.prompt.length}. Shorten the asset prompt before retrying.`,
      };
    }
    const path = request.jobType === "video" ? "/v1/videos/text2video" : "/v1/images/generations";
    const model = typeof request.parameters?.model === "string" ? request.parameters.model : request.jobType === "video" ? "kling-v2-6" : "kling-v1";
    // Production aspect ratio mapped to the closest value this endpoint accepts.
    const aspectRatio = klingAspectRatio(request.parameters?.aspect_ratio, request.jobType, model);
    // Built before any network call: a credential error here is a definite, pre-send failure.
    let token: string;
    try {
      token = this.authorizationToken();
    } catch (error) {
      return {
        status: "failed",
        provider: this.id,
        model,
        failureKind: "configuration",
        errorMessage: error instanceof Error ? error.message : UNCONFIGURED_MEDIA_ERROR,
      };
    }
    const externalTaskId = request.clientTaskId?.trim() || undefined;
    const body = request.jobType === "video"
      ? { model_name: model, prompt: request.prompt, duration: String(request.parameters?.duration ?? "5"), mode: "std", aspect_ratio: aspectRatio }
      : { model_name: model, prompt: request.prompt, n: 1, aspect_ratio: aspectRatio };
    try {
      return this.mapPayload(
        await this.requestJson("POST", path, token, externalTaskId ? { ...body, external_task_id: externalTaskId } : body),
        model,
      );
    } catch (error) {
      const unknown = klingCreateOutcomeIsUnknown(error);
      return {
        status: "failed",
        provider: this.id,
        model,
        failureKind: isTimeoutError(error)
          ? "timeout"
          : error instanceof KlingHttpError || error instanceof KlingUnreadableResponseError
            ? "provider"
            : "network",
        errorMessage: error instanceof Error ? error.message : "Kling request failed.",
        ...(unknown ? { providerStateUnknown: true } : {}),
      };
    }
  }

  async checkStatus(providerJobId: string, jobType: MediaJobType): Promise<MediaGenerationResult> {
    if (!this.isConfigured()) {
      return { status: "failed", provider: this.id, failureKind: "configuration", errorMessage: UNCONFIGURED_MEDIA_ERROR };
    }
    const encodedId = encodeURIComponent(providerJobId);
    try {
      const path = jobType === "video"
        ? `/v1/videos/text2video/${encodedId}`
        : `/v1/images/generations/${encodedId}`;
      return this.mapPayload(await this.requestJson("GET", path, this.authorizationToken()));
    } catch (error) {
      // A failed status check does not mean the provider task failed; keep the task ID so it can be checked again.
      return {
        status: "failed",
        provider: this.id,
        providerJobId,
        failureKind: isTimeoutError(error) ? "timeout" : "network",
        errorMessage: error instanceof Error ? error.message : "Kling status request failed.",
      };
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

  private async requestJson(method: "GET" | "POST", path: string, token: string, body?: unknown): Promise<KlingTaskPayload> {
    const baseUrl = (this.env.KLING_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
    const response = await this.fetchImpl(`${baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(body) : undefined,
    });
    const payload = (await response.json().catch(() => null)) as KlingTaskPayload | null;
    if (!response.ok) {
      throw new KlingHttpError(payload?.message || `Kling request failed with status ${response.status}.`, response.status);
    }
    if (!payload || typeof payload !== "object") throw new KlingUnreadableResponseError(response.status);
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
