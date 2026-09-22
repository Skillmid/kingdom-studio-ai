export interface LocationExtraction {
  name: string;
  setting: "interior" | "exterior" | "both";
  occurrences: number;
  sourceHeading: string;
}

const SCENE_HEADING_REGEX =
  /^(?:\d+[\s.)-]+)?(?:INT\.|EXT\.|INTERIOR|EXTERIOR|INT\/EXT|EXT\/INT|I\/E)\s*(?:-|–|—|:)??\s*(.+)$/i;

function normaliseLocationName(raw: string): string {
  return raw
    .replace(/\s+-\s+(?:DAY|NIGHT|MORNING|AFTERNOON|EVENING|DAWN|DUSK|LATER|CONTINUOUS|SAME)\s*$/i, "")
    .replace(/\s+(?:DAY|NIGHT|MORNING|AFTERNOON|EVENING|DAWN|DUSK|LATER|CONTINUOUS|SAME)\s*$/i, "")
    .replace(/\s+/g, " ")
    .replace(/[\s-]+$/, "")
    .trim();
}

function getSetting(prefix: string): LocationExtraction["setting"] {
  const value = prefix.toUpperCase();

  if (value.includes("INT/EXT") || value.includes("EXT/INT") || value.includes("I/E")) {
    return "both";
  }

  if (value.startsWith("EXT") || value.startsWith("EXTERIOR")) {
    return "exterior";
  }

  return "interior";
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

      const match = trimmed.match(SCENE_HEADING_REGEX);
      if (!match) continue;

      const rawLocation = match[1]?.trim();
      if (!rawLocation) continue;

      const name = normaliseLocationName(rawLocation);
      if (!name || name.length < 2 || name.length > 120) continue;

      const setting = getSetting(trimmed);
      const key = name.toLowerCase();
      const existing = locations.get(key);

      if (existing) {
        existing.occurrences += 1;
        if (existing.setting !== setting) {
          existing.setting = "both";
        }
      } else {
        locations.set(key, {
          name,
          setting,
          occurrences: 1,
          sourceHeading: trimmed,
        });
      }
    }

    return Array.from(locations.values());
  }
}

export const locationExtractor = new LocationExtractor();
