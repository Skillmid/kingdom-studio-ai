import type {
  Character, CharacterFieldProvenance, CharacterProfileProvenance,
  CharacterProfileSource, CharacterProposalField,
} from "../types/character";
import type { ParsedCharacterAIProfile } from "./parse-character-ai-profile";

export interface CharacterAIProposal extends ParsedCharacterAIProfile {
  source: CharacterProfileSource;
}

export function applyAcceptedCharacterProposal(
  existing: Partial<Character>,
  proposal: CharacterAIProposal,
  acceptedFields: CharacterProposalField[],
  acceptedAt: string
): Partial<Character> {
  const update: Partial<Character> = {};
  const provenance: CharacterProfileProvenance = { ...existing.profileProvenance };
  for (const field of acceptedFields) {
    const value = proposal.fields[field];
    const evidence = proposal.fieldEvidence[field];
    if (typeof value !== "string" || !value.trim() || !evidence?.trim()) continue;
    (update as Record<string, unknown>)[field] = value.trim();
    const fieldProvenance: CharacterFieldProvenance = {
      provenance: "ai-proposal",
      source: { ...proposal.source, evidence: evidence.trim() },
      proposedValue: value.trim(),
      acceptedAt,
      editedByCreator: false,
    };
    provenance[field] = fieldProvenance;
  }
  if (Object.keys(provenance).length) update.profileProvenance = provenance;
  else if (existing.profileProvenance) update.profileProvenance = existing.profileProvenance;
  return update;
}

export function markCreatorEdit(
  provenance: CharacterProfileProvenance | undefined,
  field: CharacterProposalField,
  value: string
): CharacterProfileProvenance | undefined {
  const current = provenance?.[field];
  if (!current || current.proposedValue === value) return provenance;
  return { ...provenance, [field]: { ...current, editedByCreator: true } };
}
