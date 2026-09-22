"use client";

import { useMemo, useState } from "react";

import { useCharacters } from "@/features/characters/hooks/use-characters";
import { useLocations } from "@/features/locations/hooks/use-locations";

import { useScenes } from "../hooks/use-scenes";
import type { Scene } from "../types/scene";
import DeleteSceneDialog from "./DeleteSceneDialog";
import SceneFormDialog from "./SceneFormDialog";
import SceneList from "./SceneList";

interface ScenesViewProps {
  productionId: string;
}

export function ScenesView({ productionId }: ScenesViewProps) {
  const {
    scenes,
    loading,
    saving,
    syncing,
    error,
    createScene,
    updateScene,
    deleteScene,
    syncFromScreenplay,
  } = useScenes(productionId);
  const { locations, loading: locationsLoading, error: locationsError } = useLocations(productionId);
  const { characters, loading: charactersLoading } = useCharacters(productionId);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [sceneToDelete, setSceneToDelete] = useState<Scene | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "draft" | "in-progress" | "completed">("all");

  const orderedScenes = useMemo(() => [...scenes].sort((a, b) => a.number - b.number), [scenes]);
  const filteredScenes = useMemo(
    () => filter === "all" ? orderedScenes : orderedScenes.filter((scene) => scene.status === filter),
    [filter, orderedScenes],
  );
  const nextNumber = useMemo(() => orderedScenes.length === 0 ? 1 : Math.max(...orderedScenes.map((scene) => scene.number)) + 1, [orderedScenes]);
  const locationNames = useMemo(() => new Map(locations.map((location) => [location.id, location.name])), [locations]);
  const characterNames = useMemo(() => new Map(characters.map((character) => [character.id, character.name])), [characters]);

  const stats = useMemo(() => ({
    total: scenes.length,
    completed: scenes.filter((scene) => scene.status === "completed").length,
    active: scenes.filter((scene) => scene.status === "in-progress").length,
    withCharacters: scenes.filter((scene) => scene.characterIds.length > 0).length,
  }), [scenes]);

  function openCreate() {
    setFormMode("create");
    setSelectedScene(null);
    setFormOpen(true);
  }

  function openEdit(scene: Scene) {
    setFormMode("edit");
    setSelectedScene(scene);
    setFormOpen(true);
  }

  async function handleSyncFromScreenplay() {
    try {
      const result = await syncFromScreenplay();
      if (result.totalExtracted === 0) {
        setNotification("No screenplay scene headings were found.");
      } else if (result.createdCount === 0) {
        setNotification(`Screenplay analysed: ${result.totalExtracted} scenes found. Scene Planner is already up to date.`);
      } else {
        setNotification(`Added ${result.createdCount} scenes. Linked ${result.linkedLocationCount} locations and ${result.linkedCharacterCount} character appearances.`);
      }
    } catch {
      // Hook exposes the actionable error state.
    }
  }

  async function handleSubmit(values: Parameters<typeof createScene>[0]) {
    try {
      if (formMode === "edit" && selectedScene) {
        await updateScene(selectedScene.id, values);
        setNotification("Scene saved.");
      } else {
        await createScene(values);
        setNotification("Scene created.");
      }
      setFormOpen(false);
      setSelectedScene(null);
    } catch {
      // Hook exposes the actionable error state.
    }
  }

  return (
    <div className="space-y-7 p-6 md:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-yellow-500">Pre-Production · Scene Planner</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Scenes</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">Turn screenplay scenes into production-ready creative records with story beats, performance direction, continuity, visual planning and AI-ready scene intelligence.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleSyncFromScreenplay} disabled={syncing} className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm font-bold text-yellow-400 transition hover:bg-yellow-500/15 disabled:opacity-50">{syncing ? "Analysing Screenplay..." : "Sync from Screenplay"}</button>
          <button type="button" onClick={openCreate} className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-400">Add Scene</button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Scenes", stats.total, "Scenes in this production"],
          ["In Progress", stats.active, "Currently being developed"],
          ["Completed", stats.completed, "Production-ready scenes"],
          ["Character Linked", stats.withCharacters, "Scenes with cast mapping"],
        ].map(([label, value, hint]) => (
          <div key={String(label)} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-white">{value}</p>
            <p className="mt-1 text-xs text-zinc-600">{hint}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Screenplay → Scene Bible</p>
          <p className="mt-1 text-xs text-zinc-500">Sync preserves the original source while enriching scene records for production.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "draft", "in-progress", "completed"] as const).map((value) => (
            <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${filter === value ? "bg-yellow-500 text-black" : "bg-zinc-900 text-zinc-500 hover:text-white"}`}>{value === "all" ? "All" : value === "in-progress" ? "In Progress" : value[0].toUpperCase() + value.slice(1)}</button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      {locationsError && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">Locations could not be loaded. Scenes can still be managed without a location.</div>}
      {notification && <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300"><span>{notification}</span><button type="button" onClick={() => setNotification(null)} className="ml-4 text-zinc-500 hover:text-white">Dismiss</button></div>}

      <SceneList
        scenes={filteredScenes}
        loading={loading}
        onEdit={openEdit}
        onDelete={setSceneToDelete}
        locationNames={locationNames}
        characterNames={characterNames}
      />

      <SceneFormDialog
        open={formOpen}
        mode={formMode}
        productionId={productionId}
        nextNumber={nextNumber}
        scene={selectedScene}
        locations={locations}
        characters={characters}
        locationsLoading={locationsLoading}
        charactersLoading={charactersLoading}
        saving={saving}
        onClose={() => { setFormOpen(false); setSelectedScene(null); }}
        onSubmit={handleSubmit}
      />

      <DeleteSceneDialog
        scene={sceneToDelete}
        open={sceneToDelete !== null}
        loading={saving}
        onClose={() => setSceneToDelete(null)}
        onDelete={async () => { if (!sceneToDelete) return; await deleteScene(sceneToDelete.id); setSceneToDelete(null); setNotification("Scene deleted."); }}
      />
    </div>
  );
}
