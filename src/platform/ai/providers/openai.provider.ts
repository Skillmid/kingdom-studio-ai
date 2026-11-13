import type {
  AIProviderAdapter,
} from "./provider";

import type {
  AIRequest,
  AIResponse,
} from "../types/ai-provider";

/**
 * Not implemented. /api/ai/generate only proxies OpenRouter; this adapter previously posted an
 * unauthenticated request with provider "openai" that the route always rejected. It now fails
 * fast with a clear message instead. No caller in the app selects provider "openai".
 */
export class OpenAIProvider
  implements AIProviderAdapter
{
  async generate(
    request: AIRequest
  ): Promise<AIResponse> {
    void request;
    throw new Error(
      'AI provider "openai" is not implemented for text generation. Use provider "openrouter".'
    );
  }
}

export const openAIProvider =
  new OpenAIProvider();
