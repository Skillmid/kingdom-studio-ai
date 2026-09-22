"use client";

import type { Scene } from "../types/scene";
import SceneCard from "./SceneCard";

interface SceneListProps {
  scenes: Scene[];
  loading?: boolean;
  onEdit: (scene: Scene) => void;
  onDelete: (scene: Scene) => void;
  locationNames?: ReadonlyMap<string, string>;
  characterNames?: ReadonlyMap<string, string>;
}

export default function SceneList({ scenes, loading = false, onEdit, onDelete, locationNames, characterNames }: SceneListProps) {
  if (loading) {
    return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-80 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60" />)}</div>;
  }

  if (scenes.length === 0) {
    return <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-12 text-center"><h3 className="text-xl font-bold text-white">No Scenes Match This View</h3><p className="mt-2 text-sm text-zinc-500">Create a scene or sync the screenplay to populate the Scene Planner.</p></div>;
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {scenes.map((scene) => <SceneCard key={scene.id} scene={scene} locationName={scene.locationId ? locationNames?.get(scene.locationId) : undefined} characterNames={characterNames} onEdit={onEdit} onDelete={onDelete} />)}
    </div>
  );
}
