import type { Character, CharacterProfileField } from "../types/character";
export const CHARACTER_PROFILE_FIELDS: readonly CharacterProfileField[] = [
  "age", "gender", "occupation", "nationality", "ethnicity", "biography", "appearance",
  "height", "weight", "eyeColor", "hairColor", "distinguishingFeatures", "personality",
  "strengths", "weaknesses", "fears", "habits", "values", "motivation", "goal", "conflict",
  "characterArc", "spiritualJourney", "speechStyle", "catchPhrases", "aiInstructions",
];
const UNKNOWN = /^(unknown|n\/a|n\.a\.|na|none|not specified|unspecified|not stated|not given|-)$/i;
const EXTRACTION_STUB = /\bSpeaks\s+\d+\s+time|\bAppears in screenplay|\bPresent in screenplay action|\bEvidence:/i;
export function isUnknownFieldValue(value: string | null | undefined): boolean {
  return !value?.trim() || UNKNOWN.test(value.trim());
}
export function isExtractionStub(value: string | null | undefined): boolean {
  return isUnknownFieldValue(value) || EXTRACTION_STUB.test(value ?? "");
}
export function calculateCharacterProgress(character: Partial<Character>): number {
  const filled = CHARACTER_PROFILE_FIELDS.filter((field) => !isExtractionStub(character[field])).length;
  return Math.round((filled / CHARACTER_PROFILE_FIELDS.length) * 100);
}
export function characterStatusFromProgress(progress: number): Character["status"] {
  return progress >= 100 ? "completed" : progress > 0 ? "in-progress" : "draft";
}
