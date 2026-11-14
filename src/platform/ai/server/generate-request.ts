import { z } from "zod";

/**
 * Server-side validation for POST /api/ai/generate.
 * Every AI call is production-scoped and verified against the signed-in owner
 * before any provider call. Prompt and completion sizes are bounded.
 */

export const DEFAULT_OPENROUTER_MODEL = "openrouter/free";
export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
export const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
export const MAX_SYSTEM_PROMPT_CHARS = 50_000;
export const MAX_USER_PROMPT_CHARS = 600_000;
export const MAX_COMPLETION_TOKENS = 8_000;
export const DEFAULT_COMPLETION_TOKENS = 4_000;
export const MAX_AI_REQUEST_BODY_BYTES = 2_500_000;
export const AI_PROVIDER_TIMEOUT_MS = 110_000;

export const aiGenerateRequestSchema = z.object({
  provider: z.enum(["openrouter", "gemini", "openai"]).optional(),
  productionId: z.string().uuid({ message: "A valid productionId is required." }),
  systemPrompt: z.string().max(MAX_SYSTEM_PROMPT_CHARS, { message: "System prompt is too long." }).optional(),
  userPrompt: z.string()
    .max(MAX_USER_PROMPT_CHARS, { message: "User prompt is too long." })
    .refine((value) => value.trim().length > 0, { message: "User prompt is required." }),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(MAX_COMPLETION_TOKENS).optional(),
  model: z.string().trim().min(1).max(200).optional(),
  responseFormat: z.enum(["json"]).optional(),
  outputSchema: z.enum(["character_profile"]).optional(),
});

export type AIGenerateRequest = z.infer<typeof aiGenerateRequestSchema>;

export type ParsedAIGenerateRequest =
  | { ok: true; value: AIGenerateRequest }
  | { ok: false; error: string };

export function parseAIGenerateRequest(body: unknown): ParsedAIGenerateRequest {
  const result = aiGenerateRequestSchema.safeParse(body);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path.join(".");
    return {
      ok: false,
      error: issue ? (field ? `${field}: ${issue.message}` : issue.message) : "Invalid request.",
    };
  }
  return { ok: true, value: result.data };
}

export function resolveAllowedModel(
  requested: string | undefined,
  env: { OPENROUTER_MODEL?: string; OPENROUTER_ALLOWED_MODELS?: string },
): { ok: true; model: string } | { ok: false; error: string } {
  const defaultModel = env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;
  const allowed = new Set([
    DEFAULT_OPENROUTER_MODEL,
    defaultModel,
    ...(env.OPENROUTER_ALLOWED_MODELS ?? "").split(",").map((model) => model.trim()).filter(Boolean),
  ]);
  if (!requested) return { ok: true, model: defaultModel };
  if (!allowed.has(requested)) return { ok: false, error: "Requested model is not allowed." };
  return { ok: true, model: requested };
}

export function resolveAllowedGeminiModel(
  requested: string | undefined,
  env: { GEMINI_MODEL?: string; GEMINI_ALLOWED_MODELS?: string },
): { ok: true; model: string } | { ok: false; error: string } {
  const defaultModel = env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const allowed = new Set([
    DEFAULT_GEMINI_MODEL,
    defaultModel,
    ...(env.GEMINI_ALLOWED_MODELS ?? "").split(",").map((model) => model.trim()).filter(Boolean),
  ]);
  if (!requested) return { ok: true, model: defaultModel };
  if (!allowed.has(requested)) return { ok: false, error: "Requested Gemini model is not allowed." };
  return { ok: true, model: requested };
}

/** Upstream failures are reported as gateway errors, never as the caller's own auth failure. */
export function upstreamErrorStatus(status: number): number {
  if (status === 429) return 429;
  if (status === 408 || status === 504) return 504;
  return 502;
}


export function resolveAllowedOpenAIModel(
  requested: string | undefined,
  env: { OPENAI_MODEL?: string; OPENAI_ALLOWED_MODELS?: string },
): { ok: true; model: string } | { ok: false; error: string } {
  const defaultModel = env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
  const allowed = new Set([
    DEFAULT_OPENAI_MODEL,
    defaultModel,
    ...(env.OPENAI_ALLOWED_MODELS ?? "").split(",").map((model) => model.trim()).filter(Boolean),
  ]);
  if (!requested) return { ok: true, model: defaultModel };
  if (!allowed.has(requested)) return { ok: false, error: "Requested OpenAI model is not allowed." };
  return { ok: true, model: requested };
}

export interface OpenRouterChoiceMessage {
  content?: string | Array<{ type?: string; text?: string }> | null;
  refusal?: string | null;
}

export interface OpenRouterChoice {
  message?: OpenRouterChoiceMessage;
  finish_reason?: string | null;
}

export interface OpenRouterCompletion {
  id?: string;
  model?: string;
  provider?: string;
  choices?: OpenRouterChoice[];
  usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string; code?: number | string };
}

/** Normalize OpenRouter's string and multipart message content without treating reasoning as user-facing output. */
export function extractOpenRouterText(data: OpenRouterCompletion): string {
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .filter((part) => part?.type === "text" || typeof part?.text === "string")
      .map((part) => part.text ?? "")
      .join("")
      .trim();
  }
  return "";
}

export function describeEmptyOpenRouterCompletion(data: OpenRouterCompletion, requestedModel: string): string {
  const choice = data.choices?.[0];
  const refusal = choice?.message?.refusal?.trim();
  if (refusal) return "The AI model declined this request: " + refusal.slice(0, 400);
  const details = [
    choice?.finish_reason ? "finish reason: " + choice.finish_reason : undefined,
    data.model ? "model: " + data.model : "requested model: " + requestedModel,
    data.provider ? "provider: " + data.provider : undefined,
    data.id ? "request: " + data.id : undefined,
  ].filter(Boolean);
  return "OpenRouter returned no text" + (details.length ? " (" + details.join("; ") + ")." : ".");
}
