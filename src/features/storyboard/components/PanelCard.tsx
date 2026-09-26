"use client";

import type { StoryboardPanel, StoryboardStatus } from "../types/storyboard-panel";

interface PanelCardProps {
  panel: StoryboardPanel;
  sceneHeading?: string;
  shotLabel?: string;
  locationName?: string;
  characterNames?: ReadonlyMap<string, string>;
  onEdit: (panel: StoryboardPanel) => void;
  onDelete: (panel: StoryboardPanel) => void;
}

function getStatusColor(status: StoryboardStatus) {
  switch (status) {
    case "completed":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "in-progress":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    default:
      return "bg-zinc-800 text-zinc-400 border-zinc-700";
  }
}

export default function PanelCard({
  panel,
  sceneHeading,
  shotLabel,
  locationName,
  characterNames,
  onEdit,
  onDelete,
}: PanelCardProps) {
  const characters = panel.characterIds.map((id) => characterNames?.get(id)).filter(Boolean) as string[];
  const progress = Math.max(0, Math.min(100, panel.progress));

  return (
    <article className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/75 transition duration-200 hover:-translate-y-0.5 hover:border-yellow-500/35">
      <div className="relative aspect-[16/9] border-b border-zinc-800 bg-zinc-950">
        {panel.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={panel.imageUrl} alt={panel.title || `Panel ${panel.panelNumber}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-600">No still yet</p>
            <p className="max-w-xs text-xs leading-5 text-zinc-500">
              Generation jobs will attach an image later. This panel keeps the composition and continuity notes.
            </p>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-md bg-black/70 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-yellow-400">
          Panel {panel.panelNumber}
        </span>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-lg font-black leading-tight text-white">
              {panel.title || panel.visualDescription || shotLabel || "Untitled panel"}
            </h3>
            <p className="mt-1 truncate text-xs uppercase tracking-wide text-zinc-500">
              {panel.composition || shotLabel || "Composition not set"}
            </p>
          </div>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusColor(panel.status)}`}>
            {panel.status === "in-progress" ? "IN PROGRESS" : panel.status.toUpperCase()}
          </span>
        </div>
        <p className="line-clamp-3 text-sm leading-6 text-zinc-400">
          {panel.visualDescription || panel.generationPrompt || "No visual description recorded yet."}
        </p>
        <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
          {sceneHeading && <span className="rounded-md border border-zinc-800 px-2 py-1">{sceneHeading}</span>}
          {locationName && <span className="rounded-md border border-zinc-800 px-2 py-1">{locationName}</span>}
          {panel.userApproved && (
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
          <button
            type="button"
            onClick={() => onEdit(panel)}
            className="flex-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:border-yellow-500/50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(panel)}
            className="rounded-xl border border-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-500 transition hover:border-red-500/40 hover:text-red-400"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
