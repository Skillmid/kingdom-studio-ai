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

export function isFilledCharacterField(
  value: string | number | null | undefined
): boolean {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  return typeof value === "string" && value.trim().length > 0;
}

export function isExtractionStub(value: string | null | undefined): boolean {
  if (!value || !value.trim()) {
    return true;
  }

  return /(Speaks\s+\d+\s+time|Appears in screenplay|Present in screenplay action|Evidence:)/i.test(
    value
  );
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
