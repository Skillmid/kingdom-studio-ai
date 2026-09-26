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
  const replaceOmittedFactualFields = options?.replaceOmittedFactualFields ?? false;
  const merged: Partial<Character> = {};

  for (const field of CHARACTER_PROFILE_FIELDS) {
    const current = existing[field];
    const next = proposal[field];
    const hasProposal = isFilledCharacterField(next);
    const hasCurrent = isFilledCharacterField(current);
    const factual = FACTUAL_FIELD_SET.has(field);

    if (replaceOmittedFactualFields && factual) {
      merged[field] = hasProposal ? String(next).trim() : "";
      continue;
    }

    if (hasProposal && (!hasCurrent || isExtractionStub(current))) {
      merged[field] = next;
      continue;
    }

    if (hasCurrent && !isExtractionStub(current)) {
      merged[field] = current;
    }
  }

  return merged;
}
