"use client";

import { useMemo, useState } from "react";

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
  const {
    locations,
    loading: locationsLoading,
    error: locationsError,
  } = useLocations(productionId);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [sceneToDelete, setSceneToDelete] = useState<Scene | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const orderedScenes = useMemo(
    () => [...scenes].sort((a, b) => a.number - b.number),
    [scenes],
  );

  const nextNumber = useMemo(() => {
    if (orderedScenes.length === 0) return 1;
    return Math.max(...orderedScenes.map((scene) => scene.number)) + 1;
  }, [orderedScenes]);

  const locationNames = useMemo(
    () => new Map(locations.map((location) => [location.id, location.name])),
    [locations],
  );

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
        setNotification(
          `Screenplay analysed: ${result.totalExtracted} scene${result.totalExtracted === 1 ? "" : "s"} found. All are already in Scene Planner.` +
            (result.linkedLocationCount > 0
              ? ` ${result.linkedLocationCount} scene${result.linkedLocationCount === 1 ? "" : "s"} match existing locations.`
              : "")
        );
      } else {
        setNotification(
          `Added ${result.createdCount} new scene${result.createdCount === 1 ? "" : "s"} from the screenplay.` +
            (result.linkedLocationCount > 0
              ? ` Linked ${result.linkedLocationCount} scene${result.linkedLocationCount === 1 ? "" : "s"} to existing locations.`
              : "")
        );
      }
    } catch {
      // Hook exposes error state.
    }
  }

  async function handleSubmit(values: {
    productionId: string;
    number: number;
    heading: string;
    summary?: string;
    characterIds: string[];
    locationId?: string;
    status: Scene["status"];
    progress: number;
  }) {
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
      // Hook exposes error state.
    }
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500">
            Pre-Production
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Scenes</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Plan, organize, and manage every scene in this production. Scene
            records can be synced from the screenplay and refined manually.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleSyncFromScreenplay}
            disabled={syncing}
            className="rounded-xl border border-yellow-500/50 bg-yellow-500/10 px-4 py-3 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync from Screenplay"}
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-yellow-500 px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Add Scene
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-400">
        <span className="font-semibold text-white">Screenplay-driven workflow:</span>{" "}
        scene headings become editable Scene Planner records. Existing scenes are preserved and never overwritten by sync.
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {locationsError && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Locations could not be loaded. Scenes can still be managed without a location.
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

      <SceneList
        scenes={orderedScenes}
        loading={loading}
        onEdit={openEdit}
        onDelete={setSceneToDelete}
        locationNames={locationNames}
      />

      <SceneFormDialog
        open={formOpen}
        mode={formMode}
        productionId={productionId}
        nextNumber={nextNumber}
        scene={selectedScene}
        locations={locations}
        locationsLoading={locationsLoading}
        saving={saving}
        onClose={() => {
          setFormOpen(false);
          setSelectedScene(null);
        }}
        onSubmit={handleSubmit}
      />

      <DeleteSceneDialog
        scene={sceneToDelete}
        open={sceneToDelete !== null}
        loading={saving}
        onClose={() => setSceneToDelete(null)}
        onDelete={async () => {
          if (!sceneToDelete) return;
          await deleteScene(sceneToDelete.id);
          setNotification("Scene deleted.");
        }}
      />
    </div>
  );
}
