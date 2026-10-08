"use client";

import { useMemo, useState } from "react";

import { useCharacters } from "@/features/characters/hooks/use-characters";
import { useLocations } from "@/features/locations/hooks/use-locations";
import { useScenes } from "@/features/scenes/hooks/use-scenes";

import { useShots } from "../hooks/use-shots";
import type { Shot } from "../types/shot";
import DeleteShotDialog from "./DeleteShotDialog";
import ShotFormDialog from "./ShotFormDialog";
import ShotList from "./ShotList";

interface ShotListViewProps {
  productionId: string;
}

export function ShotListView({ productionId }: ShotListViewProps) {
  const { shots, loading, saving, planning, error, createShot, updateShot, deleteShot, planFromScenes } =
    useShots(productionId);
  const { scenes, error: scenesError } = useScenes(productionId);
  const { locations, error: locationsError } = useLocations(productionId);
  const { characters } = useCharacters(productionId);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);
  const [shotToDelete, setShotToDelete] = useState<Shot | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "draft" | "in-progress" | "completed">("all");

  const orderedShots = useMemo(() => [...shots].sort((a, b) => a.shotNumber - b.shotNumber), [shots]);
  const filteredShots = useMemo(
    () => (filter === "all" ? orderedShots : orderedShots.filter((shot) => shot.status === filter)),
    [filter, orderedShots],
  );
  const nextNumber = useMemo(
    () => (orderedShots.length === 0 ? 1 : Math.max(...orderedShots.map((shot) => shot.shotNumber)) + 1),
    [orderedShots],
  );
  const sceneHeadings = useMemo(
    () => new Map(scenes.map((scene) => [scene.id, `${scene.number}. ${scene.heading}`])),
    [scenes],
  );
  const locationNames = useMemo(() => new Map(locations.map((location) => [location.id, location.name])), [locations]);
  const characterNames = useMemo(() => new Map(characters.map((character) => [character.id, character.name])), [characters]);

  const stats = useMemo(
    () => ({
      total: shots.length,
      completed: shots.filter((shot) => shot.status === "completed").length,
      active: shots.filter((shot) => shot.status === "in-progress").length,
      approved: shots.filter((shot) => shot.userApproved).length,
    }),
    [shots],
  );

  function openCreate() {
    setFormMode("create");
    setSelectedShot(null);
    setFormOpen(true);
  }

  function openEdit(shot: Shot) {
    setFormMode("edit");
    setSelectedShot(shot);
    setFormOpen(true);
  }

  async function handlePlanFromScenes() {
    try {
      const result = await planFromScenes();
      if (result.sceneCount === 0) {
        setNotification("No scenes found. Sync scenes from the screenplay before planning coverage.");
      } else if (result.createdCount === 0) {
        setNotification(
          `Analysed ${result.sceneCount} scenes and ${result.proposedCount} proposed shots. Existing approved coverage was preserved.`,
        );
      } else {
        setNotification(
          `Added ${result.createdCount} shots from ${result.sceneCount} scenes. Preserved ${result.preservedCount} filmmaker-owned shots.`,
        );
      }
    } catch {
      // Hook exposes the actionable error state.
    }
  }

  async function handleSubmit(values: Parameters<typeof createShot>[0]) {
    try {
      if (formMode === "edit" && selectedShot) {
        await updateShot(selectedShot.id, { ...values, userApproved: values.userApproved ?? true });
        setNotification("Shot saved.");
      } else {
        await createShot({ ...values, provenance: "user", userApproved: values.userApproved ?? true });
        setNotification("Shot created.");
      }
      setFormOpen(false);
      setSelectedShot(null);
    } catch {
      // Hook exposes the actionable error state.
    }
  }

  return (
    <div className="space-y-7 p-6 md:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-yellow-500">Pre-Production · Shot List</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Shots</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            Plan camera coverage from Scene Planner records. Scene-derived proposals stay grounded in heading, action and
            dialogue. Approved shots are not overwritten on later planning runs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePlanFromScenes}
            disabled={planning}
            className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm font-bold text-yellow-400 transition hover:bg-yellow-500/15 disabled:opacity-50"
          >
            {planning ? "Planning Coverage..." : "Plan from Scenes"}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-400"
          >
            Add Shot
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Shots", stats.total, "Coverage in this production"],
          ["In Progress", stats.active, "Currently being developed"],
          ["Completed", stats.completed, "Production-ready shots"],
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
          <p className="text-sm font-semibold text-white">Scenes → Shot List</p>
          <p className="mt-1 text-xs text-zinc-500">Planning adds missing coverage and leaves filmmaker-approved shots intact.</p>
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
      {scenesError && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Scenes could not be loaded. Shots can still be created manually.
        </div>
      )}
      {locationsError && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Locations could not be loaded. Shots can still be managed without a location.
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

      <ShotList
        shots={filteredShots}
        loading={loading}
        onEdit={openEdit}
        onDelete={setShotToDelete}
        sceneHeadings={sceneHeadings}
        locationNames={locationNames}
        characterNames={characterNames}
      />

      <ShotFormDialog
        open={formOpen}
        mode={formMode}
        productionId={productionId}
        nextNumber={nextNumber}
        shot={selectedShot}
        scenes={scenes}
        locations={locations}
        characters={characters}
        saving={saving}
        onClose={() => {
          setFormOpen(false);
          setSelectedShot(null);
        }}
        onSubmit={handleSubmit}
      />

      <DeleteShotDialog
        shot={shotToDelete}
        open={shotToDelete !== null}
        loading={saving}
        onClose={() => setShotToDelete(null)}
        onDelete={async () => {
          if (!shotToDelete) return;
          await deleteShot(shotToDelete.id);
          setShotToDelete(null);
          setNotification("Shot deleted.");
        }}
      />
    </div>
  );
}
