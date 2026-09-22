import { parseSceneHeading } from "../scene-heading";

export interface LocationExtraction {
  name: string;
  setting: "interior" | "exterior" | "both";
  occurrences: number;
  sourceHeading: string;
}

export class LocationExtractor {
  async extract(screenplay: string): Promise<LocationExtraction[]> {
    if (!screenplay?.trim()) {
      return [];
    }

    const locations = new Map<string, LocationExtraction>();

    for (const line of screenplay.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const heading = parseSceneHeading(trimmed);
      if (!heading) continue;

      const key = heading.locationName.toLowerCase();
      const existing = locations.get(key);
      const setting: LocationExtraction["setting"] =
        heading.prefix === "BOTH"
          ? "both"
          : heading.prefix === "EXT"
            ? "exterior"
            : "interior";

      if (existing) {
        existing.occurrences += 1;
        if (existing.setting !== setting) {
          existing.setting = "both";
        }
      } else {
        locations.set(key, {
          name: heading.locationName,
          setting,
          occurrences: 1,
          sourceHeading: heading.heading,
        });
      }
    }

    return Array.from(locations.values());
  }
}

export const locationExtractor = new LocationExtractor();
