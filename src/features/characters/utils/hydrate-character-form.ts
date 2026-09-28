import type { Character } from "../types/character";
import { CHARACTER_PROFILE_FIELDS, calculateCharacterProgress } from "./character-progress";

export function hydrateCharacterForm(character: Partial<Character>): Partial<Character> {
  const form: Partial<Character> = {
    ...character,
    name: character.name ?? "",
    role: character.role ?? "supporting",
    status: character.status ?? "draft",
    profileProvenance: character.profileProvenance ?? {},
    references: character.references ?? [],
  };
  for (const field of CHARACTER_PROFILE_FIELDS) form[field] = character[field] ?? "";
  form.progress = calculateCharacterProgress(form);
  return form;
}
