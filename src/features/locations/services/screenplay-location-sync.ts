import type { LocationExtraction } from "@/features/import-engine/extractors/location.extractor";
import type { CreateLocationInput, Location } from "../types/location";

export function planScreenplayLocationCreates(
  productionId: string,
  extracted: LocationExtraction[],
  existingLocations: Location[],
): CreateLocationInput[] {
  const knownNames = new Set(
    existingLocations.map((location) => location.name.trim().toLowerCase()),
  );
  const planned: CreateLocationInput[] = [];

  for (const location of extracted) {
    const nameKey = location.name.trim().toLowerCase();
    if (knownNames.has(nameKey)) continue;
    knownNames.add(nameKey);

    planned.push({
      productionId,
      name: location.name,
      setting: location.setting,
      description: `Extracted from screenplay scene heading: ${location.sourceHeading}`,
      notes: `Appears in ${location.occurrences} scene${location.occurrences === 1 ? "" : "s"}. Review and refine this location before production.`,
      status: "draft",
      progress: 10,
    });
  }

  return planned;
}