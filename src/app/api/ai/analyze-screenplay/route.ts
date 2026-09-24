import { NextResponse } from "next/server";

import { validateScreenplayAnalysis } from "@/features/script-intelligence/services/screenplay-analysis.service";

const DEFAULT_MODEL = process.env.OPENROUTER_SCREENPLAY_MODEL || "openrouter/free";

const SYSTEM_PROMPT = `You are the canonical screenplay intelligence engine for Kingdom Studio AI.

Read the COMPLETE screenplay as a professional script analyst. One analysis powers the production workspace: Story Bible, Characters, Locations and Scenes. Identify what is actually present, then make carefully grounded narrative inferences only for Story Bible fields that require interpretation.

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
12. Evidence must quote short, exact excerpts from the screenplay. Do not create evidence that is not in the screenplay.
13. Preserve the story's wording in sourceText, action and dialogue. Do not summarize those fields.
14. If uncertain whether an uppercase phrase is a character, prefer leaving it out rather than inventing a character.
15. Story Bible fields must be grounded in the complete screenplay. Extract direct facts where available and infer only what is strongly supported by the story.
16. Never manufacture a Scripture reference. If the screenplay has no supported biblical foundation, leave scripture_foundation empty.
17. Do not invent creator-specific burden, truth, or kingdom objective. If those ideas are not reasonably supported by the screenplay, leave them empty.
18. Narrative beats must describe the actual story, not generic screenplay advice.
19. AI context, rules and visual consistency must be practical production guidance derived from observable story details, characters, locations, tone and style.
20. Keep screenplay facts separate from interpretation. The Story Bible may contain both, but the review metadata MUST explicitly identify which statements are direct facts, which are grounded interpretations, and which important story questions remain unresolved.
21. Do not state an interpretation as an established fact. For example, if a character may be involved in a crime but the screenplay does not confirm it, describe the uncertainty rather than declaring the character guilty or involved.
22. The storyBibleReview.facts list must contain concise statements directly supported by the screenplay. Do not put inferred conclusions in this list.
23. The storyBibleReview.interpretations list may contain concise creative or narrative readings, but each must be strongly supported by observable screenplay evidence and must not contradict ambiguity in the source.
24. The storyBibleReview.uncertainties list must preserve meaningful unresolved questions, ambiguity, or withheld information that downstream creative tools should not accidentally resolve.

RETURN ONLY valid JSON matching this shape:
{
  "schemaVersion": 1,
  "title": "string or omitted",
  "logline": "string or omitted",
  "storyBible": {
    "title": "string or omitted",
    "logline": "string or omitted",
    "synopsis": "string or omitted",
    "burden": "string or omitted",
    "truth": "string or omitted",
    "human_problem": "string or omitted",
    "theme": "string or omitted",
    "core_message": "string or omitted",
    "scripture_foundation": "string or omitted",
    "kingdom_objective": "string or omitted",
    "target_audience": "string or omitted",
    "genre": "string or omitted",
    "tone": "string or omitted",
    "language": "string or omitted",
    "visual_style": "string or omitted",
    "aspect_ratio": "string or omitted",
    "duration_minutes": 0,
    "universe": "string or omitted",
    "time_period": "string or omitted",
    "primary_location": "string or omitted",
    "beginning": "string or omitted",
    "conflict": "string or omitted",
    "midpoint": "string or omitted",
    "climax": "string or omitted",
    "ending": "string or omitted",
    "ai_context": "string or omitted",
    "ai_rules": "string or omitted",
    "forbidden_elements": "string or omitted",
    "preferred_vocabulary": "string or omitted",
    "visual_consistency": "string or omitted"
  },
  "storyBibleReview": {
    "facts": ["directly supported screenplay fact"],
    "interpretations": ["clearly labeled grounded interpretation"],
    "uncertainties": ["important unresolved question or ambiguity"]
  },
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
    ? `Return ONLY valid JSON. Repair the previous screenplay analysis so it exactly matches the required schema. Do not add facts that are not supported by the screenplay. Preserve ambiguity and separate facts from interpretations in storyBibleReview.\n\nSCREENPLAY:\n${screenplay}`
    : `Analyze this complete screenplay and return the canonical JSON structure described in your instructions. Pay special attention to the distinction between extracted facts, grounded Story Bible inferences, and unresolved story questions.\n\nSCREENPLAY:\n${screenplay}`;

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
      max_tokens: 16000,
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
