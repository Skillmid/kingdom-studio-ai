import { NextResponse } from "next/server";

import { bearerToken, readJsonBody } from "@/lib/http/json-body";
import { SupabaseConfigurationError } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_COMPLETION_TOKENS,
  MAX_AI_REQUEST_BODY_BYTES,
  OPENROUTER_TIMEOUT_MS,
  parseAIGenerateRequest,
  resolveAllowedModel,
  upstreamErrorStatus,
} from "@/platform/ai/server/generate-request";

// The OpenRouter call is capped at OPENROUTER_TIMEOUT_MS (110s).
export const maxDuration = 120;

interface OpenRouterResponse {
  model?: string;
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { total_tokens?: number };
  error?: { message?: string };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

export async function POST(request: Request) {
  try {
    const accessToken = bearerToken(request);
    const supabase = await createClient(accessToken);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }

    const body = await readJsonBody(request, MAX_AI_REQUEST_BODY_BYTES);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    const parsed = parseAIGenerateRequest(body.value);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const input = parsed.value;

    const modelResult = resolveAllowedModel(input.model, {
      OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
      OPENROUTER_ALLOWED_MODELS: process.env.OPENROUTER_ALLOWED_MODELS,
    });
    if (!modelResult.ok) {
      return NextResponse.json({ error: modelResult.error }, { status: 400 });
    }

    // Every AI call is production-scoped: verify ownership before any provider call.
    const { data: production, error: productionError } = await supabase
      .from("productions")
      .select("id")
      .eq("id", input.productionId)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (productionError) {
      return NextResponse.json({ error: "Unable to verify production access." }, { status: 500 });
    }
    if (!production) {
      return NextResponse.json({ error: "Production not found or access denied." }, { status: 404 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API key is not configured." }, { status: 503 });
    }

    let response: Response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelResult.model,
          messages: [
            ...(input.systemPrompt ? [{ role: "system", content: input.systemPrompt }] : []),
            { role: "user", content: input.userPrompt },
          ],
          temperature: input.temperature ?? 0.3,
          max_tokens: input.maxTokens ?? DEFAULT_COMPLETION_TOKENS,
        }),
        signal: AbortSignal.timeout(OPENROUTER_TIMEOUT_MS),
      });
    } catch (error) {
      if (isAbortError(error)) {
        return NextResponse.json({ error: "The AI provider timed out. Try again." }, { status: 504 });
      }
      console.error("OpenRouter network error:", error instanceof Error ? error.message : "unknown");
      return NextResponse.json({ error: "Unable to reach the AI provider." }, { status: 502 });
    }

    const data = (await response.json().catch(() => ({}))) as OpenRouterResponse;

    if (!response.ok) {
      const message = data.error?.message || "OpenRouter request failed.";
      console.error("OpenRouter error:", response.status, message);
      return NextResponse.json({ error: message }, { status: upstreamErrorStatus(response.status) });
    }

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      return NextResponse.json({ error: "The AI model returned an empty response." }, { status: 502 });
    }

    return NextResponse.json({
      text,
      provider: "openrouter",
      model: data.model || modelResult.model,
      tokens: data.usage?.total_tokens,
    });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("AI generation error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "AI generation failed." }, { status: 500 });
  }
}
