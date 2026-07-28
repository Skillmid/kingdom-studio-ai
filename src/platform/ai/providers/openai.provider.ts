import type {
  AIProviderAdapter,
} from "./provider";

import type {
  AIRequest,
  AIResponse,
} from "../types/ai-provider";

export class OpenAIProvider
  implements AIProviderAdapter
{
  async generate(
    request: AIRequest
  ): Promise<AIResponse> {

    /**
     * Sprint 4
     *
     * OpenAI SDK integration.
     */

    return {
      provider: "openai",

      text: "",

      tokens: 0,
    };
  }
}

export const openAIProvider =
  new OpenAIProvider();