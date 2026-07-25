"use client";

import type { Character } from "../types/character";

interface CharacterCardProps {
  character: Character;

  onOpen?: (character: Character) => void;
}

function getRoleColor(role: Character["role"]) {
  switch (role) {
    case "lead":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";

    case "supporting":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";

    case "minor":
      return "bg-green-500/20 text-green-400 border-green-500/30";

    default:
      return "bg-zinc-700 text-zinc-300 border-zinc-600";
  }
}

export default function CharacterCard({
  character,
  onOpen,
}: CharacterCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition hover:border-yellow-500">

      <div className="flex items-start justify-between">

        <div>

          <h3 className="text-xl font-bold">
            {character.name}
          </h3>

          <p className="mt-1 text-sm text-zinc-400">
            {character.occupation || "No occupation"}
          </p>

        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getRoleColor(
            character.role
          )}`}
        >
          {character.role.toUpperCase()}
        </span>

      </div>

      <div className="mt-6">

        <div className="mb-2 flex justify-between text-sm">

          <span>Completion</span>

          <span>{character.progress}%</span>

        </div>

        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">

          <div
            className="h-full rounded-full bg-yellow-500 transition-all"
            style={{
              width: `${character.progress}%`,
            }}
          />

        </div>

      </div>

      <div className="mt-6 flex items-center justify-between">

        <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs uppercase tracking-wide text-zinc-300">
          {character.status}
        </span>

        <button
          type="button"
          onClick={() => onOpen?.(character)}
          className="rounded-xl bg-yellow-500 px-4 py-2 font-semibold text-black transition hover:opacity-90"
        >
          Open
        </button>

      </div>

    </div>
  );
}