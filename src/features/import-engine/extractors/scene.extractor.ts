import {
  parseSceneHeading,
  splitScreenplayLines,
} from "../scene-heading";

import type {
  ParsedScreenplayDocument,
  ParsedScreenplayScene,
} from "../types/parsed-screenplay-document";

export type ExtractedScene = ParsedScreenplayScene;

const CHARACTER_CUE_PATTERN = /^\(?[A-Z][A-Z0-9 .'-]{1,35}\)?(?:\s*\([^)]*\))?$/;
const TRANSITION_PATTERN = /^(FADE IN|FADE OUT|CUT TO|DISSOLVE TO|SMASH CUT TO|MATCH CUT TO)\b/i;

export class SceneExtractor {
  async parse(screenplay: string): Promise<ParsedScreenplayDocument> {
    if (!screenplay?.trim()) return { scenes: [] };

    const lines = splitScreenplayLines(screenplay);
    const scenes: ParsedScreenplayScene[] = [];
    let current: ParsedScreenplayScene | null = null;
    let nextNumber = 1;
    let inDialogue = false;
    let currentSpeaker: string | null = null;

    const flush = () => {
      if (!current) return;

      const clean = (value: string) => value.replace(/\s+/g, " ").trim();
      const action = clean(current.action);
      const dialogue = clean(current.dialogue);
      const dialogues = current.dialogues
        .map((entry) => ({ ...entry, text: clean(entry.text) }))
        .filter((entry) => entry.text.length > 0);

      scenes.push({
        ...current,
        summary: action.slice(0, 700),
        action,
        dialogue,
        dialogues,
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
          dialogues: [],
          sourceText: line,
          locationName: heading.locationName,
        };

        inDialogue = false;
        currentSpeaker = null;
        nextNumber = Math.max(nextNumber, number + 1);
        continue;
      }

      if (!current) continue;

      current.sourceText = `${current.sourceText}\n${line}`;

      if (TRANSITION_PATTERN.test(line)) continue;

      if (CHARACTER_CUE_PATTERN.test(line)) {
        inDialogue = true;
        currentSpeaker = line
          .replace(/\s*\([^)]*\)\s*$/, "")
          .replace(/^\(|\)$/g, "")
          .trim();
        current.dialogues.push({ character: currentSpeaker, text: "" });
        continue;
      }

      if (/^\(.*\)$/.test(line)) {
        if (inDialogue) {
          current.dialogue = `${current.dialogue} ${line}`.trim();
          const dialogue = current.dialogues.at(-1);
          if (dialogue && currentSpeaker) {
            dialogue.text = `${dialogue.text} ${line}`.trim();
          }
        }
        continue;
      }

      if (inDialogue) {
        current.dialogue = `${current.dialogue} ${line}`.trim();
        const dialogue = current.dialogues.at(-1);
        if (dialogue && currentSpeaker) {
          dialogue.text = `${dialogue.text} ${line}`.trim();
        }
      } else {
        current.action = `${current.action} ${line}`.trim();
      }

      // A non-indented sentence after dialogue is normally action in plain-text
      // imports. This keeps extraction useful without losing the original text.
      if (inDialogue && /[.!?]$/.test(line) && line.length > 80) {
        inDialogue = false;
        currentSpeaker = null;
      }
    }

    flush();
    return { scenes };
  }

  async extract(screenplay: string): Promise<ExtractedScene[]> {
    const document = await this.parse(screenplay);
    return document.scenes;
  }
}

export const sceneExtractor = new SceneExtractor();
