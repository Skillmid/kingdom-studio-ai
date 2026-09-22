"use client";

import type { Scene } from "../types/scene";
import SceneCard from "./SceneCard";

interface SceneListProps {
  scenes: Scene[];
  loading?: boolean;
  onEdit: (scene: Scene) => void;
  onDelete: (scene: Scene) => void;
  locationNames?: ReadonlyMap<string, string>;
}

export default function SceneList({
  scenes,
  loading = false,
  onEdit,
  onDelete,
  locationNames,
}: SceneListProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
        Loading scenes...
      </div>
    );
  }

  if (scenes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900 p-10 text-center">
        <h3 className="text-xl font-semibold text-white">No Scenes Yet</h3>
        <p className="mt-3 text-zinc-400">
          Create your first scene to start planning this production.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {scenes.map((scene) => (
        <SceneCard
          key={scene.id}
          scene={scene}
          locationName={scene.locationId ? locationNames?.get(scene.locationId) : undefined}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
