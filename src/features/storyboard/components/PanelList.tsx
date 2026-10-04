"use client";

import type { StoryboardPanel } from "../types/storyboard-panel";
import PanelCard from "./PanelCard";

interface PanelListProps {
  panels: StoryboardPanel[];
  loading?: boolean;
  onEdit: (panel: StoryboardPanel) => void;
  onDelete: (panel: StoryboardPanel) => void;
  onToggleApproval?: (panel: StoryboardPanel) => void;
  onMoveUp?: (panel: StoryboardPanel) => void;
  onMoveDown?: (panel: StoryboardPanel) => void;
  onCreate?: () => void;
  onPlanFromShots?: () => void;
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
  onToggleApproval,
  onMoveUp,
  onMoveDown,
  onCreate,
  onPlanFromShots,
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
        {(onCreate || onPlanFromShots) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {onCreate && (
              <button
                type="button"
                onClick={onCreate}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
              >
                + Add First Panel
              </button>
            )}
            {onPlanFromShots && (
              <button
                type="button"
                onClick={onPlanFromShots}
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
              >
                Plan from Shots
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {panels.map((panel, index) => (
        <PanelCard
          key={panel.id}
          panel={panel}
          canMoveUp={index > 0}
          canMoveDown={index < panels.length - 1}
          sceneHeading={panel.sceneId ? sceneHeadings?.get(panel.sceneId) : undefined}
          shotLabel={panel.shotId ? shotLabels?.get(panel.shotId) : undefined}
          locationName={panel.locationId ? locationNames?.get(panel.locationId) : undefined}
          characterNames={characterNames}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleApproval={onToggleApproval}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
      ))}
    </div>
  );
}
