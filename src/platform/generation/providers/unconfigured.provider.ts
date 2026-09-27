import {
  UNCONFIGURED_MEDIA_ERROR,
  UNCONFIGURED_MEDIA_PROVIDER,
  type MediaGenerationProvider,
  type MediaGenerationRequest,
  type MediaGenerationResult,
  type MediaJobType,
} from "../types";

export class UnconfiguredMediaProvider implements MediaGenerationProvider {
  readonly id = UNCONFIGURED_MEDIA_PROVIDER;
  readonly supports: readonly MediaJobType[] = ["image", "video"];

  isConfigured(): boolean {
    return false;
  }

  async generate(_request: MediaGenerationRequest): Promise<MediaGenerationResult> {
    return {
      status: "failed",
      provider: this.id,
      errorMessage: UNCONFIGURED_MEDIA_ERROR,
    };
  }
}

export const unconfiguredMediaProvider = new UnconfiguredMediaProvider();
