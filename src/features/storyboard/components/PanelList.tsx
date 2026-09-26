"use client";

import type { StoryboardPanel } from "../types/storyboard-panel";
import PanelCard from "./PanelCard";

interface PanelListProps {
  panels: StoryboardPanel[];
  loading?: boolean;
  onEdit: (panel: StoryboardPanel) => void;
  onDelete: (panel: StoryboardPanel) => void;
  sceneHeadings?: ReadonlyMap<string, string>;
  shotLabels?: ReadonlyMap<string, string>;
  locationNames?: ReadonlyMap<string, string>;
  characterNames?: ReadonlyMap<string, string>;
}

export default function PanelList({
  panels,
  loading = false,
  onEdit,
  onDelete,
  sceneHeadings,
  shotLabels,
  locationNames,
  characterNames,
}: PanelListProps) {
  if (loading) {
    return (
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="h-96 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60" />
        ))}
      </div>
    );
  }

  if (panels.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-12 text-center">
        <h3 className="text-xl font-bold text-white">No Panels Match This View</h3>
        <p className="mt-2 text-sm text-zinc-500">Create a panel or generate frames from the Shot List.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {panels.map((panel) => (
        <PanelCard
          key={panel.id}
          panel={panel}
          sceneHeading={panel.sceneId ? sceneHeadings?.get(panel.sceneId) : undefined}
          shotLabel={panel.shotId ? shotLabels?.get(panel.shotId) : undefined}
          locationName={panel.locationId ? locationNames?.get(panel.locationId) : undefined}
          characterNames={characterNames}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
