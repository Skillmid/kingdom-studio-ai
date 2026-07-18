export interface AIRequest {
  systemPrompt: string;

  userPrompt: string;

  temperature?: number;

  maxTokens?: number;
}

export interface AIResponse {
  success: boolean;

  content: string;

  model: string;

  usage?: {
    promptTokens: number;

    completionTokens: number;

    totalTokens: number;
  };

  error?: string;
}

export type AIAction =
  | "generate"
  | "rewrite"
  | "expand"
  | "improve"
  | "summarize";