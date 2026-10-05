"use client";

import CharacterCard from "./CharacterCard";
import type { Character } from "../types/character";

interface CharacterListProps {
  characters: Character[];
  loading?: boolean;
  onOpen?: (character: Character) => void;
  onCreate?: () => void;
  onSync?: () => void;
  syncing?: boolean;
}

export default function CharacterList({
  characters,
  loading = false,
  onOpen,
  onCreate,
  onSync,
  syncing = false,
}: CharacterListProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
        Loading characters...
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900 p-10 text-center">
        <h3 className="text-xl font-semibold text-white">No Characters Yet</h3>
        <p className="mt-3 text-zinc-400">
          Create your first character to begin building your production.
        </p>
        {(onCreate || onSync) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {onCreate && (
              <button
                type="button"
                onClick={onCreate}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
              >
                + Add First Character
              </button>
            )}
            {onSync && (
              <button
                type="button"
                onClick={onSync}
                disabled={syncing}
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
              >
                {syncing ? "Syncing Screenplay..." : "Sync from Screenplay"}
              </button>
            )}
          </div>
        )}
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