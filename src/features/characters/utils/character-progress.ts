import type { Character } from "../types/character";

export const CHARACTER_PROFILE_FIELDS = [
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

export type CharacterProfileField = (typeof CHARACTER_PROFILE_FIELDS)[number];

export const FACTUAL_CHARACTER_FIELDS = [
  "age",
  "gender",
  "occupation",
  "nationality",
  "ethnicity",
  "height",
  "weight",
  "eyeColor",
  "hairColor",
] as const satisfies readonly CharacterProfileField[];

const UNKNOWN_FIELD_PATTERN =
  /^(unknown|n\/a|n\.a\.|na|none|not specified|unspecified|not stated|not given|-)$/i;

const EXTRACTION_STUB_PATTERN =
  /\bSpeaks\s+\d+\s+time|\bAppears in screenplay|\bPresent in screenplay action|\bEvidence:/i;

export function isUnknownFieldValue(value: string | null | undefined): boolean {
  if (!value || !value.trim()) {
    return true;
  }

  return UNKNOWN_FIELD_PATTERN.test(value.trim());
}

export function isExtractionStub(value: string | null | undefined): boolean {
  if (!value || !value.trim() || isUnknownFieldValue(value)) {
    return true;
  }

  return EXTRACTION_STUB_PATTERN.test(value);
}

export function isFilledCharacterField(
  value: string | number | null | undefined
): boolean {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    return false;
  }

  return !isUnknownFieldValue(value) && !isExtractionStub(value);
}

export function calculateCharacterProgress(
  character: Partial<Character>
): number {
  const filled = CHARACTER_PROFILE_FIELDS.filter((field) =>
    isFilledCharacterField(character[field])
  ).length;

  return Math.round((filled / CHARACTER_PROFILE_FIELDS.length) * 100);
}

export function characterStatusFromProgress(
  progress: number
): Character["status"] {
  if (progress >= 100) {
    return "completed";
  }

  if (progress > 0) {
    return "in-progress";
  }

  return "draft";
}
