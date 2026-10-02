import {
  NextResponse,
} from "next/server";
import { createClient } from "@/lib/supabase/server";

interface GenerateRequest {
  provider?: string;

  systemPrompt?: string;

  userPrompt?: string;

  temperature?: number;

  maxTokens?: number;

  model?: string;
  productionId?: string;
}

interface OpenRouterResponse {
  id?: string;

  model?: string;

  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;

  usage?: {
    prompt_tokens?: number;

    completion_tokens?: number;

    total_tokens?: number;
  };

  error?: {
    message?: string;
  };
}

const DEFAULT_MODEL =
  "openrouter/free";

export async function POST(
  request: Request
) {
  try {
    const accessToken = request.headers
      .get("authorization")
      ?.match(/^Bearer\s+(.+)$/i)?.[1];
    const supabase = await createClient(accessToken);
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }
    const body = (await request.json()) as GenerateRequest;
    if (body.productionId) {
      const { data: production, error: productionError } = await supabase
        .from("productions")
        .select("id")
        .eq("id", body.productionId)
        .eq("owner_id", user.id)
        .maybeSingle();
      if (productionError) {
        return NextResponse.json({ error: "Unable to verify production access." }, { status: 500 });
      }
      if (!production) {
        return NextResponse.json({ error: "Production not found or access denied." }, { status: 404 });
      }
    }
    const apiKey =
      process.env
        .OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OpenRouter API key is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !body.userPrompt ||
      !body.userPrompt.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "User prompt is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      body.provider &&
      body.provider !==
        "openrouter"
    ) {
      return NextResponse.json(
        {
          error:
            "Unsupported AI provider.",
        },
        {
          status: 400,
        }
      );
    }

    const model =
      body.model ||
      DEFAULT_MODEL;

    const response =
      await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            model,

            messages: [
              ...(body.systemPrompt
                ? [
                    {
                      role:
                        "system",

                      content:
                        body.systemPrompt,
                    },
                  ]
                : []),

              {
                role: "user",

                content:
                  body.userPrompt,
              },
            ],

            temperature:
              body.temperature ??
              0.3,

            max_tokens:
              body.maxTokens ??
              4000,
          }),
        }
      );

    const data =
      (await response.json()) as OpenRouterResponse;

    if (!response.ok) {
      const message =
        data.error?.message ||
        "OpenRouter request failed.";

      console.error(
        "OpenRouter error:",
        response.status,
        message
      );

      return NextResponse.json(
        {
          error: message,
        },
        {
          status:
            response.status,
        }
      );
    }

    const text =
      data.choices?.[0]
        ?.message?.content;

    if (!text) {
      return NextResponse.json(
        {
          error:
            "The AI model returned an empty response.",
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json({
      text,

      provider:
        "openrouter",

      model:
        data.model ||
        model,

      tokens:
        data.usage
          ?.total_tokens,
    });
  } catch (error) {
    console.error(
      "AI generation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "AI generation failed.",
      },
      {
        status: 500,
      }
    );
  }
}