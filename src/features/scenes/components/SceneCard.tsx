"use client";

import type { Scene, SceneStatus } from "../types/scene";

interface SceneCardProps {
  scene: Scene;
  onEdit: (scene: Scene) => void;
  onDelete: (scene: Scene) => void;
}

function getStatusColor(status: SceneStatus) {
  switch (status) {
    case "completed":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "in-progress":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default:
      return "bg-zinc-700 text-zinc-300 border-zinc-600";
  }
}

function formatStatus(status: SceneStatus) {
  if (status === "in-progress") {
    return "IN PROGRESS";
  }

  return status.toUpperCase();
}

export default function SceneCard({
  scene,
  onEdit,
  onDelete,
}: SceneCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition hover:border-yellow-500">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500">
            Scene {scene.number}
          </p>
          <h3 className="mt-2 text-xl font-bold text-white">{scene.heading}</h3>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(
            scene.status,
          )}`}
        >
          {formatStatus(scene.status)}
        </span>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-400">
        {scene.summary?.trim() || "No summary yet."}
      </p>

      <div className="mt-6">
        <div className="mb-2 flex justify-between text-sm text-zinc-300">
          <span>Progress</span>
          <span>{scene.progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-yellow-500 transition-all"
            style={{ width: `${scene.progress}%` }}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => onDelete(scene)}
          className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-red-500/50 hover:text-red-400"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={() => onEdit(scene)}
          className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
