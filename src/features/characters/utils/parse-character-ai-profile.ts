import { z } from "zod";
import type { Character, CharacterProposalField } from "../types/character";
import { CHARACTER_PROFILE_FIELDS, isUnknownFieldValue } from "./character-progress";
export type CharacterAIProfileFields = Partial<Pick<Character, CharacterProposalField>>;
export interface ParsedCharacterAIProfile {
  fields: CharacterAIProfileFields;
  fieldEvidence: Partial<Record<CharacterProposalField, string>>;
}
function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}
const aliases: Record<string, CharacterProposalField> = Object.fromEntries([
  ...CHARACTER_PROFILE_FIELDS.map((field) => [normalize(field), field]),
  ["role", "role"],
]) as Record<string, CharacterProposalField>;
const schema = z.object({
  age: z.string().max(500).optional(), gender: z.string().max(500).optional(),
  occupation: z.string().max(1000).optional(), nationality: z.string().max(500).optional(),
  ethnicity: z.string().max(500).optional(), biography: z.string().max(5000).optional(),
  appearance: z.string().max(3000).optional(), height: z.string().max(500).optional(),
  weight: z.string().max(500).optional(), eyeColor: z.string().max(500).optional(),
  hairColor: z.string().max(500).optional(), distinguishingFeatures: z.string().max(2000).optional(),
  personality: z.string().max(2000).optional(), strengths: z.string().max(2000).optional(),
  weaknesses: z.string().max(2000).optional(), fears: z.string().max(2000).optional(),
  habits: z.string().max(2000).optional(), values: z.string().max(2000).optional(),
  motivation: z.string().max(2000).optional(), goal: z.string().max(2000).optional(),
  conflict: z.string().max(2000).optional(), characterArc: z.string().max(3000).optional(),
  spiritualJourney: z.string().max(3000).optional(), speechStyle: z.string().max(2000).optional(),
  catchPhrases: z.string().max(2000).optional(), aiInstructions: z.string().max(3000).optional(),
  role: z.enum(["lead", "supporting", "minor", "extra"]).optional(),
});
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function parseRole(value: unknown): Character["role"] | undefined {
  if (typeof value !== "string") return undefined;
  const role = value.trim().toLowerCase();
  if (["lead", "supporting", "minor", "extra"].includes(role)) return role as Character["role"];
  if (/(protagonist|main character|hero|heroine)/.test(role)) return "lead";
  if (/(support|secondary)/.test(role)) return "supporting";
  if (/(minor|small)/.test(role)) return "minor";
  if (/(extra|background)/.test(role)) return "extra";
  return undefined;
}
export function extractJson(text: string): unknown {
  const cleaned = text.trim();
  try { return JSON.parse(cleaned); } catch {
    const start = cleaned.indexOf("{"), end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("AI did not return valid character profile JSON.");
  }
}
export function parseCharacterAIProfile(value: unknown): ParsedCharacterAIProfile {
  const root = record(value);
  const input = record(root.fields ?? root.profile ?? root.character ?? root);
  const rawEvidence = record(root.fieldEvidence ?? root.evidence);
  const normalizedEvidence = new Map(
    Object.entries(rawEvidence).map(([key, item]) => [normalize(key), item] as const)
  );
  const rawFields: Record<string, unknown> = {};
  const fieldEvidence: Partial<Record<CharacterProposalField, string>> = {};
  for (const [rawKey, rawValue] of Object.entries(input)) {
    const field = aliases[normalize(rawKey)];
    if (!field) continue;
    const item = record(rawValue);
    const valueText = typeof rawValue === "string" ? rawValue : item.value;
    if (field === "role") {
      const role = parseRole(valueText);
      if (role) rawFields.role = role;
    } else if (typeof valueText === "string" && !isUnknownFieldValue(valueText)) {
      rawFields[field] = valueText.trim();
    }
    const evidence = item.evidence ?? rawEvidence[rawKey] ?? rawEvidence[field] ??
      normalizedEvidence.get(normalize(rawKey));
    if (typeof evidence === "string" && evidence.trim()) fieldEvidence[field] = evidence.trim();
  }
  const parsed = schema.safeParse(rawFields);
  if (!parsed.success) throw new Error("AI returned invalid character profile fields.");
  return { fields: parsed.data, fieldEvidence };
}
