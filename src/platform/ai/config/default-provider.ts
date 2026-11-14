import type { AIProvider } from "../types/ai-provider";

/**
 * Non-secret build-time selector for the default text provider used by
 * screenplay intelligence and Story Bible workflows. The server still
 * validates the selected provider and keeps provider credentials private.
 */
export const DEFAULT_AI_PROVIDER: AIProvider =
  process.env.NEXT_PUBLIC_AI_DEFAULT_PROVIDER === "gemini"
    ? "gemini"
    : "openrouter";
