export interface ExtractedCharacter {
  name: string;
  role: "lead" | "supporting" | "minor" | "extra";
  description: string;
  dialogueCount: number;
}

const SCREENPLAY_TRANSITIONS = new Set([
  "CUT TO:",
  "FADE IN:",
  "FADE OUT:",
  "FADE TO BLACK:",
  "DISSOLVE TO:",
  "SMASH CUT TO:",
  "MATCH CUT TO:",
  "JUMP CUT TO:",
  "INTERCUT:",
  "THE END",
  "CONTINUED:",
  "CONTINUED",
  "SCENE START",
  "SCENE END",
  "MONTAGE",
  "TITLE CARD",
  "END TITLE CARD",
]);

const NON_CHARACTER_PATTERNS = [
  /^(INT|EXT|INTERIOR|EXTERIOR|INT\/EXT|EXT\/INT|I\/E)\s*(\.|\/|-|–|—)\s*/i,
  /^SCENE\s+\d+/i,
  /^ACT\s+[IVXLCDM\d]+/i,
  /^EPISODE\s+\d+/i,
  /^PAGE\s+\d+/i,
  /^(TITLE|SUBJECT|LOCATION|TIME|SETTING)\s*:/i,
  /^\(.*\)$/,
];

const SCREENPLAY_CHARACTER_LABELS = new Set([
  "V.O.",
  "O.S.",
  "O.C.",
  "CONT'D",
  "CONT’D",
]);

function sanitizeCharacterName(rawName: string): string {
  return rawName
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .replace(/^["'\s]+|["'\s:]+$/g, "")
    .replace(/^(MR\.|MS\.|MRS\.|DR\.|REV\.|PASTOR|EVANGELIST)\s+/i, "")
    .trim();
}

function isSceneHeading(line: string): boolean {
  const trimmed = line.trim();

  if (!trimmed) {
    return false;
  }

  return NON_CHARACTER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function isLikelyDocumentTitle(line: string, index: number, firstMeaningfulIndex: number): boolean {
  if (index !== firstMeaningfulIndex) {
    return false;
  }

  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 80 || isSceneHeading(trimmed)) {
    return false;
  }

  // Screenplay documents commonly begin with a title in title case. Do not
  // treat that document title as a character cue merely because it is short.
  const words = trimmed.split(/\s+/);
  return words.length >= 2 && words.length <= 8 && !/:$/.test(trimmed);
}

function isValidCharacterCue(line: string, nextMeaningfulLine?: string): boolean {
  const trimmed = line.trim();

  if (!trimmed || trimmed.length < 2 || trimmed.length > 35) {
    return false;
  }

  if (SCREENPLAY_TRANSITIONS.has(trimmed.toUpperCase())) {
    return false;
  }

  if (SCREENPLAY_CHARACTER_LABELS.has(trimmed.toUpperCase())) {
    return false;
  }

  if (isSceneHeading(trimmed)) {
    return false;
  }

  const baseName = sanitizeCharacterName(trimmed);
  if (!baseName || baseName.length < 2) {
    return false;
  }

  if (/[.!?]$/.test(baseName)) {
    return false;
  }

  // The safest screenplay signal is an uppercase character cue.
  const isAllUpper =
    baseName === baseName.toUpperCase() && /[A-Z]/.test(baseName);

  if (isAllUpper) {
    return true;
  }

  // Support plain-text scripts that use "David:" or "David (V.O.)" rather
  // than conventional uppercase screenplay formatting.
  const hasExplicitCueMarker = /:\s*$/.test(trimmed);
  if (hasExplicitCueMarker && nextMeaningfulLine) {
    return true;
  }

  return false;
}

function getNextMeaningfulLine(lines: string[], index: number): string | undefined {
  for (let i = index + 1; i < lines.length; i++) {
    const candidate = lines[i].trim();

    if (!candidate) {
      continue;
    }

    return candidate;
  }

  return undefined;
}

export class CharacterExtractor {
  async extract(screenplay: string): Promise<ExtractedCharacter[]> {
    if (!screenplay || !screenplay.trim()) {
      return [];
    }

    const lines = screenplay.split(/\r?\n/);
    const firstMeaningfulIndex = lines.findIndex((line) => line.trim().length > 0);
    const characterCounts = new Map<string, number>();
    const characterDescriptions = new Map<string, string>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const nextMeaningfulLine = getNextMeaningfulLine(lines, i);

      if (
        isLikelyDocumentTitle(line, i, firstMeaningfulIndex) ||
        !isValidCharacterCue(line, nextMeaningfulLine)
      ) {
        continue;
      }

      const charName = sanitizeCharacterName(trimmed).toUpperCase();
      if (!charName) {
        continue;
      }

      const currentCount = characterCounts.get(charName) ?? 0;
      characterCounts.set(charName, currentCount + 1);

      if (i > 0 && !characterDescriptions.has(charName)) {
        const prevLine = lines[i - 1].trim();

        if (
          prevLine &&
          !isValidCharacterCue(lines[i - 1], trimmed) &&
          !prevLine.startsWith("(") &&
          prevLine.length > 20
        ) {
          characterDescriptions.set(charName, prevLine.slice(0, 150));
        }
      }
    }

    if (characterCounts.size === 0) {
      return [];
    }

    const sorted = Array.from(characterCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    const maxDialogue = sorted[0][1];

    return sorted.map(([name, count], index) => {
      let role: ExtractedCharacter["role"] = "minor";

      if (index === 0 || count >= maxDialogue * 0.5) {
        role = "lead";
      } else if (index < 5 || count >= maxDialogue * 0.2) {
        role = "supporting";
      } else if (count >= 2) {
        role = "minor";
      } else {
        role = "extra";
      }

      const formattedName = name
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

      return {
        name: formattedName,
        role,
        dialogueCount: count,
        description:
          characterDescriptions.get(name) ||
          `Appears in screenplay with ${count} dialogue cue${count === 1 ? "" : "s"}.`,
      };
    });
  }
}

export const characterExtractor = new CharacterExtractor();
