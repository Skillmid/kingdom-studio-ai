"use client";

import type { Location } from "../types/location";

interface LocationCardProps {
  location: Location;
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
}

function getStatusColor(status: Location["status"]) {
  switch (status) {
    case "completed":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "in-progress":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default:
      return "bg-zinc-700 text-zinc-300 border-zinc-600";
  }
}

function formatStatus(status: Location["status"]) {
  return status === "in-progress" ? "IN PROGRESS" : status.toUpperCase();
}

function formatSetting(setting: Location["setting"]) {
  return setting === "both" ? "INTERIOR / EXTERIOR" : setting.toUpperCase();
}

export default function LocationCard({ location, onEdit, onDelete }: LocationCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition hover:border-yellow-500">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500">
            {formatSetting(location.setting)}
          </p>
          <h3 className="mt-2 text-xl font-bold text-white">{location.name}</h3>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(location.status)}`}>
          {formatStatus(location.status)}
        </span>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-400">
        {location.description?.trim() || "No description yet."}
      </p>

      <div className="mt-6">
        <div className="mb-2 flex justify-between text-sm text-zinc-300">
          <span>Progress</span>
          <span>{location.progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full rounded-full bg-yellow-500 transition-all" style={{ width: `${location.progress}%` }} />
        </div>
      </div>

      {location.notes?.trim() && (
        <p className="mt-4 line-clamp-2 text-xs text-zinc-500">{location.notes}</p>
      )}

      <div className="mt-6 flex items-center justify-end gap-3">
        <button type="button" onClick={() => onDelete(location)} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-red-500/50 hover:text-red-400">
          Delete
        </button>
        <button type="button" onClick={() => onEdit(location)} className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90">
          Edit
        </button>
      </div>
    </div>
  );
}
