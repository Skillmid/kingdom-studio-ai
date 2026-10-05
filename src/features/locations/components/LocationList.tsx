"use client";

import type { Location } from "../types/location";
import LocationCard from "./LocationCard";

interface LocationListProps {
  locations: Location[];
  loading?: boolean;
  onOpen: (location: Location) => void;
  onDelete: (location: Location) => void;
  onCreate?: () => void;
  onSync?: () => void;
  syncing?: boolean;
}

export default function LocationList({
  locations,
  loading = false,
  onOpen,
  onDelete,
  onCreate,
  onSync,
  syncing = false,
}: LocationListProps) {
  if (loading) {
    return <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">Loading locations...</div>;
  }

  if (locations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900 p-10 text-center">
        <h3 className="text-xl font-semibold text-white">No Locations Yet</h3>
        <p className="mt-3 text-zinc-400">Create your first location to start building the production world.</p>
        {(onCreate || onSync) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {onCreate && (
              <button
                type="button"
                onClick={onCreate}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
              >
                + Add First Location
              </button>
            )}
            {onSync && (
              <button
                type="button"
                onClick={onSync}
                disabled={syncing}
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
              >
                {syncing ? "Syncing Screenplay..." : "Sync from Screenplay"}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {locations.map((location) => (
        <LocationCard key={location.id} location={location} onOpen={onOpen} onDelete={onDelete} />
      ))}
    </div>
  );
}
