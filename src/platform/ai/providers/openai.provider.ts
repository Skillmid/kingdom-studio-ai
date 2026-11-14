import type { AIProviderAdapter } from "./provider";
import type { AIRequest, AIResponse } from "../types/ai-provider";
import { supabase } from "@/lib/supabase/client";

interface OpenAIGatewayResponse {
  text?: string;
  provider?: string;
  model?: string;
  tokens?: number;
  error?: string;
}

/** Browser adapter for the authenticated server-side OpenAI gateway. */
export class OpenAIProvider implements AIProviderAdapter {
  async generate(request: AIRequest): Promise<AIResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
      },
      body: JSON.stringify({ ...request, provider: "openai" }),
    });

    const data = (await response.json().catch(() => ({
      error: `AI request failed (HTTP ${response.status}).`,
    }))) as OpenAIGatewayResponse;

    if (!response.ok) throw new Error(data.error || "OpenAI request failed.");
    if (!data.text?.trim()) throw new Error("OpenAI returned an empty response.");

    return {
      provider: "openai",
      text: data.text,
      model: data.model,
      tokens: data.tokens,
    };
  }
}

export const openAIProvider = new OpenAIProvider();
