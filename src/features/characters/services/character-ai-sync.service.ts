import { screenplayRepository } from "@/features/script-intelligence/repositories/screenplay.repository";

import type { Character } from "../types/character";

export type CharacterAISyncResult = Partial<Character>;

const CHARACTER_FIELDS = [
  "age",
  "gender",
  "occupation",
  "nationality",
  "ethnicity",
  "biography",
  "appearance",
  "height",
  "weight",
  "eyeColor",
  "hairColor",
  "distinguishingFeatures",
  "personality",
  "strengths",
  "weaknesses",
  "fears",
  "habits",
  "values",
  "motivation",
  "goal",
  "conflict",
  "characterArc",
  "spiritualJourney",
  "speechStyle",
  "catchPhrases",
  "aiInstructions",
] as const;

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
    throw new Error("AI did not return valid character profile JSON.");
  }
}

function cleanResult(value: unknown): CharacterAISyncResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("AI returned an invalid character profile.");
  }

  const source = value as Record<string, unknown>;
  const result: CharacterAISyncResult = {};

  for (const field of CHARACTER_FIELDS) {
    const candidate = source[field];
    if (typeof candidate === "string" && candidate.trim()) {
      result[field] = candidate.trim();
    }
  }

  return result;
}

export async function syncCharacterProfileWithAI(
  productionId: string,
  character: Character,
): Promise<CharacterAISyncResult> {
  const screenplay = await screenplayRepository.getByProductionId(productionId);

  if (!screenplay?.content?.trim()) {
    throw new Error("Save a screenplay before using AI Character Sync.");
  }

  const storyBible = screenplay.analysis?.storyBible ?? null;
  const existingProfile = Object.fromEntries(
    CHARACTER_FIELDS.map((field) => [field, character[field] ?? ""]),
  );

  const systemPrompt = `You are the Character Bible intelligence engine for Kingdom Studio AI.

Build a character profile from the complete screenplay supplied by the creator.
The screenplay is the primary source of truth. The character profile is a proposal for the creator to review, not a replacement for their creative authority.

NON-NEGOTIABLE RULES:
1. Never invent facts that are not reasonably supported by the screenplay.
2. Do not invent age, appearance, occupation, nationality, ethnicity, height, weight, eye color, hair color, backstory, or spiritual beliefs when the screenplay does not support them.
3. You may make concise, grounded interpretations about personality, strengths, weaknesses, fears, values, motivation, goal, conflict, speech style, and character arc when strongly supported by observable actions or dialogue.
4. Preserve unresolved mystery. Do not decide who is guilty, who sent an unknown message, or what happens after an unresolved ending unless the screenplay establishes it.
5. Do not create dialogue or catchphrases that the character never says.
6. Character arc and spiritual journey may be omitted when the screenplay does not provide enough evidence.
7. Keep the wording concise and useful for a production Character Bible.
8. Return ONLY valid JSON. Omit unsupported fields rather than guessing.

Return an object containing only these optional fields:
${CHARACTER_FIELDS.map((field) => `- ${field}`).join("\n")}`;

  const userPrompt = `Create an AI Character Profile proposal for the character "${character.name}".

CURRENT CHARACTER PROFILE (existing values should be preserved unless the screenplay clearly supports a better value):
${JSON.stringify(existingProfile, null, 2)}

STORY BIBLE CONTEXT:
${storyBible ? JSON.stringify(storyBible, null, 2) : "None available."}

COMPLETE SCREENPLAY:
${screenplay.content}`;

  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      provider: "openrouter",
      systemPrompt,
      userPrompt,
      temperature: 0.1,
      maxTokens: 5000,
    }),
  });

  const data = (await response.json()) as {
    text?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error || "AI Character Sync failed.");
  }

  if (!data.text) {
    throw new Error("AI returned an empty character profile.");
  }

  return cleanResult(extractJson(data.text));
}
