import { parseScreenplay } from "../screenplay-parser";

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

export class SceneExtractor {
  async extract(screenplay: string): Promise<ExtractedScene[]> {
    if (!screenplay?.trim()) return [];

    return parseScreenplay(screenplay).scenes.map((scene) => {
      const action = scene.action.join(" ").replace(/\s+/g, " ").trim();
      const dialogue = scene.dialogueBeats
        .map((beat) => {
          const parenthetical = beat.parenthetical ? ` ${beat.parenthetical}` : "";
          return `${beat.character}:${parenthetical} ${beat.dialogue}`.trim();
        })
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      const characterNames = Array.from(
        new Set(scene.dialogueBeats.map((beat) => beat.character))
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
  }
}

export const sceneExtractor = new SceneExtractor();
