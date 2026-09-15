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
]);

const NON_CHARACTER_PATTERNS = [
  /^(INT\.|EXT\.|EXTERIOR|INTERIOR|INT\/EXT|EXT\/INT)\b/i,
  /^SCENE\s+\d+/i,
  /^ACT\s+[IVXLCDM\d]+/i,
  /^EPISODE\s+\d+/i,
  /^PAGE\s+\d+/i,
  /^\(.*\)$/,
];

function sanitizeCharacterName(rawName: string): string {
  return rawName
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/^(MR\.|MS\.|MRS\.|DR\.|REV\.|PASTOR|EVANGELIST)\s+/i, "")
    .trim();
}

function isValidCharacterCue(line: string): boolean {
  const trimmed = line.trim();

  if (!trimmed || trimmed.length < 2 || trimmed.length > 35) {
    return false;
  }

  if (SCREENPLAY_TRANSITIONS.has(trimmed.toUpperCase())) {
    return false;
  }

  for (const pattern of NON_CHARACTER_PATTERNS) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }

  const baseName = sanitizeCharacterName(trimmed);
  if (!baseName || baseName.length < 2) {
    return false;
  }

  const isAllUpper =
    baseName === baseName.toUpperCase() && /[A-Z]/.test(baseName);
  const isPaddedHeader =
    /^\s{10,30}[A-Z]/.test(line) && !line.includes(":");

  return (isAllUpper || isPaddedHeader) && !/[.!?]$/.test(baseName);
}

export class CharacterExtractor {
  async extract(screenplay: string): Promise<ExtractedCharacter[]> {
    if (!screenplay || !screenplay.trim()) {
      return [];
    }

    const lines = screenplay.split(/\r?\n/);
    const characterCounts = new Map<string, number>();
    const characterDescriptions = new Map<string, string>();

    let lastDetectedCharacter: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (isValidCharacterCue(line)) {
        const charName = sanitizeCharacterName(trimmed).toUpperCase();

        const currentCount = characterCounts.get(charName) ?? 0;
        characterCounts.set(charName, currentCount + 1);
        lastDetectedCharacter = charName;

        if (i > 0 && !characterDescriptions.has(charName)) {
          const prevLine = lines[i - 1].trim();
          if (
            prevLine &&
            !isValidCharacterCue(lines[i - 1]) &&
            !prevLine.startsWith("(") &&
            prevLine.length > 20
          ) {
            characterDescriptions.set(
              charName,
              prevLine.slice(0, 150)
            );
          }
        }
      } else if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
        continue;
      } else if (trimmed.length === 0) {
        lastDetectedCharacter = null;
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