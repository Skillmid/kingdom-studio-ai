"use client";

import type { Scene, SceneStatus } from "../types/scene";

interface SceneCardProps {
  scene: Scene;
  locationName?: string;
  characterNames?: ReadonlyMap<string, string>;
  onEdit: (scene: Scene) => void;
  onDelete: (scene: Scene) => void;
}

function getStatusColor(status: SceneStatus) {
  switch (status) {
    case "completed": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "in-progress": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    default: return "bg-zinc-800 text-zinc-400 border-zinc-700";
  }
}

function formatDuration(seconds?: number) {
  if (!seconds) return "—";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes ? `${minutes}m ${remaining}s` : `${remaining}s`;
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default function SceneCard({ scene, locationName, characterNames, onEdit, onDelete }: SceneCardProps) {
  const characters = scene.characterIds.map((id) => characterNames?.get(id)).filter(Boolean) as string[];
  const progress = Math.max(0, Math.min(100, scene.progress));

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/75 shadow-[0_10px_40px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-0.5 hover:border-yellow-500/35 hover:bg-zinc-900">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-500/70 to-transparent opacity-0 transition group-hover:opacity-100" />

      <div className="border-b border-zinc-800/80 bg-black/20 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500">Scene {scene.number}</span>
              <span className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">{scene.sceneType}</span>
              {scene.timeOfDay && <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-600">{scene.timeOfDay}</span>}
            </div>
            <h3 className="mt-2 line-clamp-2 text-lg font-black leading-tight text-white">{scene.heading}</h3>
          </div>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusColor(scene.status)}`}>
            {scene.status === "in-progress" ? "IN PROGRESS" : scene.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-600">Location</p>
            <p className="mt-1 truncate text-sm font-semibold text-zinc-300">{locationName || "Not assigned"}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-600">Est. Duration</p>
            <p className="mt-1 text-sm font-semibold text-zinc-300">{formatDuration(scene.estimatedDurationSeconds)}</p>
          </div>
        </div>

        {characters.length > 0 ? (
          <div>
            <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-600">Cast in Scene · {characters.length}</p>
            <div className="flex flex-wrap items-center gap-2">
              {characters.slice(0, 4).map((name) => (
                <span key={name} title={name} className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/60 py-1 pl-1 pr-2.5 text-[10px] font-semibold text-zinc-400">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500/10 text-[8px] font-black text-yellow-500">{initials(name)}</span>
                  {name}
                </span>
              ))}
              {characters.length > 4 && <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-[10px] font-bold text-zinc-500">+{characters.length - 4}</span>}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800 px-3 py-2.5 text-xs text-zinc-600">No cast linked to this scene yet.</div>
        )}

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3.5">
          <p className="mb-1 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-600">Scene Brief</p>
          <p className="line-clamp-3 text-sm leading-6 text-zinc-500">{scene.summary?.trim() || "This scene has not been developed yet."}</p>
        </div>

        <div>
          <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600"><span>Development</span><span className="text-zinc-300">{progress}%</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800"><div className="h-full rounded-full bg-yellow-500 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-zinc-800/80 pt-4">
          <span className="text-[10px] font-semibold text-zinc-600">Scene Planner</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onDelete(scene)} className="rounded-lg border border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-500 transition hover:border-red-500/30 hover:text-red-400">Delete</button>
            <button type="button" onClick={() => onEdit(scene)} className="rounded-lg bg-yellow-500 px-4 py-2 text-xs font-black text-black transition hover:bg-yellow-400">Open Scene</button>
          </div>
        </div>
      </div>
    </article>
  );
}
