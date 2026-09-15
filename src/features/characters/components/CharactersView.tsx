"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useCharacters } from "../hooks/use-characters";
import CharacterList from "./CharacterList";
import type { Character, CharacterRole } from "../types/character";

interface CharactersViewProps {
  productionId: string;
}

export function CharactersView({ productionId }: CharactersViewProps) {
  const {
    characters,
    loading,
    saving,
    syncing,
    error,
    createCharacter,
    syncFromScreenplay,
  } = useCharacters(productionId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<CharacterRole>("supporting");
  const [newOccupation, setNewOccupation] = useState("");
  const [newBiography, setNewBiography] = useState("");

  async function handleSync() {
    try {
      const result = await syncFromScreenplay();
      if (result.createdCount === 0 && result.totalExtracted === 0) {
        setNotification("No characters identified in the current screenplay.");
      } else if (result.createdCount === 0) {
        setNotification(
          `All ${result.totalExtracted} extracted characters already exist in this production.`
        );
      } else {
        setNotification(
          `Successfully imported ${result.createdCount} new character${
            result.createdCount === 1 ? "" : "s"
          } from the screenplay.`
        );
      }
    } catch {
      // Error state is handled within useCharacters
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    await createCharacter({
      name: newName.trim(),
      role: newRole,
      occupation: newOccupation.trim() || undefined,
      biography: newBiography.trim() || undefined,
      status: "draft",
      progress: 0,
    });

    setNewName("");
    setNewRole("supporting");
    setNewOccupation("");
    setNewBiography("");
    setIsCreateOpen(false);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Characters</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage your cast, character bibles, and visual continuity profiles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={syncing || loading}
            onClick={handleSync}
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-yellow-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {syncing ? "Syncing Cast..." : "Sync from Screenplay"}
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-400 disabled:opacity-50"
          >
            + Add Character
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {notification && (
        <div className="flex items-center justify-between rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-300">
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="ml-4 text-xs font-semibold uppercase text-zinc-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      <CharacterList characters={characters} loading={loading} />

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">Create Character</h2>
            <p className="mt-1 text-xs text-zinc-400">
              Add a new character profile to this production.
            </p>

            <form onSubmit={handleCreate} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Pastor David"
                  className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-yellow-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) =>
                      setNewRole(e.target.value as CharacterRole)
                    }
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none"
                  >
                    <option value="lead">Lead</option>
                    <option value="supporting">Supporting</option>
                    <option value="minor">Minor</option>
                    <option value="extra">Extra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={newOccupation}
                    onChange={(e) => setNewOccupation(e.target.value)}
                    placeholder="e.g. Teacher"
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-yellow-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Biography / Summary
                </label>
                <textarea
                  rows={3}
                  value={newBiography}
                  onChange={(e) => setNewBiography(e.target.value)}
                  placeholder="Brief summary of their story or purpose..."
                  className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-yellow-500 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !newName.trim()}
                  className="rounded-xl bg-yellow-500 px-5 py-2 text-sm font-semibold text-black hover:bg-yellow-400 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
