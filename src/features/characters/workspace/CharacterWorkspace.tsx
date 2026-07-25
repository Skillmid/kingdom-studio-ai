"use client";

import ProductionWorkspace from "@/features/workspace/components/ProductionWorkspace";

import type { Character } from "../types/character";

interface CharacterWorkspaceProps {
  productionId: string;

  character: Character;
}

export default function CharacterWorkspace({
  productionId,
  character,
}: CharacterWorkspaceProps) {
  return (
    <ProductionWorkspace
      productionId={productionId}
      title={character.name}
      subtitle={`${character.role.toUpperCase()} CHARACTER`}
      options={{
        sections: [
          {
            id: "overview",
            title: "Overview",
          },
          {
            id: "appearance",
            title: "Appearance",
          },
          {
            id: "personality",
            title: "Personality",
          },
          {
            id: "story-arc",
            title: "Story Arc",
          },
          {
            id: "relationships",
            title: "Relationships",
          },
          {
            id: "voice",
            title: "Voice",
          },
          {
            id: "ai",
            title: "AI Instructions",
          },
          {
            id: "references",
            title: "References",
          },
          {
            id: "assets",
            title: "Assets",
          },
        ],
      }}
    >
      <div className="space-y-8">

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">

          <h2 className="text-2xl font-bold">
            Character Workspace
          </h2>

          <p className="mt-3 text-zinc-400">
            This workspace will contain every aspect of the character,
            including appearance, personality, relationships, AI
            instructions, voice profile, and visual references.
          </p>

        </section>

      </div>
    </ProductionWorkspace>
  );
}