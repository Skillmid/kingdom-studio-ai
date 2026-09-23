import { extractFromScreenplay } from "@/features/import-engine/extract-from-screenplay";
import { screenplayRepository } from "@/features/script-intelligence/repositories/screenplay.repository";

import { characterRepository } from "../repositories/character.repository";
import type { Character } from "../types/character";
import type { ExtractedCharacter } from "@/features/import-engine/extract-from-screenplay";

/**
 * The Characters page Sync button must use this function and nothing else.
 * It never scans raw uppercase lines. It only reads parseScreenplay() cues.
 */
export function previewCharactersFromScreenplay(
  screenplayContent: string
): ExtractedCharacter[] {
  return extractFromScreenplay(screenplayContent).characters;
}

export async function syncCharactersFromScreenplay(productionId: string): Promise<{
  createdCount: number;
  totalExtracted: number;
  extracted: ExtractedCharacter[];
  created: Character[];
}> {
  if (!productionId) {
    throw new Error("Production ID is required.");
  }

  const screenplay = await screenplayRepository.getByProductionId(productionId);

  if (!screenplay || !screenplay.content.trim()) {
    throw new Error(
      "No screenplay content found for this production. Save or import a script first."
    );
  }

  const extracted = previewCharactersFromScreenplay(screenplay.content);
  if (extracted.length === 0) {
    return { createdCount: 0, totalExtracted: 0, extracted, created: [] };
  }

  const existingCharacters = await characterRepository.getByProductionId(productionId);
  const existingNames = new Set(
    existingCharacters.map((character) => character.name.trim().toLowerCase())
  );

  const newCharacters = extracted.filter((character) => {
    const key = character.name.trim().toLowerCase();
    if (existingNames.has(key)) return false;
    existingNames.add(key);
    return true;
  });

  if (newCharacters.length === 0) {
    return {
      createdCount: 0,
      totalExtracted: extracted.length,
      extracted,
      created: [],
    };
  }

  const created = await characterRepository.createMany(
    newCharacters.map((character) => ({
      productionId,
      name: character.name,
      role: character.role,
      status: "draft",
      biography: character.description,
      progress: 10,
    }))
  );

  return {
    createdCount: created.length,
    totalExtracted: extracted.length,
    extracted,
    created,
  };
}
