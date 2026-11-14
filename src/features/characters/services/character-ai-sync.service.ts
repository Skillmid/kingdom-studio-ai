import type { AIRequest, AIResponse } from "@/platform/ai/types/ai-provider";
import { DEFAULT_AI_PROVIDER } from "@/platform/ai/config/default-provider";
import { sceneExtractor } from "@/features/import-engine/extractors/scene.extractor";

const MAX_CHARACTER_CONTEXT_CHARS = 24_000;
const MAX_RELEVANT_SCENES = 10;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");
}

/** Select a compact, character-specific source packet; evidence is still checked against the full screenplay. */
export async function extractRelevantCharacterScenes(screenplay: string, characterName: string): Promise<string> {
  const document = await sceneExtractor.parse(screenplay);
  const normalizedName = characterName.trim().toLocaleLowerCase();
  const mention = new RegExp("(^|[^\\p{L}])" + escapeRegExp(characterName.trim()) + "([^\\p{L}]|$)", "iu");
  const relevant = document.scenes.filter((scene) => {
    const hasDialogue = scene.dialogues.some((entry) => entry.character.trim().toLocaleLowerCase() === normalizedName);
    return hasDialogue || mention.test(scene.action);
  }).slice(0, MAX_RELEVANT_SCENES);
  const blocks = relevant.map((scene) => {
    const dialogue = scene.dialogues
      .filter((entry) => entry.character.trim().toLocaleLowerCase() === normalizedName)
      .map((entry) => entry.character + ": " + entry.text)
      .join("\n");
    return [
      "SCENE " + scene.number + ": " + scene.heading,
      scene.action ? "ACTION:\n" + scene.action : "",
      dialogue ? "CHARACTER DIALOGUE:\n" + dialogue : "",
    ].filter(Boolean).join("\n\n");
  }).filter(Boolean);
  let context = blocks.join("\n\n---\n\n");
  if (!context) context = extractCharacterEvidence(screenplay, characterName).join("\n\n");
  if (!context.trim()) throw new Error("No screenplay scenes or dialogue could be confidently matched to " + characterName + ". Check the character cue in the screenplay.");
  return context.slice(0, MAX_CHARACTER_CONTEXT_CHARS);
}

import type { Character, CharacterProfileSource } from "../types/character";
import { extractJson, parseCharacterAIProfile } from "../utils/parse-character-ai-profile";
import type { CharacterAIProposal } from "../utils/review-character-proposal";
interface ScreenplaySnapshot { id: string; title: string; version: number; content: string }
interface ScreenplayRevisionSnapshot { id: string; screenplayId: string; version: number }
interface CharacterAISyncDependencies {
  screenplayRepository: {
    getByProductionId(id: string): Promise<ScreenplaySnapshot | null>;
    getRevisions(id: string): Promise<ScreenplayRevisionSnapshot[]>;
  };
  aiGateway: { generate(request: AIRequest): Promise<AIResponse> };
}
function normalizeEvidence(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}
export function extractCharacterEvidence(screenplay: string, name: string): string[] {
  const lines = screenplay.split(/\r?\n/);
  const escaped = name.trim().replace(/[.*+?^$()|[\]\\]/g, "\\$&");
  const cue = new RegExp("^\\s*" + escaped + "(?:\\s*\\([^)]*\\))?\\s*$", "i");
  const matches: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!cue.test(lines[index] ?? "")) continue;
    const excerpt = lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 3))
      .map((line) => line.trim()).filter(Boolean).join(" ");
    if (excerpt && !matches.includes(excerpt)) matches.push(excerpt.slice(0, 700));
    if (matches.length === 8) break;
  }
  return matches;
}
function systemPrompt(character: Character): string {
  return [
    "Create a grounded profile proposal for the single supplied character. The supplied character-specific screenplay scenes are the source of truth. Treat the existing profile as context only.",
    "Do not invent facts or assign another character's facts to this character. Leave factual fields such as age, gender, occupation, nationality, ethnicity, height, weight, eye color, and hair color empty unless explicitly supported. Sparse scripts should produce fewer fields, not guesses. Preserve ambiguity.",
    "Return one valid JSON object only, with no Markdown fences, comments, or prose before or after it. The object must contain fields and fieldEvidence. Escape all quotation marks, backslashes, and line breaks inside JSON strings. Use camelCase profile field names and role values lead, supporting, minor, or extra. Each proposed field needs fieldEvidence containing an exact verbatim screenplay excerpt. Omit fields without evidence. Catchphrases must quote dialogue. The creator reviews every proposal before anything is saved.",
    "Character: " + character.name,
  ].join("\n\n");
}
function userPrompt(character: Character, screenplay: ScreenplaySnapshot, evidence: string[], relevantScenes: string): string {
  return [
    "SCREENPLAY TITLE: " + screenplay.title,
    "SCREENPLAY VERSION: " + screenplay.version,
    "CURRENT CHARACTER PROFILE:\n" + JSON.stringify(character, null, 2),
    "CHARACTER CUE EXCERPTS:\n" + JSON.stringify(evidence, null, 2),
    "RELEVANT CHARACTER SCENES (selected from the complete screenplay):\n" + relevantScenes,
  ].join("\n\n");
}
export function createCharacterAISyncService(dependencies: CharacterAISyncDependencies) {
  return {
    async propose(productionId: string, character: Character): Promise<CharacterAIProposal> {
      if (!productionId || character.productionId !== productionId) {
        throw new Error("Character does not belong to the requested production.");
      }
      const screenplay = await dependencies.screenplayRepository.getByProductionId(productionId);
      if (!screenplay?.content.trim()) throw new Error("Save a screenplay before using AI Character Sync.");
      const revisions = await dependencies.screenplayRepository.getRevisions(screenplay.id);
      const revision = revisions.find((item) => item.version === screenplay.version);
      const source: CharacterProfileSource = {
        screenplayId: screenplay.id, revisionId: revision?.id,
        screenplayTitle: screenplay.title, screenplayVersion: screenplay.version,
      };
      const evidence = extractCharacterEvidence(screenplay.content, character.name);
      const relevantScenes = await extractRelevantCharacterScenes(screenplay.content, character.name);
      const response = await dependencies.aiGateway.generate({
        provider: DEFAULT_AI_PROVIDER, systemPrompt: systemPrompt(character),
        userPrompt: userPrompt(character, screenplay, evidence, relevantScenes),
        temperature: 0.1, maxTokens: 4000, responseFormat: "json", productionId,
      });
      const parsed = parseCharacterAIProfile(extractJson(response.text));
      const fields = { ...parsed.fields };
      const fieldEvidence = { ...parsed.fieldEvidence };
      const sourceText = normalizeEvidence(screenplay.content);
      for (const field of Object.keys(fields) as Array<keyof typeof fields>) {
        const quote = fieldEvidence[field];
        if (!quote || !sourceText.includes(normalizeEvidence(quote))) {
          delete (fields as Record<string, unknown>)[field];
          delete (fieldEvidence as Record<string, unknown>)[field];
        }
      }
      return { fields, fieldEvidence, source };
    },
  };
}
