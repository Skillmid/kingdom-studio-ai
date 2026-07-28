export type AIProvider =
  | "openai"
  | "claude"
  | "gemini"
  | "grok"
  | "deepseek"
  | "local";

export interface AIRequest {
  provider: AIProvider;

  systemPrompt: string;

  userPrompt: string;

  temperature?: number;

  maxTokens?: number;
}

export interface AIResponse {
  text: string;

  provider: AIProvider;

  tokens?: number;
}