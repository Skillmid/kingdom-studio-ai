import { parseScreenplay } from "../screenplay-parser";

export interface LocationExtraction {
  name: string;
  setting: "interior" | "exterior" | "both";
  occurrences: number;
  sourceHeading: string;
}

function settingFromPrefix(
  prefix: "INT" | "EXT" | "BOTH"
): LocationExtraction["setting"] {
  if (prefix === "BOTH") return "both";
  if (prefix === "EXT") return "exterior";
  return "interior";
}

export class LocationExtractor {
  async extract(screenplay: string): Promise<LocationExtraction[]> {
    if (!screenplay?.trim()) return [];

    const { scenes } = parseScreenplay(screenplay);
    const locations = new Map<string, LocationExtraction>();

    for (const scene of scenes) {
      const key = scene.heading.locationName.toLowerCase();
      const setting = settingFromPrefix(scene.heading.prefix);
      const existing = locations.get(key);

      if (existing) {
        existing.occurrences += 1;
        if (existing.setting !== setting) {
          existing.setting = "both";
        }
      } else {
        locations.set(key, {
          name: scene.heading.locationName,
          setting,
          occurrences: 1,
          sourceHeading: scene.heading.heading,
        });
      }
    }

    return Array.from(locations.values());
  }
}

export const locationExtractor = new LocationExtractor();
