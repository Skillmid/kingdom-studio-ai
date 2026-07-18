import type {
  AIRequest,
  AIResponse,
} from "../types/ai";

import { ModelRouter } from "./model-router";

export class AIService {
  async generate(
    request: AIRequest
  ): Promise<AIResponse> {
    const model =
      ModelRouter.getDefaultModel();

    /*
      This is where the real API call
      will be connected later.

      OpenAI

      Kling

      Gemini

      Claude

      DeepSeek

      etc.
    */

    return {
      success: true,

      model,

      content:
        "AI integration will be connected in the next milestone.",

      usage: {
        promptTokens: 0,

        completionTokens: 0,

        totalTokens: 0,
      },
    };
  }
}

export const aiService =
  new AIService();