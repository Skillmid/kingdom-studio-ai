"use client";

import CharacterCard from "./CharacterCard";

import type { Character } from "../types/character";

interface CharacterListProps {
  characters: Character[];

  loading?: boolean;

  onOpen?: (character: Character) => void;
}

export default function CharacterList({
  characters,
  loading = false,
  onOpen,
}: CharacterListProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        Loading characters...
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900 p-10 text-center">

        <h3 className="text-xl font-semibold">
          No Characters Yet
        </h3>

        <p className="mt-3 text-zinc-400">
          Create your first character to begin building your production.
        </p>

      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

      {characters.map((character) => (
        <CharacterCard
          key={character.id}
          character={character}
          onOpen={onOpen}
        />
      ))}

    </div>
  );
}