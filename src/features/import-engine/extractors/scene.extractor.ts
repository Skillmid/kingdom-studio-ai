import {
  parseSceneHeading,
  splitScreenplayLines,
} from "../scene-heading";
import {
  classifyScreenplayLine,
  detectCharacterCues,
  isParenthetical,
  isTransition,
  readsAsSceneDescription,
  type CharacterCueMatch,
} from "../screenplay-elements";

import type {
  ParsedScreenplayDocument,
  ParsedScreenplayScene,
} from "../types/parsed-screenplay-document";

export type ExtractedScene = ParsedScreenplayScene;

/** Line kinds that end a dialogue block (all-caps action, camera, sound, objects, transitions). */
const NON_DIALOGUE_KINDS = new Set(["action", "object", "camera", "sound", "transition", "scene_heading"]);

function endsDialogue(line: string): boolean {
  const kind = classifyScreenplayLine(line);
  const isAllCaps = line === line.toLocaleUpperCase() && /\p{Lu}/u.test(line);
  return (isAllCaps && NON_DIALOGUE_KINDS.has(kind)) || readsAsSceneDescription(line);
}

export class SceneExtractor {
  async parse(screenplay: string): Promise<ParsedScreenplayDocument> {
    if (!screenplay?.trim()) return { scenes: [] };

    const lines = splitScreenplayLines(screenplay);
    // Same structural cue rules as the character extractor, so the cast and scene dialogue agree
    // (previously any all-caps line, e.g. "HE TYPES.", was treated as a speaker).
    const cueByIndex = new Map<number, CharacterCueMatch>(
      detectCharacterCues(lines).map((cue) => [cue.index, cue]),
    );
    let linesSinceCue = 0;
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

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
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
      if (!current) {
        // Some imported scripts have no INT./EXT. slug lines. Treat their content as one
        // implicit scene instead of silently discarding every character cue and dialogue line.
        current = {
          number: nextNumber,
          heading: "UNSPECIFIED SCENE",
          sceneType: "BOTH",
          summary: "",
          action: "",
          dialogue: "",
          dialogues: [],
          sourceText: "",
        };
        nextNumber += 1;
      }
      current.sourceText = `${current.sourceText}\n${line}`;
      if (isTransition(line)) {
        inDialogue = false;
        currentSpeaker = null;
        continue;
      }
      const cue = cueByIndex.get(index);
      if (cue) {
        currentSpeaker = cue.name;
        linesSinceCue = 0;
        if (cue.inlineDialogue) {
          current.dialogues.push({ character: cue.name, text: cue.inlineDialogue });
          current.dialogue = `${current.dialogue} ${cue.inlineDialogue}`.trim();
          inDialogue = false;
          currentSpeaker = null;
        } else {
          inDialogue = true;
          current.dialogues.push({ character: cue.name, text: "" });
        }
        continue;
      }
      if (isParenthetical(line)) {
        if (inDialogue) {
          current.dialogue = `${current.dialogue} ${line}`.trim();
          const dialogue = current.dialogues.at(-1);
          if (dialogue && currentSpeaker) {
            dialogue.text = `${dialogue.text} ${line}`.trim();
          }
        }
        continue;
      }
      // The first line after a cue is its dialogue evidence; later lines end the block when they
      // are structurally not speech (all-caps action/camera/sound, or scene description).
      if (inDialogue && linesSinceCue > 0 && endsDialogue(line)) {
        inDialogue = false;
        currentSpeaker = null;
      }
      if (inDialogue) {
        linesSinceCue += 1;
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
