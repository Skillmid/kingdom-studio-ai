import type { AIProvider } from "../types/ai-provider";

const supported = (value: string | undefined): value is "openrouter" | "gemini" | "openai" =>
  value === "openrouter" || value === "gemini" || value === "openai";

/** Character Intelligence can be switched independently; other workflows retain the global default. */
export const CHARACTER_AI_PROVIDER: AIProvider = supported(process.env.NEXT_PUBLIC_CHARACTER_AI_PROVIDER)
  ? process.env.NEXT_PUBLIC_CHARACTER_AI_PROVIDER
  : process.env.NEXT_PUBLIC_AI_DEFAULT_PROVIDER === "gemini"
    ? "gemini"
    : "openrouter";

export const DEFAULT_AI_PROVIDER: AIProvider = CHARACTER_AI_PROVIDER;
