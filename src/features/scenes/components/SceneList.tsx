"use client";

import type { Scene } from "../types/scene";
import SceneCard from "./SceneCard";

interface SceneListProps {
  scenes: Scene[];
  loading?: boolean;
  onEdit: (scene: Scene) => void;
  onDelete: (scene: Scene) => void;
  onCreate?: () => void;
  onSync?: () => void;
  syncing?: boolean;
  locationNames?: ReadonlyMap<string, string>;
  characterNames?: ReadonlyMap<string, string>;
}

export default function SceneList({
  scenes,
  loading = false,
  onEdit,
  onDelete,
  onCreate,
  onSync,
  syncing = false,
  locationNames,
  characterNames,
}: SceneListProps) {
  if (loading) {
    return (
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="h-80 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60" />
        ))}
      </div>
    );
  }

  if (scenes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-12 text-center">
        <h3 className="text-xl font-bold text-white">No Scenes Match This View</h3>
        <p className="mt-2 text-sm text-zinc-500">Create a scene or sync the screenplay to populate the Scene Planner.</p>
        {(onCreate || onSync) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {onCreate && (
              <button
                type="button"
                onClick={onCreate}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
              >
                + Add First Scene
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
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {scenes.map((scene) => (
        <SceneCard
          key={scene.id}
          scene={scene}
          locationName={scene.locationId ? locationNames?.get(scene.locationId) : undefined}
          characterNames={characterNames}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
