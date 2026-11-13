import {
  detectCharacterCues,
  formatCharacterName,
} from "../screenplay-elements";

export interface ExtractedCharacter {
  name: string;
  role: "lead" | "supporting" | "minor" | "extra";
  description: string;
  dialogueCount: number;
}

export class CharacterExtractor {
  async extract(screenplay: string): Promise<ExtractedCharacter[]> {
    if (!screenplay || !screenplay.trim()) {
      return [];
    }

    const lines = screenplay.split(/\r?\n/);
    // Shared structural cue detection (title, slug lines, dialogue evidence, corroboration).
    const cues = detectCharacterCues(lines);
    const cueIndexes = new Set(cues.map((cue) => cue.index));
    const characterCounts = new Map<string, number>();
    const characterDescriptions = new Map<string, string>();

    for (const cue of cues) {
      const charName = cue.name;
      characterCounts.set(charName, (characterCounts.get(charName) ?? 0) + 1);

      if (cue.index > 0 && !characterDescriptions.has(charName)) {
        const prevLine = lines[cue.index - 1].trim();
        if (
          prevLine &&
          !cueIndexes.has(cue.index - 1) &&
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

      return {
        name: formatCharacterName(name),
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
