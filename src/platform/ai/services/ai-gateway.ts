import {
  openAIProvider,
} from "../providers/openai.provider";

import type {
  AIRequest,
} from "../types/ai-provider";

export class AIGateway {

  async generate(
    request: AIRequest
  ) {

    switch (request.provider) {

      case "openai":
        return openAIProvider.generate(
          request
        );

      default:
        throw new Error(
          `${request.provider} is not implemented.`
        );

    }

  }

}

export const aiGateway =
  new AIGateway();