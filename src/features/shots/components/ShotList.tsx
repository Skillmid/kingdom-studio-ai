"use client";

import type { Shot } from "../types/shot";
import ShotCard from "./ShotCard";

interface ShotListProps {
  shots: Shot[];
  loading?: boolean;
  onEdit: (shot: Shot) => void;
  onDelete: (shot: Shot) => void;
  onCreate?: () => void;
  onPlanFromScenes?: () => void;
  planning?: boolean;
  sceneHeadings?: ReadonlyMap<string, string>;
  locationNames?: ReadonlyMap<string, string>;
  characterNames?: ReadonlyMap<string, string>;
}

export default function ShotList({
  shots,
  loading = false,
  onEdit,
  onDelete,
  onCreate,
  onPlanFromScenes,
  planning = false,
  sceneHeadings,
  locationNames,
  characterNames,
}: ShotListProps) {
  if (loading) {
    return (
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="h-80 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60" />
        ))}
      </div>
    );
  }

  if (shots.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-12 text-center">
        <h3 className="text-xl font-bold text-white">No Shots Match This View</h3>
        <p className="mt-2 text-sm text-zinc-500">Create a shot or generate coverage from the Scene Planner.</p>
        {(onCreate || onPlanFromScenes) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {onCreate && (
              <button
                type="button"
                onClick={onCreate}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
              >
                + Add First Shot
              </button>
            )}
            {onPlanFromScenes && (
              <button
                type="button"
                onClick={onPlanFromScenes}
                disabled={planning}
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
              >
                {planning ? "Planning Coverage..." : "Plan from Scenes"}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {shots.map((shot) => (
        <ShotCard
          key={shot.id}
          shot={shot}
          sceneHeading={shot.sceneId ? sceneHeadings?.get(shot.sceneId) : undefined}
          locationName={shot.locationId ? locationNames?.get(shot.locationId) : undefined}
          characterNames={characterNames}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
