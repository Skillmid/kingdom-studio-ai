import type { Character } from "../types/character";
import {
  CHARACTER_PROFILE_FIELDS,
  FACTUAL_CHARACTER_FIELDS,
  isExtractionStub,
  isFilledCharacterField,
} from "./character-progress";

const FACTUAL_FIELD_SET = new Set<string>(FACTUAL_CHARACTER_FIELDS);

export function mergeCharacterProfile(
  existing: Partial<Character>,
  proposal: Partial<Character>,
  options?: { replaceOmittedFactualFields?: boolean }
): Partial<Character> {
  const replaceOmittedFactualFields = options?.replaceOmittedFactualFields ?? true;
  const merged: Partial<Character> = {};

  for (const field of CHARACTER_PROFILE_FIELDS) {
    const current = existing[field];
    const next = proposal[field];
    const hasProposal = isFilledCharacterField(next);
    const hasCurrent = isFilledCharacterField(current);

    if (hasProposal) {
      if (!hasCurrent || isExtractionStub(current)) {
        merged[field] = next;
        continue;
      }

      merged[field] = current;
      continue;
    }

    if (
      replaceOmittedFactualFields &&
      FACTUAL_FIELD_SET.has(field) &&
      hasCurrent &&
      isExtractionStub(current)
    ) {
      merged[field] = "";
      continue;
    }

    if (replaceOmittedFactualFields && FACTUAL_FIELD_SET.has(field) && hasCurrent) {
      // Previous bulk sync often guessed occupation from another character.
      // If this pass cannot ground the fact, clear it.
      merged[field] = "";
      continue;
    }

    if (hasCurrent && !isExtractionStub(current)) {
      merged[field] = current;
    }
  }

  return merged;
}
