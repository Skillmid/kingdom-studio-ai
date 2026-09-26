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
  const {
    shots,
    loading,
    saving,
    planning,
    error,
    createShot,
    updateShot,
    deleteShot,
    planFromScenes,
  } = useShots(productionId);
  const { scenes, loading: scenesLoading } = useScenes(productionId);
  const { locations } = useLocations(productionId);
  const { characters } = useCharacters(productionId);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);
  const [shotToDelete, setShotToDelete] = useState<Shot | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "draft" | "in-progress" | "completed" | "unapproved">("all");

  const orderedShots = useMemo(
    () =>
      [...shots].sort((a, b) => {
        const sceneDelta =
          (scenes.find((scene) => scene.id === a.sceneId)?.number ?? Number.MAX_SAFE_INTEGER) -
          (scenes.find((scene) => scene.id === b.sceneId)?.number ?? Number.MAX_SAFE_INTEGER);
        return sceneDelta || a.shotNumber - b.shotNumber;
      }),
    [scenes, shots],
  );

  const filteredShots = useMemo(() => {
    if (filter === "unapproved") return orderedShots.filter((shot) => !shot.userApproved);
    if (filter === "all") return orderedShots;
    return orderedShots.filter((shot) => shot.status === filter);
  }, [filter, orderedShots]);

  const sceneHeadings = useMemo(
    () => new Map(scenes.map((scene) => [scene.id, `Scene ${scene.number}: ${scene.heading}`])),
    [scenes],
  );
  const locationNames = useMemo(
    () => new Map(locations.map((location) => [location.id, location.name])),
    [locations],
  );
  const characterNames = useMemo(
    () => new Map(characters.map((character) => [character.id, character.name])),
    [characters],
  );

  const nextNumber = shots.length === 0 ? 1 : Math.max(...shots.map((shot) => shot.shotNumber)) + 1;

  const stats = useMemo(
    () => ({
      total: shots.length,
      approved: shots.filter((shot) => shot.userApproved).length,
      completed: shots.filter((shot) => shot.status === "completed").length,
      scenesCovered: new Set(shots.map((shot) => shot.sceneId).filter(Boolean)).size,
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
        setNotification("No Scene Planner records were found. Sync scenes from the screenplay first.");
      } else if (result.createdCount === 0) {
        setNotification(`Coverage is already planned for ${result.sceneCount} scenes. Approved and existing shots were preserved.`);
      } else {
        setNotification(`Added ${result.createdCount} scene-derived shots from ${result.sceneCount} scenes. Existing approved shots were preserved.`);
      }
    } catch {
      // Hook exposes the actionable error state.
    }
  }

  async function handleSubmit(values: Partial<Shot>) {
    try {
      if (formMode === "edit" && selectedShot) {
        await updateShot(selectedShot.id, values);
        setNotification("Shot saved.");
      } else {
        await createShot(values);
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
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Shot List</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            Plan camera coverage from Scene Planner records. Scene-derived proposals stay grounded in heading, action, and dialogue evidence. Filmmaker-approved shots are not overwritten.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePlanFromScenes}
            disabled={planning || scenesLoading}
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
          ["Total Shots", stats.total, "Coverage records in this production"],
          ["Scenes Covered", stats.scenesCovered, "Scenes with at least one shot"],
          ["Approved", stats.approved, "Filmmaker-confirmed shots"],
          ["Completed", stats.completed, "Production-ready coverage"],
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
          <p className="text-sm font-semibold text-white">Scenes → Shot coverage</p>
          <p className="mt-1 text-xs text-zinc-500">Planning adds missing coverage only. User-created and approved shots stay in place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "draft", "in-progress", "completed", "unapproved"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                filter === value ? "bg-yellow-500 text-black" : "bg-zinc-900 text-zinc-500 hover:text-white"
              }`}
            >
              {value === "all" ? "All" : value === "in-progress" ? "In Progress" : value === "unapproved" ? "Unapproved" : value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
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
