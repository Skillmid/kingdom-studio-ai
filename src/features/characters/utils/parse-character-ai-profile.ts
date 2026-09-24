import type { Character, CharacterRole } from "../types/character";
import {
  isUnknownFieldValue,
  type CharacterProfileField,
} from "./character-progress";

export type CharacterAIProfileProposal = Partial<Character>;

const FIELD_ALIASES: Record<string, CharacterProfileField | "role"> = {
  age: "age",
  gender: "gender",
  occupation: "occupation",
  nationality: "nationality",
  ethnicity: "ethnicity",
  biography: "biography",
  appearance: "appearance",
  height: "height",
  weight: "weight",
  eyecolor: "eyeColor",
  eye_color: "eyeColor",
  haircolor: "hairColor",
  hair_color: "hairColor",
  distinguishingfeatures: "distinguishingFeatures",
  distinguishing_features: "distinguishingFeatures",
  personality: "personality",
  strengths: "strengths",
  weaknesses: "weaknesses",
  fears: "fears",
  habits: "habits",
  values: "values",
  motivation: "motivation",
  goal: "goal",
  conflict: "conflict",
  characterarc: "characterArc",
  character_arc: "characterArc",
  spiritualjourney: "spiritualJourney",
  spiritual_journey: "spiritualJourney",
  speechstyle: "speechStyle",
  speech_style: "speechStyle",
  catchphrases: "catchPhrases",
  catch_phrases: "catchPhrases",
  aiinstructions: "aiInstructions",
  ai_instructions: "aiInstructions",
  role: "role",
};

const CHARACTER_ROLES: CharacterRole[] = [
  "lead",
  "supporting",
  "minor",
  "extra",
];

export function extractJson(text: string): unknown {
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

function unwrapProfilePayload(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) {
    const first = value.find(
      (item) => item && typeof item === "object" && !Array.isArray(item)
    );
    if (first) {
      return first as Record<string, unknown>;
    }
    throw new Error("AI returned an invalid character profile.");
  }

  if (!value || typeof value !== "object") {
    throw new Error("AI returned an invalid character profile.");
  }

  const source = value as Record<string, unknown>;
  const nested =
    source.profile ?? source.character ?? source.result ?? source.data;

  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }

  return source;
}

function parseRole(value: unknown): CharacterRole | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (CHARACTER_ROLES.includes(normalized as CharacterRole)) {
    return normalized as CharacterRole;
  }

  if (/(protagonist|main|hero|heroine|lead)/.test(normalized)) {
    return "lead";
  }

  if (/(support|secondary)/.test(normalized)) {
    return "supporting";
  }

  if (/(minor|small)/.test(normalized)) {
    return "minor";
  }

  if (/(extra|background|bit)/.test(normalized)) {
    return "extra";
  }

  return undefined;
}

export function parseCharacterAIProfile(
  value: unknown
): CharacterAIProfileProposal {
  const source = unwrapProfilePayload(value);
  const result: CharacterAIProfileProposal = {};

  for (const [rawKey, rawValue] of Object.entries(source)) {
    const field = FIELD_ALIASES[rawKey.trim().toLowerCase()];
    if (!field) {
      continue;
    }

    if (field === "role") {
      const role = parseRole(rawValue);
      if (role) {
        result.role = role;
      }
      continue;
    }

    if (typeof rawValue !== "string") {
      continue;
    }

    const trimmed = rawValue.trim();
    if (!trimmed || isUnknownFieldValue(trimmed)) {
      continue;
    }

    result[field] = trimmed;
  }

  return result;
}
