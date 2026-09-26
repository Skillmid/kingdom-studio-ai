import type { Character } from "../types/character";
import {
  CHARACTER_PROFILE_FIELDS,
  calculateCharacterProgress,
} from "./character-progress";

function textValue(value: string | null | undefined): string {
  return typeof value === "string" ? value : "";
}

export function hydrateCharacterForm(
  character: Partial<Character>
): Partial<Character> {
  const form: Partial<Character> = {
    id: character.id,
    productionId: character.productionId,
    name: textValue(character.name),
    role: character.role ?? "supporting",
    status: character.status ?? "draft",
  };

  for (const field of CHARACTER_PROFILE_FIELDS) {
    form[field] = textValue(character[field]);
  }

  form.progress = calculateCharacterProgress(form);
  form.references = character.references ?? [];
  form.createdAt = character.createdAt;
  form.updatedAt = character.updatedAt;

  return form;
}
