import { extractFromScreenplay } from "@/features/import-engine/extract-from-screenplay";
import { screenplayRepository } from "@/features/script-intelligence/repositories/screenplay.repository";

import { characterRepository } from "../repositories/character.repository";
import type { Character } from "../types/character";
import type { ExtractedCharacter } from "@/features/import-engine/extract-from-screenplay";
import { syncCharacterProfileWithAI } from "./character-ai-sync.service";
import { mergeCharacterProfile } from "../utils/merge-character-profile";
import {
  calculateCharacterProgress,
  characterStatusFromProgress,
} from "../utils/character-progress";

export function previewCharactersFromScreenplay(
  screenplayContent: string,
  analysis?: Parameters<typeof extractFromScreenplay>[1]
): ExtractedCharacter[] {
  return extractFromScreenplay(screenplayContent, analysis).characters;
}

export async function syncCharactersFromScreenplay(productionId: string): Promise<{
  createdCount: number;
  profiledCount: number;
  failedCount: number;
  totalExtracted: number;
  extracted: ExtractedCharacter[];
  created: Character[];
  profiled: Character[];
  failed: Array<{ name: string; error: string }>;
}> {
  if (!productionId) throw new Error("Production ID is required.");

  const screenplay = await screenplayRepository.getByProductionId(productionId);
  if (!screenplay || !screenplay.content.trim()) {
    throw new Error("No screenplay content found for this production. Save or import a script first.");
  }

  const extracted = previewCharactersFromScreenplay(screenplay.content, screenplay.analysis);
  if (extracted.length === 0) {
    return {
      createdCount: 0,
      profiledCount: 0,
      failedCount: 0,
      totalExtracted: 0,
      extracted,
      created: [],
      profiled: [],
      failed: [],
    };
  }

  const existingCharacters = await characterRepository.getByProductionId(productionId);
  const existingByName = new Map(
    existingCharacters.map((character) => [character.name.trim().toLowerCase(), character])
  );

  const otherNames = extracted.map((character) => character.name);
  const created: Character[] = [];
  const profiled: Character[] = [];
  const failed: Array<{ name: string; error: string }> = [];

  for (const extractedCharacter of extracted) {
    const key = extractedCharacter.name.trim().toLowerCase();
    let record = existingByName.get(key);

    if (!record) {
      record = await characterRepository.create({
        productionId,
        name: extractedCharacter.name,
        role: extractedCharacter.role,
        status: "draft",
        progress: 0,
      });
      existingByName.set(key, record);
      created.push(record);
    }

    try {
      const proposal = await syncCharacterProfileWithAI(productionId, record, {
        otherCharacterNames: otherNames,
        extractionDescription: extractedCharacter.description,
        extractedRole: extractedCharacter.role,
      });

      const merged = mergeCharacterProfile(record, proposal, {
        replaceOmittedFactualFields: true,
      });
      const nextRole = proposal.role ?? record.role ?? extractedCharacter.role;
      const progress = calculateCharacterProgress({
        ...record,
        ...merged,
        role: nextRole,
      });

      const updated = await characterRepository.update(record.id, {
        ...merged,
        role: nextRole,
        progress,
        status: characterStatusFromProgress(progress),
      });

      existingByName.set(key, updated);
      profiled.push(updated);
    } catch (error) {
      failed.push({
        name: extractedCharacter.name,
        error: error instanceof Error ? error.message : "Character profile sync failed.",
      });
    }
  }

  return {
    createdCount: created.length,
    profiledCount: profiled.length,
    failedCount: failed.length,
    totalExtracted: extracted.length,
    extracted,
    created,
    profiled,
    failed,
  };
}
