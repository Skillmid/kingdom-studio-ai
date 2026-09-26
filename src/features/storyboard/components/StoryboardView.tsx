"use client";

import { useMemo, useState } from "react";

import { useCharacters } from "@/features/characters/hooks/use-characters";
import { useLocations } from "@/features/locations/hooks/use-locations";
import { useScenes } from "@/features/scenes/hooks/use-scenes";
import { useShots } from "@/features/shots/hooks/use-shots";

import { useStoryboard } from "../hooks/use-storyboard";
import type { StoryboardPanel } from "../types/storyboard-panel";
import DeletePanelDialog from "./DeletePanelDialog";
import PanelFormDialog from "./PanelFormDialog";
import PanelList from "./PanelList";

interface StoryboardViewProps {
  productionId: string;
}

export function StoryboardView({ productionId }: StoryboardViewProps) {
  const { panels, loading, saving, planning, error, createPanel, updatePanel, deletePanel, planFromShots } =
    useStoryboard(productionId);
  const { shots, error: shotsError } = useShots(productionId);
  const { scenes, error: scenesError } = useScenes(productionId);
  const { locations, error: locationsError } = useLocations(productionId);
  const { characters } = useCharacters(productionId);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedPanel, setSelectedPanel] = useState<StoryboardPanel | null>(null);
  const [panelToDelete, setPanelToDelete] = useState<StoryboardPanel | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "draft" | "in-progress" | "completed">("all");

  const orderedPanels = useMemo(
    () => [...panels].sort((a, b) => a.panelNumber - b.panelNumber),
    [panels],
  );
  const filteredPanels = useMemo(
    () => (filter === "all" ? orderedPanels : orderedPanels.filter((panel) => panel.status === filter)),
    [filter, orderedPanels],
  );
  const nextNumber = useMemo(
    () => (orderedPanels.length === 0 ? 1 : Math.max(...orderedPanels.map((panel) => panel.panelNumber)) + 1),
    [orderedPanels],
  );
  const sceneHeadings = useMemo(
    () => new Map(scenes.map((scene) => [scene.id, `${scene.number}. ${scene.heading}`])),
    [scenes],
  );
  const shotLabels = useMemo(
    () =>
      new Map(
        shots.map((shot) => [
          shot.id,
          `Shot ${shot.shotCode || shot.shotNumber}${shot.subject ? ` · ${shot.subject}` : ""}`,
        ]),
      ),
    [shots],
  );
  const locationNames = useMemo(() => new Map(locations.map((location) => [location.id, location.name])), [locations]);
  const characterNames = useMemo(
    () => new Map(characters.map((character) => [character.id, character.name])),
    [characters],
  );

  const stats = useMemo(
    () => ({
      total: panels.length,
      completed: panels.filter((panel) => panel.status === "completed").length,
      active: panels.filter((panel) => panel.status === "in-progress").length,
      approved: panels.filter((panel) => panel.userApproved).length,
    }),
    [panels],
  );

  function openCreate() {
    setFormMode("create");
    setSelectedPanel(null);
    setFormOpen(true);
  }

  function openEdit(panel: StoryboardPanel) {
    setFormMode("edit");
    setSelectedPanel(panel);
    setFormOpen(true);
  }

  async function handlePlanFromShots() {
    try {
      const result = await planFromShots();
      if (result.shotCount === 0) {
        setNotification("No shots found. Plan coverage in Shot List before generating panels.");
      } else if (result.createdCount === 0) {
        setNotification(
          `Analysed ${result.shotCount} shots. Existing panels were preserved and no new frames were needed.`,
        );
      } else {
        setNotification(
          `Added ${result.createdCount} panels from ${result.shotCount} shots. Preserved ${result.existingCount} existing panels.`,
        );
      }
    } catch {
      // Hook exposes the actionable error state.
    }
  }

  async function handleSubmit(values: Partial<StoryboardPanel>) {
    try {
      if (formMode === "edit" && selectedPanel) {
        await updatePanel(selectedPanel.id, { ...values, userApproved: values.userApproved ?? true });
        setNotification("Panel saved.");
      } else {
        await createPanel({ ...values, provenance: "user", userApproved: values.userApproved ?? true });
        setNotification("Panel created.");
      }
      setFormOpen(false);
      setSelectedPanel(null);
    } catch {
      // Hook exposes the actionable error state.
    }
  }

  return (
    <div className="space-y-7 p-6 md:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-yellow-500">Pre-Production · Storyboard</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Storyboard</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            Plan visual continuity from Shot List coverage plus persisted scene, character and location records.
            Approved frames are not overwritten on later planning runs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePlanFromShots}
            disabled={planning}
            className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm font-bold text-yellow-400 transition hover:bg-yellow-500/15 disabled:opacity-50"
          >
            {planning ? "Planning Panels..." : "Plan from Shots"}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-400"
          >
            Add Panel
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Panels", stats.total, "Frames in this production"],
          ["In Progress", stats.active, "Currently being developed"],
          ["Completed", stats.completed, "Production-ready panels"],
          ["Approved", stats.approved, "Protected from later planning"],
        ].map(([label, value, hint]) => (
          <div key={String(label)} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-white">{value}</p>
            <p className="mt-1 text-xs text-zinc-600">{hint}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Shots → Storyboard</p>
          <p className="mt-1 text-xs text-zinc-500">
            Planning adds missing frames and leaves filmmaker-approved panels intact. Stills attach later through
            generation jobs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "draft", "in-progress", "completed"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                filter === value ? "bg-yellow-500 text-black" : "bg-zinc-900 text-zinc-500 hover:text-white"
              }`}
            >
              {value === "all" ? "All" : value === "in-progress" ? "In Progress" : value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      {shotsError && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Shots could not be loaded. Panels can still be created manually.
        </div>
      )}
      {scenesError && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Scenes could not be loaded. Panels can still be managed without a scene link.
        </div>
      )}
      {locationsError && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Locations could not be loaded. Panels can still be managed without a location.
        </div>
      )}
      {notification && (
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
          <span>{notification}</span>
          <button type="button" onClick={() => setNotification(null)} className="ml-4 text-zinc-500 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      <PanelList
        panels={filteredPanels}
        loading={loading}
        onEdit={openEdit}
        onDelete={setPanelToDelete}
        sceneHeadings={sceneHeadings}
        shotLabels={shotLabels}
        locationNames={locationNames}
        characterNames={characterNames}
      />

      <PanelFormDialog
        open={formOpen}
        mode={formMode}
        productionId={productionId}
        nextNumber={nextNumber}
        panel={selectedPanel}
        scenes={scenes}
        shots={shots}
        locations={locations}
        characters={characters}
        saving={saving}
        onClose={() => {
          setFormOpen(false);
          setSelectedPanel(null);
        }}
        onSubmit={handleSubmit}
      />

      <DeletePanelDialog
        panel={panelToDelete}
        open={panelToDelete !== null}
        onClose={() => setPanelToDelete(null)}
        onDelete={async () => {
          if (!panelToDelete) return;
          await deletePanel(panelToDelete.id);
          setPanelToDelete(null);
          setNotification("Panel deleted.");
        }}
      />
    </div>
  );
}
