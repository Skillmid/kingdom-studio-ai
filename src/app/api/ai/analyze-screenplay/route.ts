import { NextResponse } from "next/server";

import { validateScreenplayAnalysis } from "@/features/script-intelligence/services/screenplay-analysis.service";

const DEFAULT_MODEL = process.env.OPENROUTER_SCREENPLAY_MODEL || "openrouter/free";

const SYSTEM_PROMPT = `You are the screenplay-structure engine for Kingdom Studio AI.

Read the COMPLETE screenplay as a professional script analyst. Your job is to identify what is actually present in the screenplay and return a canonical production breakdown.

NON-NEGOTIABLE RULES:
1. Never rewrite or improve the screenplay.
2. Never invent names, occupations, ages, relationships, locations, events, or dialogue.
3. A person introduced in action can be a character even if they never speak.
4. A person mentioned as a named character in action can be a character even if they never speak.
5. Do NOT turn ordinary uppercase words, action verbs, scene descriptions, Bible verses, email/message/notification text, labels, transitions, or phrases such as 'DAVID TYPES' into characters.
6. Character cues are evidence, but context decides whether a name is actually a character.
7. Normalize cue variants such as DAVID (V.O.) and DAVID (PHONE) to David.
8. Scene headings include INT., EXT., INT./EXT., I/E, BOTH, and numbered slugs where appropriate. Transitions such as INTERCUT, CUT TO, FADE OUT, MATCH CUT, SMASH CUT, JUMP CUT, CONTINUED and similar are NOT scenes.
9. Keep scene numbers in screenplay order. If the screenplay has no explicit number, assign sequential numbers beginning at 1.
10. A location is the physical setting named by a scene heading, not every place mentioned in action or dialogue.
11. Scene characterNames must contain every character physically present or explicitly participating in that scene, including action-only characters, but must not contain people merely mentioned in dialogue unless the screenplay clearly establishes their presence.
12. Evidence must quote short, exact excerpts from the screenplay and must explain why an entity was identified. Do not create evidence that is not in the screenplay.
13. Preserve the story's wording in sourceText, action and dialogue. Do not summarize those fields except where a field is explicitly a summary.
14. If uncertain whether an uppercase phrase is a character, prefer leaving it out rather than inventing a character.

RETURN ONLY valid JSON matching this shape:
{
  "schemaVersion": 1,
  "title": "string or omitted",
  "logline": "string or omitted",
  "characters": [
    {
      "name": "string",
      "kind": "named | role | unknown",
      "speaks": true,
      "dialogueCount": 0,
      "introduction": "short exact screenplay excerpt or omitted",
      "evidence": [{ "sceneNumber": 1, "text": "short exact excerpt" }]
    }
  ],
  "locations": [
    {
      "name": "string",
      "setting": "interior | exterior | both",
      "sourceHeading": "exact scene heading",
      "sceneNumbers": [1]
    }
  ],
  "scenes": [
    {
      "number": 1,
      "heading": "exact scene heading",
      "sceneType": "INT | EXT | BOTH",
      "locationName": "string",
      "timeOfDay": "string or omitted",
      "action": ["original action line"],
      "dialogue": [
        { "character": "David", "parenthetical": "(V.O.)", "dialogue": "original dialogue" }
      ],
      "characterNames": ["David"],
      "sourceText": "original scene text"
    }
  ]
}`;

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1]?.trim() || trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const first = candidate.indexOf("{");
    const last = candidate.lastIndexOf("}");
    if (first >= 0 && last > first) {
      return JSON.parse(candidate.slice(first, last + 1));
    }
    throw new Error("AI did not return valid JSON.");
  }
}

async function callOpenRouter(apiKey: string, screenplay: string, repair = false) {
  const userPrompt = repair
    ? `Return ONLY valid JSON. Repair the previous screenplay analysis so it exactly matches the required schema. Do not add facts that are not supported by the screenplay.\n\nSCREENPLAY:\n${screenplay}`
    : `Analyze this complete screenplay and return the canonical JSON structure described in your instructions. Pay special attention to distinguishing real characters introduced in action from uppercase action phrases, notifications, messages, Bible verses, labels and transitions.\n\nSCREENPLAY:\n${screenplay}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 12000,
    }),
  });

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message || "OpenRouter screenplay analysis failed.");
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("The AI model returned an empty screenplay analysis.");
  return text;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key is not configured." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as { screenplay?: string };
    const screenplay = body.screenplay?.trim();
    if (!screenplay) {
      return NextResponse.json(
        { error: "Screenplay content is required." },
        { status: 400 }
      );
    }

    let raw = await callOpenRouter(apiKey, screenplay);
    let parsed: unknown;

    try {
      parsed = extractJson(raw);
      parsed = validateScreenplayAnalysis(parsed);
    } catch {
      raw = await callOpenRouter(apiKey, screenplay, true);
      parsed = validateScreenplayAnalysis(extractJson(raw));
    }

    return NextResponse.json({
      analysis: parsed,
      model: DEFAULT_MODEL,
    });
  } catch (error) {
    console.error("Screenplay analysis error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to analyse screenplay.",
      },
      { status: 500 }
    );
  }
}
