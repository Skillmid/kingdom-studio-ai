import {
  parseScreenplay,
  type ParsedCharacter,
} from "../screenplay-parser";

export interface ExtractedCharacter {
  name: string;
  role: "lead" | "supporting" | "minor" | "extra";
  description: string;
  dialogueCount: number;
}

function assignRole(
  characters: ParsedCharacter[],
  index: number,
  count: number,
  maxDialogue: number
): ExtractedCharacter["role"] {
  if (index === 0 || count >= maxDialogue * 0.5) return "lead";
  if (index < 5 || count >= maxDialogue * 0.2) return "supporting";
  if (count >= 2) return "minor";
  return "extra";
}

export class CharacterExtractor {
  async extract(screenplay: string): Promise<ExtractedCharacter[]> {
    if (!screenplay?.trim()) return [];

    const parsed = parseScreenplay(screenplay);
    if (parsed.characters.length === 0) return [];

    const maxDialogue = parsed.characters[0].dialogueCount;

    return parsed.characters.map((character, index) => {
      const extensionNote = character.extensions.length
        ? ` Cue variants include ${character.extensions.join(", ")}.`
        : "";

      return {
        name: character.name,
        role: assignRole(parsed.characters, index, character.dialogueCount, maxDialogue),
        dialogueCount: character.dialogueCount,
        description: `Appears in screenplay with ${character.dialogueCount} dialogue cue${
          character.dialogueCount === 1 ? "" : "s"
        }.${extensionNote}`,
      };
    });
  }
}

export const characterExtractor = new CharacterExtractor();
