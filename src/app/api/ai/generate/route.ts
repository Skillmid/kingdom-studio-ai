import { NextResponse } from "next/server";

import { bearerToken, readJsonBody } from "@/lib/http/json-body";
import { SupabaseConfigurationError } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { CHARACTER_PROFILE_FIELDS } from "@/features/characters/utils/character-progress";
import {
  DEFAULT_COMPLETION_TOKENS,
  MAX_AI_REQUEST_BODY_BYTES,
  AI_PROVIDER_TIMEOUT_MS,
  parseAIGenerateRequest,
  resolveAllowedGeminiModel,
  resolveAllowedOpenAIModel,
  resolveAllowedModel,
  upstreamErrorStatus,
  extractOpenRouterText,
  describeEmptyOpenRouterCompletion,
  type OpenRouterCompletion,
} from "@/platform/ai/server/generate-request";

export const maxDuration = 120;

interface OpenAIResponse {
  model?: string;
  choices?: Array<{ message?: { content?: string | null; refusal?: string | null }; finish_reason?: string | null }>;
  usage?: { total_tokens?: number };
  error?: { message?: string };
}

async function generateOpenAI(input: {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  responseFormat?: "json";
  outputSchema?: "character_profile";
}) {
  const modelResult = resolveAllowedOpenAIModel(input.model, {
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    OPENAI_ALLOWED_MODELS: process.env.OPENAI_ALLOWED_MODELS,
  });
  if (!modelResult.ok) return NextResponse.json({ error: modelResult.error }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OpenAI API key is not configured." }, { status: 503 });

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelResult.model,
        messages: [
          ...(input.systemPrompt ? [{ role: "system", content: input.systemPrompt }] : []),
          { role: "user", content: input.userPrompt },
        ],
        temperature: input.temperature ?? 0.3,
        max_completion_tokens: input.maxTokens ?? DEFAULT_COMPLETION_TOKENS,
        ...(input.outputSchema === "character_profile"
          ? { response_format: { type: "json_schema", json_schema: characterProfileJsonSchema() } }
          : input.responseFormat === "json" ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: AbortSignal.timeout(AI_PROVIDER_TIMEOUT_MS),
    });
  } catch (error) {
    if (isAbortError(error)) return NextResponse.json({ error: "OpenAI timed out. Try again." }, { status: 504 });
    console.error("OpenAI network error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Unable to reach OpenAI." }, { status: 502 });
  }

  const data = (await response.json().catch(() => ({}))) as OpenAIResponse;
  if (!response.ok) {
    const message = data.error?.message || "OpenAI request failed.";
    console.error("OpenAI error:", response.status, message);
    return NextResponse.json({ error: message }, { status: upstreamErrorStatus(response.status) });
  }
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    const refusal = data.choices?.[0]?.message?.refusal;
    const reason = data.choices?.[0]?.finish_reason;
    const message = refusal ? "OpenAI declined this request: " + refusal : "OpenAI returned no text" + (reason ? " (finish reason: " + reason + ")." : ".");
    return NextResponse.json({ error: message }, { status: 502 });
  }
  return NextResponse.json({ text, provider: "openai", model: data.model || modelResult.model, tokens: data.usage?.total_tokens });
}

const CHARACTER_PROFILE_SCHEMA_FIELDS = CHARACTER_PROFILE_FIELDS;

function characterProfileJsonSchema() {
  const nullableText = { type: ["string", "null"] };
  const fields: Record<string, unknown> = Object.fromEntries(
    CHARACTER_PROFILE_SCHEMA_FIELDS.map((key) => [key, nullableText]),
  );
  const evidence: Record<string, unknown> = Object.fromEntries(
    CHARACTER_PROFILE_SCHEMA_FIELDS.map((key) => [key, nullableText]),
  );
  fields.role = { type: ["string", "null"], enum: ["lead", "supporting", "minor", "extra", null] };
  evidence.role = nullableText;
  const required = [...CHARACTER_PROFILE_SCHEMA_FIELDS, "role"];

  return {
    name: "character_profile_proposal",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        fields: { type: "object", additionalProperties: false, properties: fields, required },
        fieldEvidence: { type: "object", additionalProperties: false, properties: evidence, required },
      },
      required: ["fields", "fieldEvidence"],
    },
  };
}

function characterProfileGeminiSchema() {
  const properties: Record<string, unknown> = Object.fromEntries(
    CHARACTER_PROFILE_SCHEMA_FIELDS.map((key) => [key, { type: "STRING", nullable: true }]),
  );
  const evidence: Record<string, unknown> = Object.fromEntries(
    CHARACTER_PROFILE_SCHEMA_FIELDS.map((key) => [key, { type: "STRING", nullable: true }]),
  );
  properties.role = { type: "STRING", nullable: true, enum: ["lead", "supporting", "minor", "extra"] };
  evidence.role = { type: "STRING", nullable: true };
  const required = [...CHARACTER_PROFILE_SCHEMA_FIELDS, "role"];
  return {
    type: "OBJECT",
    properties: {
      fields: { type: "OBJECT", properties, required },
      fieldEvidence: { type: "OBJECT", properties: evidence, required },
    },
    required: ["fields", "fieldEvidence"],
  };
}


