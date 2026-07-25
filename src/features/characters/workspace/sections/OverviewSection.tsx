"use client";

import type { Character } from "../../types/character";

interface OverviewSectionProps {
  character: Character;
}

export default function OverviewSection({
  character,
}: OverviewSectionProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">

      <h2 className="text-2xl font-bold">
        Overview
      </h2>

      <div className="mt-8 grid gap-6 md:grid-cols-2">

        <div>

          <label className="mb-2 block text-sm font-medium">
            Character Name
          </label>

          <input
            readOnly
            value={character.name}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium">
            Occupation
          </label>

          <input
            readOnly
            value={character.occupation ?? ""}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium">
            Age
          </label>

          <input
            readOnly
            value={character.age ?? ""}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium">
            Role
          </label>

          <input
            readOnly
            value={character.role}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
          />

        </div>

      </div>

    </section>
  );
}
