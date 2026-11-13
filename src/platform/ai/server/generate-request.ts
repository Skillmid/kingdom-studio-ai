import { z } from "zod";

/**
 * Server-side validation for POST /api/ai/generate.
 *
 * Every AI call in the app is production-scoped, so productionId is required and verified
 * against the signed-in owner before any paid provider call. Sizes are bounded so a single
 * request cannot send an unbounded prompt or ask for an unbounded completion.
 */

export const DEFAULT_OPENROUTER_MODEL = "openrouter/free";
export const MAX_SYSTEM_PROMPT_CHARS = 50_000;
/** Full feature screenplays are sent for analysis; ~600k characters leaves generous headroom. */
export const MAX_USER_PROMPT_CHARS = 600_000;
export const MAX_COMPLETION_TOKENS = 8_000;
export const DEFAULT_COMPLETION_TOKENS = 4_000;
export const MAX_AI_REQUEST_BODY_BYTES = 2_500_000;
export const OPENROUTER_TIMEOUT_MS = 110_000;

export const aiGenerateRequestSchema = z.object({
  provider: z.literal("openrouter").optional(),
  productionId: z.string().uuid({ message: "A valid productionId is required." }),
  systemPrompt: z.string().max(MAX_SYSTEM_PROMPT_CHARS, { message: "System prompt is too long." }).optional(),
  userPrompt: z
    .string()
    .max(MAX_USER_PROMPT_CHARS, { message: "User prompt is too long." })
    .refine((value) => value.trim().length > 0, { message: "User prompt is required." }),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(MAX_COMPLETION_TOKENS).optional(),
  model: z.string().trim().min(1).max(200).optional(),
});

export type AIGenerateRequest = z.infer<typeof aiGenerateRequestSchema>;

export type ParsedAIGenerateRequest =
  | { ok: true; value: AIGenerateRequest }
  | { ok: false; error: string };

export function parseAIGenerateRequest(body: unknown): ParsedAIGenerateRequest {
  if (body && typeof body === "object" && "provider" in body) {
    const provider = (body as { provider?: unknown }).provider;
    if (provider !== undefined && provider !== "openrouter") {
      return { ok: false, error: "Unsupported AI provider." };
    }
  }
  const result = aiGenerateRequestSchema.safeParse(body);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path.join(".");
    return { ok: false, error: issue ? (field ? `${field}: ${issue.message}` : issue.message) : "Invalid request." };
  }
  return { ok: true, value: result.data };
}

/**
 * Allowed models: the default plus optional server env OPENROUTER_MODEL (the default override)
 * and OPENROUTER_ALLOWED_MODELS (comma-separated). Clients cannot pick arbitrary paid models.
 */
export function resolveAllowedModel(
  requested: string | undefined,
  env: { OPENROUTER_MODEL?: string; OPENROUTER_ALLOWED_MODELS?: string },
): { ok: true; model: string } | { ok: false; error: string } {
  const defaultModel = env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;
  const allowed = new Set([
    DEFAULT_OPENROUTER_MODEL,
    defaultModel,
    ...(env.OPENROUTER_ALLOWED_MODELS ?? "")
      .split(",")
      .map((model) => model.trim())
      .filter(Boolean),
  ]);
  if (!requested) return { ok: true, model: defaultModel };
  if (!allowed.has(requested)) return { ok: false, error: "Requested model is not allowed." };
  return { ok: true, model: requested };
}

/** Upstream failures are reported as gateway errors, never as the caller's own auth failure. */
export function upstreamErrorStatus(status: number): number {
  if (status === 429) return 429;
  if (status === 408 || status === 504) return 504;
  return 502;
}
