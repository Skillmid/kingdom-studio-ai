export type MediaJobType = "image" | "video";

export type MediaGenerationStatus = "completed" | "failed" | "running";

export interface MediaGenerationRequest {
  jobType: MediaJobType;
  prompt: string;
  parameters?: Record<string, unknown>;
  referenceImageUrl?: string;
}

export interface MediaGenerationResult {
  status: MediaGenerationStatus;
  provider: string;
  model?: string;
  outputUrl?: string;
  providerJobId?: string;
  errorMessage?: string;
}

export interface MediaGenerationProvider {
  readonly id: string;
  readonly supports: readonly MediaJobType[];
  isConfigured(): boolean;
  generate(request: MediaGenerationRequest): Promise<MediaGenerationResult>;
  checkStatus?(providerJobId: string): Promise<MediaGenerationResult>;
}

export interface GenerationEnvironment {
  KLING_ACCESS_KEY?: string;
  KLING_SECRET_KEY?: string;
  KLING_API_KEY?: string;
  KLING_API_BASE_URL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_IMAGE_MODEL?: string;
}

export const UNCONFIGURED_MEDIA_PROVIDER = "unconfigured";
export const UNCONFIGURED_MEDIA_ERROR =
  "No generation provider is configured. The job remains recoverable and no media was invented.";
