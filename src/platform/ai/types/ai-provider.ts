export type AIProvider =
  | "openrouter"
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
  model?: string;
  /** Ask providers that support constrained output to return valid JSON. */
  responseFormat?: "json";
  /** Select a server-owned strict output schema; callers cannot submit arbitrary schemas. */
  outputSchema?: "character_profile";
  /** Required: the server verifies the caller owns this production before any provider call. */
  productionId: string;
}

export interface AIResponse {
  text: string;
  provider: AIProvider;
  model?: string;
  tokens?: number;
}