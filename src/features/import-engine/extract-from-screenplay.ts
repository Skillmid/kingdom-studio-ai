import { parseScreenplay } from "./screenplay-parser";

export interface ExtractedCharacter {
  name: string;
  role: "lead" | "supporting" | "minor" | "extra";
  description: string;
  dialogueCount: number;
}

export interface LocationExtraction {
  name: string;
  setting: "interior" | "exterior" | "both";
  occurrences: number;
  sourceHeading: string;
}

export interface ExtractedScene {
  number: number;
  heading: string;
  sceneType: "INT" | "EXT" | "BOTH";
  timeOfDay?: string;
  summary: string;
  action: string;
  dialogue: string;
  sourceText: string;
  locationName?: string;
  characterNames: string[];
}

export type ScreenplayExtraction = {
  characters: ExtractedCharacter[];
  locations: LocationExtraction[];
  scenes: ExtractedScene[];
};

function assignRole(
  index: number,
  count: number,
  maxDialogue: number
): ExtractedCharacter["role"] {
  if (index === 0 || count >= maxDialogue * 0.5) return "lead";
  if (index < 5 || count >= maxDialogue * 0.2) return "supporting";
  if (count >= 2) return "minor";
  return "extra";
}

export function extractFromScreenplay(screenplay: string): ScreenplayExtraction {
  if (!screenplay?.trim()) {
    return { characters: [], locations: [], scenes: [] };
  }

  const parsed = parseScreenplay(screenplay);
  const maxDialogue = parsed.characters[0]?.dialogueCount ?? 0;

  const characters = parsed.characters.map((character, index) => {
    const extensionNote = character.extensions.length
      ? ` Cue variants include ${character.extensions.join(", ")}.`
      : "";

    return {
      name: character.name,
      role: assignRole(index, character.dialogueCount, maxDialogue),
      dialogueCount: character.dialogueCount,
      description: `Appears in screenplay with ${character.dialogueCount} dialogue cue${
        character.dialogueCount === 1 ? "" : "s"
      }.${extensionNote}`,
    };
  });

  const locationMap = new Map<string, LocationExtraction>();
  for (const scene of parsed.scenes) {
    const key = scene.heading.locationName.toLowerCase();
    const setting: LocationExtraction["setting"] =
      scene.heading.prefix === "BOTH"
        ? "both"
        : scene.heading.prefix === "EXT"
          ? "exterior"
          : "interior";
    const existing = locationMap.get(key);
    if (existing) {
      existing.occurrences += 1;
      if (existing.setting !== setting) existing.setting = "both";
    } else {
      locationMap.set(key, {
        name: scene.heading.locationName,
        setting,
        occurrences: 1,
        sourceHeading: scene.heading.heading,
      });
    }
  }

  const scenes = parsed.scenes.map((scene) => {
    const action = scene.action.join(" ").replace(/\s+/g, " ").trim();
    const dialogue = scene.dialogueBeats
      .map((beat) => {
        const parenthetical = beat.parenthetical ? ` ${beat.parenthetical}` : "";
        return `${beat.character}:${parenthetical} ${beat.dialogue}`.trim();
      })
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      number: scene.number,
      heading: scene.heading.heading,
      sceneType: scene.heading.prefix,
      timeOfDay: scene.heading.timeOfDay,
      summary: action.slice(0, 700),
      action,
      dialogue,
      sourceText: scene.sourceLines.join("\n").trim(),
      locationName: scene.heading.locationName,
      characterNames: Array.from(
        new Set(scene.dialogueBeats.map((beat) => beat.character))
      ),
    };
  });

  return {
    characters,
    locations: Array.from(locationMap.values()),
    scenes,
  };
}
