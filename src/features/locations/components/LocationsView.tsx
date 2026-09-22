"use client";

import { useMemo, useState } from "react";

import { useLocations } from "../hooks/use-locations";
import type { Location } from "../types/location";
import DeleteLocationDialog from "./DeleteLocationDialog";
import LocationFormDialog from "./LocationFormDialog";
import LocationList from "./LocationList";

interface LocationsViewProps {
  productionId: string;
}

type LocationFilter = "all" | "interior" | "exterior" | "both" | "in-progress" | "completed" | "draft";

export function LocationsView({ productionId }: LocationsViewProps) {
  const {
    locations,
    loading,
    saving,
    syncing,
    error,
    createLocation,
    updateLocation,
    deleteLocation,
    syncFromScreenplay,
  } = useLocations(productionId);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LocationFilter>("all");

  const stats = useMemo(() => ({
    total: locations.length,
    interiors: locations.filter((location) => location.setting === "interior").length,
    exteriors: locations.filter((location) => location.setting === "exterior").length,
    active: locations.filter((location) => location.status === "in-progress").length,
    completed: locations.filter((location) => location.status === "completed").length,
  }), [locations]);

  const filteredLocations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return locations.filter((location) => {
      const matchesSearch = !query || [location.name, location.description, location.notes]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
      const matchesFilter = filter === "all"
        || location.setting === filter
        || location.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [filter, locations, search]);

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

  async function handleSyncFromScreenplay() {
    try {
      const result = await syncFromScreenplay();
      if (result.totalExtracted === 0) {
        setNotification("No screenplay locations were found.");
      } else if (result.createdCount === 0) {
        setNotification(`Screenplay analysed: ${result.totalExtracted} location${result.totalExtracted === 1 ? "" : "s"} found. Location Bible is already up to date.`);
      } else {
        setNotification(`Added ${result.createdCount} new location${result.createdCount === 1 ? "" : "s"} from the screenplay.`);
      }
    } catch {
      // Hook exposes error state.
    }
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
    <div className="space-y-7 p-6 md:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-yellow-500">Pre-Production · Location Bible</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Locations</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">Build the physical world of the production. Define sets, environments, visual identity and continuity before the camera rolls.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleSyncFromScreenplay} disabled={syncing} className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm font-bold text-yellow-400 transition hover:bg-yellow-500/15 disabled:cursor-not-allowed disabled:opacity-50">
            {syncing ? "Analysing Screenplay..." : "Sync from Screenplay"}
          </button>
          <button type="button" onClick={openCreate} className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-400">Add Location</button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Total Locations", stats.total, "Production environments"],
          ["Interior", stats.interiors, "Interior sets"],
          ["Exterior", stats.exteriors, "Exterior environments"],
          ["In Progress", stats.active, "Being developed"],
          ["Completed", stats.completed, "Ready for production"],
        ].map(([label, value, hint]) => (
          <div key={String(label)} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">{label}</p>
            <p className="mt-2 text-2xl font-black text-white">{value}</p>
            <p className="mt-1 text-[11px] text-zinc-600">{hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Screenplay → Location Bible</p>
            <p className="mt-1 text-xs text-zinc-500">Scene headings become production environments. Existing locations remain untouched during sync.</p>
          </div>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row lg:max-w-xl">
            <div className="relative flex-1">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search locations, descriptions or notes..." className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-500/50" />
              {search && <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white">Clear</button>}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["all", "interior", "exterior", "both", "in-progress", "completed", "draft"] as LocationFilter[]).map((value) => (
            <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-[11px] font-bold transition ${filter === value ? "bg-yellow-500 text-black" : "bg-zinc-900 text-zinc-500 hover:text-white"}`}>
              {value === "all" ? "All" : value === "in-progress" ? "In Progress" : value === "both" ? "Interior + Exterior" : value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      {notification && <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300"><span>{notification}</span><button type="button" onClick={() => setNotification(null)} className="ml-4 text-zinc-500 hover:text-white">Dismiss</button></div>}

      {filteredLocations.length !== locations.length && (
        <p className="text-xs font-semibold text-zinc-600">Showing {filteredLocations.length} of {locations.length} locations</p>
      )}

      <LocationList locations={filteredLocations} loading={loading} onEdit={openEdit} onDelete={setLocationToDelete} />

      <LocationFormDialog
        open={formOpen}
        mode={formMode}
        productionId={productionId}
        location={selectedLocation}
        saving={saving}
        onClose={() => { setFormOpen(false); setSelectedLocation(null); }}
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
          setLocationToDelete(null);
          setNotification("Location deleted.");
        }}
      />
    </div>
  );
}
