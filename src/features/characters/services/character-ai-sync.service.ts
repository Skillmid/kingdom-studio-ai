import { screenplayRepository } from "@/features/script-intelligence/repositories/screenplay.repository";
import type { ScreenplayAnalysis } from "@/features/script-intelligence/types/screenplay-analysis";
import { storyBibleRepository } from "@/features/story-bible/repositories/story-bible.repository";

import type { Character } from "../types/character";
import {
  CHARACTER_PROFILE_FIELDS,
  type CharacterProfileField,
} from "../utils/character-progress";

export type CharacterAISyncResult = Partial<Character>;

export interface CharacterAISyncContext {
  otherCharacterNames?: string[];
  extractionDescription?: string;
}

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

  for (const field of CHARACTER_PROFILE_FIELDS) {
    const candidate = source[field];
    if (typeof candidate === "string" && candidate.trim()) {
      result[field] = candidate.trim();
    }
  }

  return result;
}

function compactStoryBible(storyBible: Record<string, unknown> | null) {
  if (!storyBible) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(storyBible).filter(([, value]) => {
      if (typeof value === "number") return Number.isFinite(value);
      return typeof value === "string" && value.trim().length > 0;
    })
  );
}

function characterEvidence(
  name: string,
  analysis: ScreenplayAnalysis | null | undefined
) {
  if (!analysis) {
    return null;
  }

  const key = name.trim().toLowerCase();
  const record = analysis.characters.find(
    (character) => character.name.trim().toLowerCase() === key
  );
  const scenes = analysis.scenes
    .filter((scene) =>
      scene.characterNames.some((item) => item.trim().toLowerCase() === key)
    )
    .map((scene) => ({
      number: scene.number,
      heading: scene.heading,
      action: scene.action.slice(0, 8),
      dialogue: scene.dialogue
        .filter((beat) => beat.character.trim().toLowerCase() === key)
        .slice(0, 8),
    }));

  return {
    kind: record?.kind,
    speaks: record?.speaks ?? false,
    dialogueCount: record?.dialogueCount ?? 0,
    introduction: record?.introduction ?? "",
    evidence: record?.evidence?.slice(0, 8) ?? [],
    scenes,
  };
}

function buildSystemPrompt(characterName: string, otherNames: string[]) {
  const others =
    otherNames.length > 0
      ? otherNames.join(", ")
      : "None listed. Still treat every other person in the screenplay as someone else.";

  return `You are the Character Bible intelligence engine for Kingdom Studio AI.

You are profiling ONE character only: "${characterName}".
Other characters in this production: ${others}

The complete screenplay is the primary source of truth. The Story Bible is supporting context only. The profile is a proposal for the creator to review.

NON-NEGOTIABLE RULES:
1. Never invent facts that are not reasonably supported by the screenplay.
2. Never assign information that belongs to another character to "${characterName}".
3. If the screenplay says "Kunle is Michael's business partner", that fact describes Kunle's relationship to Michael. It does NOT make Michael's occupation "business partner".
4. Relationships may be mentioned in biography only when the screenplay states them, and they must keep the correct subject and object.
5. Leave these fields omitted unless the screenplay explicitly states them for "${characterName}": age, gender, occupation, nationality, ethnicity, height, weight, eyeColor, hairColor.
6. Do not guess appearance details. If clothing or a distinguishing feature is on the page, you may use it. Otherwise omit appearance fields.
7. You may write concise grounded interpretations for biography, personality, strengths, weaknesses, fears, values, motivation, goal, conflict, characterArc, speechStyle, and aiInstructions when strongly supported by this character's own actions or dialogue.
8. Catchphrases may only quote words this character actually speaks.
9. Preserve mystery. Do not decide guilt, secret senders, or endings the screenplay leaves unresolved.
10. If a field is unknown, omit it. Do not write "unknown", "not specified", or "N/A".
11. Return ONLY valid JSON with the optional keys listed below.

Optional keys:
${CHARACTER_PROFILE_FIELDS.map((field) => `- ${field}`).join("\n")}`;
}

export async function syncCharacterProfileWithAI(
  productionId: string,
  character: Character,
  context: CharacterAISyncContext = {}
): Promise<CharacterAISyncResult> {
  const screenplay = await screenplayRepository.getByProductionId(productionId);

  if (!screenplay?.content?.trim()) {
    throw new Error("Save a screenplay before using AI Character Sync.");
  }

  const storyBibleRecord = await storyBibleRepository.getByProductionId(
    productionId
  );
  const storyBible =
    compactStoryBible(
      (storyBibleRecord as unknown as Record<string, unknown> | null) ??
        (screenplay.analysis?.storyBible as unknown as Record<string, unknown> | null)
    ) ?? null;

  const otherCharacterNames = (context.otherCharacterNames ?? []).filter(
    (name) => name.trim().toLowerCase() !== character.name.trim().toLowerCase()
  );

  const existingProfile = Object.fromEntries(
    CHARACTER_PROFILE_FIELDS.map((field: CharacterProfileField) => [
      field,
      character[field] ?? "",
    ])
  );

  const userPrompt = `Create a grounded Character Profile for "${character.name}" only.

CURRENT PROFILE:
${JSON.stringify(existingProfile, null, 2)}

EXTRACTION NOTE:
${context.extractionDescription || "None."}

CHARACTER EVIDENCE FROM ANALYSIS:
${JSON.stringify(characterEvidence(character.name, screenplay.analysis), null, 2)}

OTHER CHARACTERS (do not copy their facts onto ${character.name}):
${otherCharacterNames.join(", ") || "None listed."}

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
      systemPrompt: buildSystemPrompt(character.name, otherCharacterNames),
      userPrompt,
      temperature: 0.1,
      maxTokens: 4000,
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