interface GeminiResponse {
  modelVersion?: string;
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  usageMetadata?: { totalTokenCount?: number };
  error?: { message?: string; status?: string };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

async function generateOpenRouter(input: {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  responseFormat?: "json";
  outputSchema?: "character_profile";
}) {
  const modelResult = resolveAllowedModel(input.model, {
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
    OPENROUTER_ALLOWED_MODELS: process.env.OPENROUTER_ALLOWED_MODELS,
  });
  if (!modelResult.ok) {
    return NextResponse.json({ error: modelResult.error }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenRouter API key is not configured." }, { status: 503 });
  }

  const requestBody = (structured: boolean) => ({
    model: modelResult.model,
    messages: [
      ...(input.systemPrompt ? [{ role: "system", content: input.systemPrompt }] : []),
      { role: "user", content: input.userPrompt },
    ],
    temperature: input.temperature ?? 0.3,
    max_tokens: input.maxTokens ?? DEFAULT_COMPLETION_TOKENS,
    ...(structured
      ? { response_format: { type: "json_schema", json_schema: characterProfileJsonSchema() }, provider: { require_parameters: true } }
      : input.responseFormat === "json" ? { response_format: { type: "json_object" } } : {}),
  });

  const callProvider = async (structured: boolean): Promise<Response> => fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(requestBody(structured)),
    signal: AbortSignal.timeout(AI_PROVIDER_TIMEOUT_MS),
  });

  let response: Response;
  try {
    response = await callProvider(input.outputSchema === "character_profile");
  } catch (error) {
    if (isAbortError(error)) {
      return NextResponse.json({ error: "The AI provider timed out. Try again." }, { status: 504 });
    }
    console.error("OpenRouter network error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Unable to reach the AI provider." }, { status: 502 });
  }

  let data = (await response.json().catch(() => ({}))) as OpenRouterCompletion;
  let text = response.ok ? extractOpenRouterText(data) : "";

  // If the selected route cannot serve JSON Schema, retry once with JSON-object mode.
  // Authentication, rate-limit and server failures are not retried.
  const schemaUnsupported = !response.ok && [400, 404, 422].includes(response.status);
  if (input.outputSchema === "character_profile" && (schemaUnsupported || !text)) {
    try {
      response = await callProvider(false);
    } catch (error) {
      if (isAbortError(error)) {
        return NextResponse.json({ error: "The AI provider timed out while retrying structured output." }, { status: 504 });
      }
      console.error("OpenRouter structured-output retry network error:", error instanceof Error ? error.message : "unknown");
      return NextResponse.json({ error: "Unable to reach the AI provider for structured-output retry." }, { status: 502 });
    }
    data = (await response.json().catch(() => ({}))) as OpenRouterCompletion;
    if (!response.ok) {
      const message = data.error?.message || "OpenRouter structured-output retry failed.";
      console.error("OpenRouter retry error:", response.status, message);
      return NextResponse.json({ error: message }, { status: upstreamErrorStatus(response.status) });
    }
    text = extractOpenRouterText(data);
  } else if (!response.ok) {
    const message = data.error?.message || "OpenRouter request failed.";
    console.error("OpenRouter error:", response.status, message);
    return NextResponse.json({ error: message }, { status: upstreamErrorStatus(response.status) });
  }

  if (!text) {
    const message = describeEmptyOpenRouterCompletion(data, modelResult.model);
    console.error("OpenRouter empty completion:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({
    text,
    provider: "openrouter",
    model: data.model || modelResult.model,
    tokens: data.usage?.total_tokens,
    requestId: data.id,
  });
}

async function generateGemini(input: {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  responseFormat?: "json";
  outputSchema?: "character_profile";
}) {
  const modelResult = resolveAllowedGeminiModel(input.model, {
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    GEMINI_ALLOWED_MODELS: process.env.GEMINI_ALLOWED_MODELS,
  });
  if (!modelResult.ok) {
    return NextResponse.json({ error: modelResult.error }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key is not configured." }, { status: 503 });
  }

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelResult.model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          ...(input.systemPrompt
            ? { systemInstruction: { parts: [{ text: input.systemPrompt }] } }
            : {}),
          contents: [{ role: "user", parts: [{ text: input.userPrompt }] }],
          generationConfig: {
            temperature: input.temperature ?? 0.3,
            maxOutputTokens: input.maxTokens ?? DEFAULT_COMPLETION_TOKENS,
            ...(input.outputSchema === "character_profile"
              ? { responseMimeType: "application/json", responseSchema: characterProfileGeminiSchema() }
              : input.responseFormat === "json" ? { responseMimeType: "application/json" } : {}),
          },
        }),
        signal: AbortSignal.timeout(AI_PROVIDER_TIMEOUT_MS),
      },
    );
  } catch (error) {
    if (isAbortError(error)) {
      return NextResponse.json({ error: "Gemini timed out. Try again." }, { status: 504 });
    }
    console.error("Gemini network error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Unable to reach Gemini." }, { status: 502 });
  }

  const data = (await response.json().catch(() => ({}))) as GeminiResponse;
  if (!response.ok) {
    const message = data.error?.message || "Gemini request failed.";
    console.error("Gemini error:", response.status, message);
    return NextResponse.json({ error: message }, { status: upstreamErrorStatus(response.status) });
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) {
    const reason = data.candidates?.[0]?.finishReason;
    return NextResponse.json(
      { error: reason ? `Gemini returned no text (finish reason: ${reason}).` : "Gemini returned an empty response." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    text,
    provider: "gemini",
    model: data.modelVersion || modelResult.model,
    tokens: data.usageMetadata?.totalTokenCount,
  });
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

    if (input.provider === "gemini") return generateGemini(input);
    if (input.provider === "openai") return generateOpenAI(input);
    return generateOpenRouter(input);
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("AI generation error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "AI generation failed." }, { status: 500 });
  }
}
