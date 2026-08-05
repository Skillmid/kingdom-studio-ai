import {
  openRouterProvider,
} from "../providers/openrouter.provider";

import {
  openAIProvider,
} from "../providers/openai.provider";

import type {
  AIRequest,
  AIResponse,
} from "../types/ai-provider";

export class AIGateway {
  async generate(
    request: AIRequest
  ): Promise<AIResponse> {
    switch (request.provider) {
      case "openrouter":
        return openRouterProvider.generate(
          request
        );

      case "openai":
        return openAIProvider.generate(
          request
        );

      case "claude":
      case "gemini":
      case "grok":
      case "deepseek":
      case "local":
        throw new Error(
          `AI provider "${request.provider}" is not implemented yet.`
        );

      default: {
        const exhaustiveCheck: never =
          request.provider;

        throw new Error(
          `Unknown AI provider: ${exhaustiveCheck}`
        );
      }
    }
  }
}

export const aiGateway =
  new AIGateway();