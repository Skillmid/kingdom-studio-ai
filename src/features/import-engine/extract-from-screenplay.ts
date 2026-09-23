import { extractActionCharacterNames } from "./action-character-extractor";
import { parseScreenplay } from "./screenplay-parser";

import type { ScreenplayAnalysis } from "@/features/script-intelligence/types/screenplay-analysis";

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
  if (count === 0) return "supporting";
  if (index < 5 || count >= maxDialogue * 0.2) return "supporting";
  if (count >= 2) return "minor";
  return "extra";
}

function fromCanonicalAnalysis(analysis: ScreenplayAnalysis): ScreenplayExtraction {
  const sortedCharacters = [...analysis.characters].sort(
    (a, b) => b.dialogueCount - a.dialogueCount || a.name.localeCompare(b.name)
  );
  const maxDialogue = sortedCharacters[0]?.dialogueCount ?? 0;

  const characters = sortedCharacters.map((character, index) => {
    const evidence = character.evidence[0]?.text;
    const presence = character.speaks
      ? `Speaks ${character.dialogueCount} time${character.dialogueCount === 1 ? "" : "s"}.`
      : "Present in screenplay action but has no dialogue.";
    const evidenceNote = evidence ? ` Evidence: ${evidence}` : "";

    return {
      name: character.name,
      role: assignRole(index, character.dialogueCount, maxDialogue),
      dialogueCount: character.dialogueCount,
      description: `${presence}${evidenceNote}`,
    };
  });

  const locations = analysis.locations.map((location) => ({
    name: location.name,
    setting: location.setting,
    occurrences: location.sceneNumbers.length || 1,
    sourceHeading: location.sourceHeading,
  }));

  const scenes = analysis.scenes
    .slice()
    .sort((a, b) => a.number - b.number)
    .map((scene) => {
      const action = scene.action.join(" ").replace(/\s+/g, " ").trim();
      const dialogue = scene.dialogue
        .map((beat) => {
          const parenthetical = beat.parenthetical ? ` ${beat.parenthetical}` : "";
          return `${beat.character}:${parenthetical} ${beat.dialogue}`.trim();
        })
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      return {
        number: scene.number,
        heading: scene.heading,
        sceneType: scene.sceneType,
        timeOfDay: scene.timeOfDay,
        summary: action.slice(0, 700),
        action,
        dialogue,
        sourceText: scene.sourceText.trim(),
        locationName: scene.locationName,
        characterNames: Array.from(new Set(scene.characterNames.map((name) => name.trim()).filter(Boolean))),
      };
    });

  return { characters, locations, scenes };
}

export function extractFromScreenplay(
  screenplay: string,
  analysis?: ScreenplayAnalysis | null
): ScreenplayExtraction {
  if (analysis) return fromCanonicalAnalysis(analysis);

  if (!screenplay?.trim()) {
    return { characters: [], locations: [], scenes: [] };
  }

  // Legacy fallback for screenplays saved before canonical AI analysis existed.
  const parsed = parseScreenplay(screenplay);
  const maxDialogue = parsed.characters[0]?.dialogueCount ?? 0;
  const actionCharacterNames = new Map<string, string>();

  for (const scene of parsed.scenes) {
    for (const name of extractActionCharacterNames(scene.action)) {
      actionCharacterNames.set(name.toLowerCase(), name);
    }
  }

  const characterMap = new Map<string, { name: string; dialogueCount: number; extensions: string[] }>();
  for (const character of parsed.characters) {
    characterMap.set(character.name.toLowerCase(), character);
  }
  for (const name of actionCharacterNames.values()) {
    const key = name.toLowerCase();
    if (!characterMap.has(key)) {
      characterMap.set(key, { name, dialogueCount: 0, extensions: [] });
    }
  }

  const parsedCharacters = Array.from(characterMap.values()).sort(
    (a, b) => b.dialogueCount - a.dialogueCount || a.name.localeCompare(b.name)
  );

  const characters = parsedCharacters.map((character, index) => ({
    name: character.name,
    role: assignRole(index, character.dialogueCount, maxDialogue),
    dialogueCount: character.dialogueCount,
    description: `Appears in screenplay with ${character.dialogueCount} dialogue cue${character.dialogueCount === 1 ? "" : "s"}.${
      character.dialogueCount === 0 ? " Present in screenplay action but has no dialogue cue." : ""
    }`,
  }));

  const locationMap = new Map<string, LocationExtraction>();
  for (const scene of parsed.scenes) {
    const key = scene.heading.locationName.toLowerCase();
    const setting: LocationExtraction["setting"] =
      scene.heading.prefix === "BOTH" ? "both" : scene.heading.prefix === "EXT" ? "exterior" : "interior";
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
      .map((beat) => `${beat.character}:${beat.parenthetical ? ` ${beat.parenthetical}` : ""} ${beat.dialogue}`.trim())
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    const dialogueNames = scene.dialogueBeats.map((beat) => beat.character);
    const actionNames = extractActionCharacterNames(scene.action);
    const characterNames = Array.from(
      new Map([...dialogueNames, ...actionNames].map((name) => [name.toLowerCase(), name])).values()
    );

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
      characterNames,
    };
  });

  return {
    characters,
    locations: Array.from(locationMap.values()),
    scenes,
  };
}
