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
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-400";
    case "in-progress":
      return "border-yellow-500/25 bg-yellow-500/10 text-yellow-400";
    default:
      return "border-zinc-700 bg-zinc-800/80 text-zinc-400";
  }
}

function formatStatus(status: Location["status"]) {
  return status === "in-progress" ? "IN PROGRESS" : status.toUpperCase();
}

function formatSetting(setting: Location["setting"]) {
  return setting === "both" ? "INTERIOR / EXTERIOR" : setting.toUpperCase();
}

function settingIcon(setting: Location["setting"]) {
  if (setting === "interior") return "⌂";
  if (setting === "exterior") return "◌";
  return "◈";
}

export default function LocationCard({ location, onEdit, onDelete }: LocationCardProps) {
  const progress = Math.max(0, Math.min(100, location.progress));

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/75 shadow-[0_10px_40px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-0.5 hover:border-yellow-500/35 hover:bg-zinc-900">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-500/70 to-transparent opacity-0 transition group-hover:opacity-100" />

      <div className="border-b border-zinc-800/80 bg-black/20 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-yellow-500/20 bg-yellow-500/10 text-sm">
                {settingIcon(location.setting)}
              </span>
              <span className="truncate">{formatSetting(location.setting)}</span>
            </div>
            <h3 className="mt-3 line-clamp-2 text-xl font-black leading-tight text-white">{location.name}</h3>
          </div>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusColor(location.status)}`}>
            {formatStatus(location.status)}
          </span>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-zinc-400">
          {location.description?.trim() || "No location description yet. Open the Location Bible to define the visual identity, environment and production requirements."}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600">Development</p>
            <p className="mt-1 text-sm font-bold text-zinc-200">{progress}%</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600">Status</p>
            <p className="mt-1 truncate text-sm font-bold text-zinc-200">{formatStatus(location.status)}</p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
            <span>Location Bible</span>
            <span className="text-zinc-300">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-yellow-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {location.notes?.trim() && (
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-3.5 py-3">
            <p className="mb-1 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-600">Production Notes</p>
            <p className="line-clamp-2 text-xs leading-5 text-zinc-500">{location.notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-zinc-800/80 pt-4">
          <span className="text-[10px] font-semibold text-zinc-600">Location Bible</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onDelete(location)} className="rounded-lg border border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-500 transition hover:border-red-500/30 hover:text-red-400">
              Delete
            </button>
            <button type="button" onClick={() => onEdit(location)} className="rounded-lg bg-yellow-500 px-4 py-2 text-xs font-black text-black transition hover:bg-yellow-400">
              Open Bible
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
