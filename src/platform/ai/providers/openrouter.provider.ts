import type {
  AIProviderAdapter,
} from "./provider";

import type {
  AIRequest,
  AIResponse,
} from "../types/ai-provider";
import { supabase } from "@/lib/supabase/client";

interface OpenRouterAPIResponse {
  text?: string;

  provider?: string;

  model?: string;

  tokens?: number;

  error?: string;
}

export class OpenRouterProvider
  implements AIProviderAdapter
{
  async generate(
    request: AIRequest
  ): Promise<AIResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(
      "/api/ai/generate",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },

        body: JSON.stringify({
          ...request,

          provider:
            "openrouter",
        }),
      }
    );

    const data =
      (await response.json()) as OpenRouterAPIResponse;

    if (!response.ok) {
      throw new Error(
        data.error ||
          "OpenRouter request failed."
      );
    }

    if (!data.text) {
      throw new Error(
        "OpenRouter returned an empty response."
      );
    }

    return {
      provider: "openrouter",

      text: data.text,

      model: data.model,

      tokens: data.tokens,
    };
  }
}

export const openRouterProvider =
  new OpenRouterProvider();