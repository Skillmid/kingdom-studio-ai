import {
  parseSceneHeading,
  splitScreenplayLines,
} from "../scene-heading";

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
}

const CHARACTER_CUE_PATTERN = /^\(?[A-Z][A-Z0-9 .'-]{1,35}\)?(?:\s*\([^)]*\))?$/;
const TRANSITION_PATTERN = /^(FADE IN|FADE OUT|CUT TO|DISSOLVE TO|SMASH CUT TO|MATCH CUT TO)\b/i;

export class SceneExtractor {
  async extract(screenplay: string): Promise<ExtractedScene[]> {
    if (!screenplay?.trim()) return [];

    const lines = splitScreenplayLines(screenplay);
    const scenes: ExtractedScene[] = [];
    let current: ExtractedScene | null = null;
    let nextNumber = 1;
    let inDialogue = false;

    const flush = () => {
      if (!current) return;

      const clean = (value: string) => value.replace(/\s+/g, " ").trim();
      const action = clean(current.action);
      const dialogue = clean(current.dialogue);

      scenes.push({
        ...current,
        summary: action.slice(0, 700),
        action,
        dialogue,
        sourceText: current.sourceText.trim(),
      });
    };

    for (const line of lines) {
      const heading = parseSceneHeading(line);

      if (heading) {
        flush();

        const explicitNumber = line.match(/^(?:SCENE\s*#?\s*)?(\d+)[\s:.)-]+/i);
        const number = explicitNumber ? Number(explicitNumber[1]) : nextNumber;

        current = {
          number,
          heading: heading.heading,
          sceneType: heading.prefix,
          timeOfDay: heading.timeOfDay,
          summary: "",
          action: "",
          dialogue: "",
          sourceText: line,
          locationName: heading.locationName,
        };

        inDialogue = false;
        nextNumber = Math.max(nextNumber, number + 1);
        continue;
      }

      if (!current) continue;

      current.sourceText = `${current.sourceText}\n${line}`;

      if (TRANSITION_PATTERN.test(line)) continue;

      if (CHARACTER_CUE_PATTERN.test(line)) {
        inDialogue = true;
        continue;
      }

      if (/^\(.*\)$/.test(line)) {
        if (inDialogue) current.dialogue = `${current.dialogue} ${line}`.trim();
        continue;
      }

      if (inDialogue) {
        current.dialogue = `${current.dialogue} ${line}`.trim();
      } else {
        current.action = `${current.action} ${line}`.trim();
      }

      // A non-indented sentence after dialogue is normally action in plain-text
      // imports. This keeps extraction useful without losing the original text.
      if (inDialogue && /[.!?]$/.test(line) && line.length > 80) {
        inDialogue = false;
      }
    }

    flush();
    return scenes;
  }
}

export const sceneExtractor = new SceneExtractor();
