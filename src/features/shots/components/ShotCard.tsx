"use client";

import type { Shot, ShotStatus } from "../types/shot";

interface ShotCardProps {
  shot: Shot;
  sceneHeading?: string;
  locationName?: string;
  characterNames?: ReadonlyMap<string, string>;
  onEdit: (shot: Shot) => void;
  onDelete: (shot: Shot) => void;
}

function getStatusColor(status: ShotStatus) {
  switch (status) {
    case "completed":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "in-progress":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    default:
      return "bg-zinc-800 text-zinc-400 border-zinc-700";
  }
}

function formatDuration(seconds?: number) {
  if (!seconds) return "—";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes ? `${minutes}m ${remaining}s` : `${remaining}s`;
}

export default function ShotCard({
  shot,
  sceneHeading,
  locationName,
  characterNames,
  onEdit,
  onDelete,
}: ShotCardProps) {
  const characters = shot.characterIds.map((id) => characterNames?.get(id)).filter(Boolean) as string[];
  const progress = Math.max(0, Math.min(100, shot.progress));

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/75 transition duration-200 hover:-translate-y-0.5 hover:border-yellow-500/35">
      <div className="border-b border-zinc-800/80 bg-black/20 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500">
                Shot {shot.shotCode || shot.shotNumber}
              </span>
              <span className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                {shot.shotType.replace(/-/g, " ")}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-600">{shot.framing}</span>
            </div>
            <h3 className="mt-2 line-clamp-2 text-lg font-black leading-tight text-white">
              {shot.subject || shot.action || sceneHeading || "Untitled shot"}
            </h3>
          </div>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusColor(shot.status)}`}>
            {shot.status === "in-progress" ? "IN PROGRESS" : shot.status.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-600">Scene</p>
            <p className="mt-1 truncate text-sm font-semibold text-zinc-300">{sceneHeading || "Unassigned"}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-600">Duration</p>
            <p className="mt-1 text-sm font-semibold text-zinc-300">{formatDuration(shot.estimatedDurationSeconds)}</p>
          </div>
        </div>
        <p className="line-clamp-3 text-sm leading-6 text-zinc-400">
          {shot.action || shot.visualDescription || shot.dialogueReference || "No action recorded yet."}
        </p>
        <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
          {shot.cameraAngle && <span className="rounded-md border border-zinc-800 px-2 py-1">{shot.cameraAngle}</span>}
          {shot.cameraMovement && <span className="rounded-md border border-zinc-800 px-2 py-1">{shot.cameraMovement}</span>}
          {locationName && <span className="rounded-md border border-zinc-800 px-2 py-1">{locationName}</span>}
          {shot.userApproved && (
            <span className="rounded-md border border-yellow-500/30 px-2 py-1 text-yellow-500">Approved</span>
          )}
        </div>
        {characters.length > 0 && <p className="truncate text-xs text-zinc-500">Cast: {characters.join(", ")}</p>}
        <div>
          <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-zinc-600">
            <span>Coverage</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-yellow-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={() => onEdit(shot)} className="flex-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:border-yellow-500/50">
            Edit
          </button>
          <button type="button" onClick={() => onDelete(shot)} className="rounded-xl border border-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-500 transition hover:border-red-500/40 hover:text-red-400">
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
