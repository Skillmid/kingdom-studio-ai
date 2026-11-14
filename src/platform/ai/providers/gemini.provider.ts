import type { AIProviderAdapter } from "./provider";
import type { AIRequest, AIResponse } from "../types/ai-provider";
import { supabase } from "@/lib/supabase/client";

interface GeminiGatewayResponse {
  text?: string;
  provider?: string;
  model?: string;
  tokens?: number;
  error?: string;
}

export class GeminiProvider implements AIProviderAdapter {
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
      body: JSON.stringify({ ...request, provider: "gemini" }),
    });

    const data = (await response.json().catch(() => ({
      error: `AI request failed (HTTP ${response.status}).`,
    }))) as GeminiGatewayResponse;

    if (!response.ok) {
      throw new Error(data.error || "Gemini request failed.");
    }
    if (!data.text?.trim()) {
      throw new Error("Gemini returned an empty response.");
    }

    return {
      provider: "gemini",
      text: data.text,
      model: data.model,
      tokens: data.tokens,
    };
  }
}

export const geminiProvider = new GeminiProvider();
