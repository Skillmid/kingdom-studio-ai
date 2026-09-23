import {
  extractFromScreenplay,
  type ExtractedCharacter,
} from "../extract-from-screenplay";

export type { ExtractedCharacter };

export class CharacterExtractor {
  async extract(screenplay: string): Promise<ExtractedCharacter[]> {
    return extractFromScreenplay(screenplay).characters;
  }
}

export const characterExtractor = new CharacterExtractor();
