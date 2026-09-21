"use client";

import { useMemo, useState } from "react";

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
    error,
    createScene,
    updateScene,
    deleteScene,
  } = useScenes(productionId);

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
    if (orderedScenes.length === 0) {
      return 1;
    }

    return Math.max(...orderedScenes.map((scene) => scene.number)) + 1;
  }, [orderedScenes]);

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

  async function handleSubmit(values: {
    productionId: string;
    number: number;
    heading: string;
    summary?: string;
    characterIds: string[];
    status: Scene["status"];
    progress: number;
  }) {
    try {
      if (formMode === "edit" && selectedScene) {
        await updateScene(selectedScene.id, {
          productionId: values.productionId,
          number: values.number,
          heading: values.heading,
          summary: values.summary,
          characterIds: values.characterIds,
          locationId: selectedScene.locationId,
          status: values.status,
          progress: values.progress,
        });
        setNotification("Scene saved.");
      } else {
        await createScene({
          productionId: values.productionId,
          number: values.number,
          heading: values.heading,
          summary: values.summary,
          characterIds: values.characterIds,
          status: values.status,
          progress: values.progress,
        });
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
            records belong to the production and persist across reloads.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-yellow-500 px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
        >
          Add Scene
        </button>
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

      <SceneList
        scenes={orderedScenes}
        loading={loading}
        onEdit={openEdit}
        onDelete={setSceneToDelete}
      />

      <SceneFormDialog
        open={formOpen}
        mode={formMode}
        productionId={productionId}
        nextNumber={nextNumber}
        scene={selectedScene}
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
          if (!sceneToDelete) {
            return;
          }

          await deleteScene(sceneToDelete.id);
          setNotification("Scene deleted.");
        }}
      />
    </div>
  );
}
