import {
  isSceneHeading,
  isScreenplayTransition,
  parseSceneHeading,
  splitScreenplayLines,
  toTitleCaseName,
  type SceneHeadingParts,
} from "./scene-heading";

export type ParsedDialogueBeat = {
  character: string;
  extension?: string;
  parenthetical?: string;
  dialogue: string;
};

export type ParsedScene = {
  number: number;
  heading: SceneHeadingParts;
  rawHeading: string;
  action: string[];
  dialogueBeats: ParsedDialogueBeat[];
  transitions: string[];
  sourceLines: string[];
};

export type ParsedCharacter = {
  name: string;
  dialogueCount: number;
  extensions: string[];
};

export type ParsedScreenplay = {
  lines: string[];
  scenes: ParsedScene[];
  characters: ParsedCharacter[];
};

const CUE_EXTENSION_PATTERN =
  /\s*\(([^)]+)\)\s*$/;

const PARENTHETICAL_LINE = /^\([^)]+\)$/;

const FUNCTION_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "but",
  "or",
  "so",
  "as",
  "at",
  "on",
  "in",
  "of",
  "to",
  "from",
  "with",
  "without",
  "his",
  "her",
  "their",
  "its",
  "this",
  "that",
  "these",
  "those",
  "another",
  "then",
  "next",
  "later",
  "meanwhile",
]);

const ACTION_TOKENS = new Set([
  "types",
  "adds",
  "appears",
  "follows",
  "displays",
  "looks",
  "walks",
  "enters",
  "exits",
  "falls",
  "reads",
  "writes",
  "opens",
  "closes",
  "picks",
  "holds",
  "sees",
  "hears",
  "turns",
  "grabs",
  "checks",
]);

const CHARACTER_EXTENSIONS = new Set([
  "v.o.",
  "v.o",
  "vo",
  "o.s.",
  "o.s",
  "os",
  "o.c.",
  "o.c",
  "oc",
  "cont'd",
  "contd",
  "cont’d",
  "continued",
  "phone",
  "filtered",
  "pre-lap",
  "prelap",
  "over comm",
  "over radio",
]);

function stripCueDecoration(value: string): string {
  return value.replace(/:+\s*$/, "").trim();
}

function splitCueExtension(value: string): { name: string; extension?: string } {
  const trimmed = stripCueDecoration(value);
  const match = trimmed.match(CUE_EXTENSION_PATTERN);
  if (!match) {
    return { name: trimmed };
  }

  return {
    name: trimmed.slice(0, match.index).trim(),
    extension: match[1].trim(),
  };
}

function isCharacterExtension(value?: string): boolean {
  if (!value) return true;
  return CHARACTER_EXTENSIONS.has(value.toLowerCase().replace(/\s+/g, " "));
}

