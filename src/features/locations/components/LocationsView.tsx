"use client";

import { useState } from "react";

import { useLocations } from "../hooks/use-locations";
import type { Location } from "../types/location";
import DeleteLocationDialog from "./DeleteLocationDialog";
import LocationFormDialog from "./LocationFormDialog";
import LocationList from "./LocationList";

interface LocationsViewProps {
  productionId: string;
}

export function LocationsView({ productionId }: LocationsViewProps) {
  const {
    locations,
    loading,
    saving,
    error,
    createLocation,
    updateLocation,
    deleteLocation,
  } = useLocations(productionId);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  function openCreate() {
    setFormMode("create");
    setSelectedLocation(null);
    setFormOpen(true);
  }

  function openEdit(location: Location) {
    setFormMode("edit");
    setSelectedLocation(location);
    setFormOpen(true);
  }

  async function handleSubmit(values: {
    productionId: string;
    name: string;
    description?: string;
    setting: Location["setting"];
    notes?: string;
    status: Location["status"];
    progress: number;
  }) {
    try {
      if (formMode === "edit" && selectedLocation) {
        await updateLocation(selectedLocation.id, values);
        setNotification("Location saved.");
      } else {
        await createLocation(values);
        setNotification("Location created.");
      }

      setFormOpen(false);
      setSelectedLocation(null);
    } catch {
      // Hook exposes error state.
    }
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500">
            Pre-Production
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Locations</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Build and manage the filming locations, sets, and environments that shape this production.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-yellow-500 px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
        >
          Add Location
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {notification && (
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="ml-4 text-zinc-500 transition hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      <LocationList
        locations={locations}
        loading={loading}
        onEdit={openEdit}
        onDelete={setLocationToDelete}
      />

      <LocationFormDialog
        open={formOpen}
        mode={formMode}
        productionId={productionId}
        location={selectedLocation}
        saving={saving}
        onClose={() => {
          setFormOpen(false);
          setSelectedLocation(null);
        }}
        onSubmit={handleSubmit}
      />

      <DeleteLocationDialog
        location={locationToDelete}
        open={locationToDelete !== null}
        loading={saving}
        onClose={() => setLocationToDelete(null)}
        onDelete={async () => {
          if (!locationToDelete) return;
          await deleteLocation(locationToDelete.id);
          setNotification("Location deleted.");
        }}
      />
    </div>
  );
}
