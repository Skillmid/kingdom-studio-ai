import type { AIProvider } from "../types/ai-provider";

const supported = (value: string | undefined): value is "openrouter" | "gemini" | "openai" =>
  value === "openrouter" || value === "gemini" || value === "openai";

/** Global default remains limited to the existing general-purpose workflows. */
export const DEFAULT_AI_PROVIDER: AIProvider =
  process.env.NEXT_PUBLIC_AI_DEFAULT_PROVIDER === "gemini" ? "gemini" : "openrouter";

/** Character Intelligence can be tested independently without rerouting other features. */
export const CHARACTER_AI_PROVIDER: AIProvider = supported(process.env.NEXT_PUBLIC_CHARACTER_AI_PROVIDER)
  ? process.env.NEXT_PUBLIC_CHARACTER_AI_PROVIDER
  : DEFAULT_AI_PROVIDER;
