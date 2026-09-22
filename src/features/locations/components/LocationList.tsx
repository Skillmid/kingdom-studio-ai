"use client";

import type { Location } from "../types/location";
import LocationCard from "./LocationCard";

interface LocationListProps {
  locations: Location[];
  loading?: boolean;
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
}

export default function LocationList({ locations, loading = false, onEdit, onDelete }: LocationListProps) {
  if (loading) {
    return <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">Loading locations...</div>;
  }

  if (locations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900 p-10 text-center">
        <h3 className="text-xl font-semibold text-white">No Locations Yet</h3>
        <p className="mt-3 text-zinc-400">Create your first location to start building the production world.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {locations.map((location) => (
        <LocationCard key={location.id} location={location} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
