import {
  findDocumentTitle,
  hasDialogueEvidence,
  isNameShapedCharacterCue,
  nextDialogueLine,
  sanitizeCharacterCue,
  titlesMatch,
} from "../screenplay-elements";

export interface ExtractedCharacter {
  name: string;
  role: "lead" | "supporting" | "minor" | "extra";
  description: string;
  dialogueCount: number;
}

function isValidCharacterCue(
  line: string,
  followingLine: string | undefined,
  documentTitle: string | null,
): boolean {
  const trimmed = line.trim();
  if (!isNameShapedCharacterCue(trimmed)) return false;
  const cue = sanitizeCharacterCue(trimmed);
  if (documentTitle && titlesMatch(cue, documentTitle)) return false;
  return hasDialogueEvidence(followingLine);
}

export class CharacterExtractor {
  async extract(screenplay: string): Promise<ExtractedCharacter[]> {
    if (!screenplay || !screenplay.trim()) {
      return [];
    }

    const lines = screenplay.split(/\r?\n/);
    const documentTitle = findDocumentTitle(lines);
    const characterCounts = new Map<string, number>();
    const characterDescriptions = new Map<string, string>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const followingLine = nextDialogueLine(lines, i);

      if (!isValidCharacterCue(line, followingLine, documentTitle)) {
        continue;
      }

      const charName = sanitizeCharacterCue(line).toUpperCase();
      if (!charName) continue;

      characterCounts.set(charName, (characterCounts.get(charName) ?? 0) + 1);

      if (i > 0 && !characterDescriptions.has(charName)) {
        const prevLine = lines[i - 1].trim();
        if (
          prevLine &&
          !isValidCharacterCue(lines[i - 1], line, documentTitle) &&
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

    const sorted = Array.from(characterCounts.entries()).sort((a, b) => b[1] - a[1]);
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

      const formattedName = name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

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
