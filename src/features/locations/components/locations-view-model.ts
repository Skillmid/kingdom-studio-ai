import type { Location } from "../types/location";

export type LocationFilter =
  | "all"
  | Location["setting"]
  | Location["status"];

export function filterLocations(
  locations: Location[],
  search: string,
  filter: LocationFilter
): Location[] {
  const query = search.trim().toLowerCase();

  return locations.filter((location) => {
    const matchesSearch = !query || [
      location.name,
      location.description,
      location.notes,
    ]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(query));
    const matchesFilter = filter === "all"
      || location.setting === filter
      || location.status === filter;

    return matchesSearch && matchesFilter;
  });
}