function isNameToken(token: string): boolean {
  return /^[A-Za-z][A-Za-z.'’-]*$/.test(token);
}

function looksLikeSpokenDialogue(line: string): boolean {
  if (!line) return false;
  if (isSceneHeading(line) || isScreenplayTransition(line)) return false;
  if (PARENTHETICAL_LINE.test(line)) return true;
  if (/[0-9]+:[0-9]+/.test(line)) return false;
  if (line.length > 220) return false;

  const letters = line.replace(/[^A-Za-z]/g, "");
  if (letters.length < 2) return false;

  const hasLowercase = /[a-z]/.test(line);
  const wordCount = line.split(/\s+/).length;

  if (hasLowercase) return true;
  if (wordCount <= 12 && /['’]/.test(line)) return true;
  if (wordCount <= 8 && /[.?!]$/.test(line)) return true;

  return false;
}

export function isCharacterCueCandidate(line: string): boolean {
  const trimmed = stripCueDecoration(line);
  if (!trimmed || trimmed.length < 2 || trimmed.length > 42) return false;
  if (isSceneHeading(trimmed) || isScreenplayTransition(trimmed)) return false;
  if (PARENTHETICAL_LINE.test(trimmed)) return false;
  if (/[0-9]/.test(trimmed)) return false;
  if (/[.!?]$/.test(trimmed)) return false;

  const { name, extension } = splitCueExtension(trimmed);
  if (!name || name.length < 2) return false;
  if (extension && !isCharacterExtension(extension)) return false;

  const words = name.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 4) return false;
  if (!words.every(isNameToken)) return false;

  const first = words[0].toLowerCase().replace(/[^a-z]/g, "");
  if (FUNCTION_WORDS.has(first)) return false;

  const hasFunctionWord = words.some((word) =>
    FUNCTION_WORDS.has(word.toLowerCase())
  );
  if (hasFunctionWord) return false;

  const laterActionToken = words.slice(1).some((word) =>
    ACTION_TOKENS.has(word.toLowerCase())
  );
  if (laterActionToken) return false;

  return true;
}

function nextNonEmptyIndex(lines: string[], index: number): number {
  for (let i = index + 1; i < lines.length; i += 1) {
    if (lines[i]?.trim()) return i;
  }
  return -1;
}

function nextNonEmpty(lines: string[], index: number): string | undefined {
  const nextIndex = nextNonEmptyIndex(lines, index);
  return nextIndex === -1 ? undefined : lines[nextIndex].trim();
}

function isDialogueFollower(line: string | undefined): boolean {
  if (!line) return false;
  if (PARENTHETICAL_LINE.test(line)) return true;
  if (isSceneHeading(line) || isScreenplayTransition(line)) return false;
  if (isCharacterCueCandidate(line)) return false;
  return looksLikeSpokenDialogue(line);
}

export function normalizeCharacterName(rawName: string): string {
  const { name } = splitCueExtension(stripCueDecoration(rawName));
  return toTitleCaseName(name);
}

export function parseScreenplay(screenplay: string): ParsedScreenplay {
  const lines = splitScreenplayLines(screenplay);
  const scenes: ParsedScene[] = [];

  let nextNumber = 1;
  let openBeat: ParsedDialogueBeat | null = null;

  const activeScene = (): ParsedScene | undefined => scenes[scenes.length - 1];

  const flushBeat = () => {
    const scene = activeScene();
    if (!scene || !openBeat) return;
    if (openBeat.dialogue.trim()) {
      scene.dialogueBeats.push({
        ...openBeat,
        dialogue: openBeat.dialogue.replace(/\s+/g, " ").trim(),
      });
    }
    openBeat = null;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const heading = parseSceneHeading(line);

    if (heading) {
      flushBeat();
      const number = heading.sceneNumber && heading.sceneNumber > 0
        ? heading.sceneNumber
        : nextNumber;

      scenes.push({
        number,
        heading,
        rawHeading: line,
        action: [],
        dialogueBeats: [],
        transitions: [],
        sourceLines: [line],
      });

      nextNumber = Math.max(nextNumber, number + 1);
      continue;
    }

    const scene = activeScene();
    if (!scene) {
      continue;
    }

    scene.sourceLines.push(line);

    if (isScreenplayTransition(line)) {
      flushBeat();
      scene.transitions.push(line);
      continue;
    }

    if (PARENTHETICAL_LINE.test(line)) {
      if (openBeat) {
        openBeat.parenthetical = [
          openBeat.parenthetical,
          line,
        ]
          .filter(Boolean)
          .join(" ");
      } else {
        scene.action.push(line);
      }
      continue;
    }

    const followerIndex = nextNonEmptyIndex(lines, index);
    const follower = followerIndex === -1 ? undefined : lines[followerIndex].trim();
    const afterParenthetical = follower && PARENTHETICAL_LINE.test(follower)
      ? nextNonEmpty(lines, followerIndex)
      : follower;
    const followerIsDialogue =
      Boolean(follower && PARENTHETICAL_LINE.test(follower) && isDialogueFollower(afterParenthetical)) ||
      isDialogueFollower(follower);

    if (isCharacterCueCandidate(line) && followerIsDialogue) {
      flushBeat();
      const parts = splitCueExtension(stripCueDecoration(line));
      openBeat = {
        character: normalizeCharacterName(parts.name),
        extension: parts.extension,
        dialogue: "",
      };
      continue;
    }

    if (openBeat && looksLikeSpokenDialogue(line) && !isCharacterCueCandidate(line)) {
      openBeat.dialogue = `${openBeat.dialogue} ${line}`.trim();
      continue;
    }

    flushBeat();
    scene.action.push(line);
  }

  flushBeat();

  const characterMap = new Map<string, ParsedCharacter>();
  for (const scene of scenes) {
    for (const beat of scene.dialogueBeats) {
      const key = beat.character.toLowerCase();
      const existing = characterMap.get(key);
      if (existing) {
        existing.dialogueCount += 1;
        if (beat.extension && !existing.extensions.includes(beat.extension)) {
          existing.extensions.push(beat.extension);
        }
      } else {
        characterMap.set(key, {
          name: beat.character,
          dialogueCount: 1,
          extensions: beat.extension ? [beat.extension] : [],
        });
      }
    }
  }

  return {
    lines,
    scenes,
    characters: Array.from(characterMap.values()).sort(
      (a, b) => b.dialogueCount - a.dialogueCount || a.name.localeCompare(b.name)
    ),
  };
}
