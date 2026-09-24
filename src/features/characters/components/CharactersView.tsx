"use client";

import { useState } from "react";
import CharacterEditor from "./CharacterEditor";
import CharacterList from "./CharacterList";
import { useCharacters } from "../hooks/use-characters";
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
    aiSyncing,
    error,
    createCharacter,
    updateCharacter,
    syncCharacterWithAI,
    syncFromScreenplay,
  } = useCharacters(productionId);

  const [selectedCharacter, setSelectedCharacter] =
    useState<Character | null>(null);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<CharacterRole>("supporting");
  const [newOccupation, setNewOccupation] = useState("");
  const [newBiography, setNewBiography] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  async function handleSync() {
    try {
      const result = await syncFromScreenplay();

      if (result.totalExtracted === 0) {
        setNotification("No characters were detected in the screenplay.");
        return;
      }

      const parts = [
        `Found ${result.totalExtracted} character${result.totalExtracted === 1 ? "" : "s"}`,
      ];

      if (result.createdCount > 0) {
        parts.push(`added ${result.createdCount}`);
      }

      if (result.profiledCount > 0) {
        parts.push(`profiled ${result.profiledCount}`);
      }

      if (result.failedCount > 0) {
        const failedNames = result.failed.map((item) => item.name).join(", ");
        parts.push(`could not profile ${result.failedCount}${failedNames ? ` (${failedNames})` : ""}`);
      }

      setNotification(`${parts.join("; ")}.`);
    } catch {
      // The hook exposes the error state.
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newName.trim()) {
      return;
    }

    try {
      await createCharacter({
        name: newName.trim(),
        role: newRole,
        occupation: newOccupation.trim() || undefined,
        biography: newBiography.trim() || undefined,
        status: "draft",
      });

      setNewName("");
      setNewRole("supporting");
      setNewOccupation("");
      setNewBiography("");
      setShowCreateForm(false);
      setNotification("Character created successfully.");
    } catch {
      // The hook exposes the error state.
    }
  }

  async function handleUpdate(updates: Partial<Character>) {
    if (!selectedCharacter) {
      return;
    }

    const updated = await updateCharacter(selectedCharacter.id, updates);
    setSelectedCharacter(updated);
    setNotification("Character profile saved successfully.");
  }

  async function handleAISync(character: Character) {
    return syncCharacterWithAI(character);
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500">
            Pre-Production
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Characters</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Extract characters from the screenplay, then let AI draft a grounded
            profile for each person. Review one character with AI Sync Profile
            without resyncing the whole cast.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {syncing ? "Profiling from Screenplay..." : "Sync from Screenplay"}
          </button>

          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="rounded-xl bg-yellow-500 px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Add Character
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {notification && (
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="ml-4 text-zinc-500 transition hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      <CharacterList
        characters={characters}
        loading={loading}
        onOpen={setSelectedCharacter}
      />

      {showCreateForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
          <div className="mx-auto my-16 max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500">
                  New Character
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  Add Character
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-400 transition hover:text-white"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Name
                </label>
                <input
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="Character name"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Role
                </label>
                <select
                  value={newRole}
                  onChange={(event) =>
                    setNewRole(event.target.value as CharacterRole)
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-yellow-500"
                >
                  <option value="lead">Lead</option>
                  <option value="supporting">Supporting</option>
                  <option value="minor">Minor</option>
                  <option value="extra">Extra</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Occupation
                </label>
                <input
                  value={newOccupation}
                  onChange={(event) => setNewOccupation(event.target.value)}
                  placeholder="e.g. Teacher"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Biography
                </label>
                <textarea
                  value={newBiography}
                  onChange={(event) => setNewBiography(event.target.value)}
                  placeholder="Brief character description"
                  rows={4}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-500"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-800 pt-5">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold text-zinc-300 transition hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || !newName.trim()}
                  className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Character"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCharacter && (
        <CharacterEditor
          character={selectedCharacter}
          saving={saving}
          aiSyncing={aiSyncing}
          onSave={handleUpdate}
          onAISync={handleAISync}
          onCancel={() => setSelectedCharacter(null)}
        />
      )}
    </div>
  );
}
