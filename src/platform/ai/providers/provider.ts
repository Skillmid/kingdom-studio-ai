import type {
  AIRequest,
  AIResponse,
} from "../types/ai-provider";

export interface AIProviderAdapter {
  generate(
    request: AIRequest
  ): Promise<AIResponse>;
}