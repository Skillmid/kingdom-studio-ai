import { screenplayRepository } from "@/features/script-intelligence/repositories/screenplay.repository";
import type { ScreenplayAnalysis } from "@/features/script-intelligence/types/screenplay-analysis";
import { storyBibleRepository } from "@/features/story-bible/repositories/story-bible.repository";

import type { Character, CharacterRole } from "../types/character";
import { characterProfileProposalRepository } from "../repositories/character-profile-proposal.repository";
import {
  CHARACTER_PROFILE_FIELDS,
  type CharacterProfileField,
} from "../utils/character-progress";
import {
  extractJson,
  parseCharacterAIProfile,
} from "../utils/parse-character-ai-profile";

export type CharacterAISyncResult = Partial<Character>;

export interface CharacterAISyncContext {
  otherCharacterNames?: string[];
  extractionDescription?: string;
  extractedRole?: CharacterRole;
}

function cleanResult(value: unknown): CharacterAISyncResult {
  return parseCharacterAIProfile(value);
}

function compactStoryBible(storyBible: Record<string, unknown> | null) {
  if (!storyBible) return null;

  return Object.fromEntries(
    Object.entries(storyBible).filter(([, value]) => {
      if (typeof value === "number") return Number.isFinite(value);
      return typeof value === "string" && value.trim().length > 0;
    })
  );
}

function characterEvidence(name: string, analysis: ScreenplayAnalysis | null | undefined) {
  if (!analysis) return null;

  const key = name.trim().toLowerCase();
  const record = analysis.characters.find(
    (character) => character.name.trim().toLowerCase() === key
  );
  const scenes = analysis.scenes
    .filter((scene) => scene.characterNames.some((item) => item.trim().toLowerCase() === key))
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
  const others = otherNames.length > 0
    ? otherNames.join(", ")
    : "None listed. Still treat every other person in the screenplay as someone else.";

  return `You are the Character Bible intelligence engine for Kingdom Studio AI.

You are profiling ONE character only: "${characterName}".
Other characters in this production: ${others}

The canonical screenplay analysis and screenplay are the primary sources of truth. The Story Bible is supporting context only. Your output is a proposal for the creator to review, never an instruction to overwrite the saved character.

NON-NEGOTIABLE RULES:
1. Never invent facts that are not reasonably supported by the screenplay.
2. Never assign information that belongs to another character to "${characterName}".
3. Relationships must preserve the correct subject and object.
4. Omit age, gender, occupation, nationality, ethnicity, height, weight, eyeColor and hairColor unless the screenplay explicitly supports them for this character.
5. Do not guess appearance details.
6. Ground interpretations in this character's own actions or dialogue and keep them concise.
7. Catchphrases may only quote words this character actually speaks.
8. Preserve unresolved mystery and uncertainty.
9. If a field is unsupported, omit it. Do not write "unknown", "not specified", or "N/A".
10. Role must reflect evidence from the story rather than dialogue count alone. If importance cannot be established, omit role.
11. Return ONLY valid JSON using camelCase keys.

Optional keys:
- role
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

  const storyBibleRecord = await storyBibleRepository.getByProductionId(productionId);
  const storyBible = compactStoryBible(
    (storyBibleRecord as unknown as Record<string, unknown> | null) ??
      (screenplay.analysis?.storyBible as unknown as Record<string, unknown> | null)
  );

  const otherCharacterNames = (context.otherCharacterNames ?? []).filter(
    (name) => name.trim().toLowerCase() !== character.name.trim().toLowerCase()
  );

  const existingProfile = Object.fromEntries(
    CHARACTER_PROFILE_FIELDS.map((field: CharacterProfileField) => [
      field,
      character[field] ?? "",
    ])
  );

  const userPrompt = `Create a grounded Character Profile proposal for "${character.name}" only.

CURRENT USER-APPROVED PROFILE:
${JSON.stringify(existingProfile, null, 2)}

EXTRACTED ROLE (heuristic only):
${context.extractedRole || character.role}

EXTRACTION NOTE:
${context.extractionDescription || "None."}

CHARACTER EVIDENCE FROM CANONICAL ANALYSIS:
${JSON.stringify(characterEvidence(character.name, screenplay.analysis), null, 2)}

OTHER CHARACTERS (do not copy their facts onto ${character.name}):
${otherCharacterNames.join(", ") || "None listed."}

STORY BIBLE CONTEXT:
${storyBible ? JSON.stringify(storyBible, null, 2) : "None available."}

COMPLETE SCREENPLAY:
${screenplay.content}`;

  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: "openrouter",
      systemPrompt: buildSystemPrompt(character.name, otherCharacterNames),
      userPrompt,
      temperature: 0.1,
      maxTokens: 4000,
    }),
  });

  const data = (await response.json()) as { text?: string; error?: string };

  if (!response.ok) {
    throw new Error(data.error || "AI Character Sync failed.");
  }

  if (!data.text) {
    throw new Error("AI returned an empty character profile.");
  }

  const proposal = cleanResult(extractJson(data.text));

  await characterProfileProposalRepository.create({
    productionId,
    characterId: character.id,
    screenplayVersion: screenplay.version ?? null,
    proposal,
    provenance: {
      source: "screenplay",
      screenplayVersion: screenplay.version ?? null,
      evidence: characterEvidence(character.name, screenplay.analysis),
      generatedAt: new Date().toISOString(),
      notes: [
        "AI output is a proposal and was not applied to the character record.",
        "Existing user-approved character fields remain authoritative.",
      ],
    },
  });

  return proposal;
}
