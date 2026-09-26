import { supabase } from "@/lib/supabase/client";
import type { Character } from "../types/character";

export type CharacterProposalStatus = "pending" | "applied" | "dismissed";

export interface CharacterProposalProvenance {
  source: "screenplay";
  screenplayVersion: number | null;
  evidence: unknown;
  generatedAt: string;
  model?: string;
  notes?: string[];
}

export interface CharacterProfileProposal {
  id: string;
  productionId: string;
  characterId: string;
  screenplayVersion: number | null;
  proposal: Partial<Character>;
  provenance: CharacterProposalProvenance;
  status: CharacterProposalStatus;
  createdAt: string;
  updatedAt: string;
}

interface ProposalRow {
  id: string;
  production_id: string;
  character_id: string;
  screenplay_version: number | null;
  proposal: Partial<Character>;
  provenance: CharacterProposalProvenance;
  status: CharacterProposalStatus;
  created_at: string;
  updated_at: string;
}

export class CharacterProfileProposalRepository {
  async create(input: {
    productionId: string;
    characterId: string;
    screenplayVersion: number | null;
    proposal: Partial<Character>;
    provenance: CharacterProposalProvenance;
  }): Promise<CharacterProfileProposal> {
    const { data, error } = await supabase
      .from("character_profile_proposals")
      .insert({
        production_id: input.productionId,
        character_id: input.characterId,
        screenplay_version: input.screenplayVersion,
        proposal: input.proposal,
        provenance: input.provenance,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.map(data as ProposalRow);
  }

  async getPendingForCharacter(characterId: string): Promise<CharacterProfileProposal[]> {
    const { data, error } = await supabase
      .from("character_profile_proposals")
      .select("*")
      .eq("character_id", characterId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return ((data ?? []) as ProposalRow[]).map((row) => this.map(row));
  }

  async markStatus(id: string, status: CharacterProposalStatus): Promise<void> {
    const { error } = await supabase
      .from("character_profile_proposals")
      .update({ status })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  private map(row: ProposalRow): CharacterProfileProposal {
    return {
      id: row.id,
      productionId: row.production_id,
      characterId: row.character_id,
      screenplayVersion: row.screenplay_version,
      proposal: row.proposal,
      provenance: row.provenance,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const characterProfileProposalRepository =
  new CharacterProfileProposalRepository();
