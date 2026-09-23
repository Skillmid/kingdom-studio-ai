import {
  extractFromScreenplay,
  type ExtractedCharacter,
} from "../extract-from-screenplay";

import type { ScreenplayAnalysis } from "@/features/script-intelligence/types/screenplay-analysis";

export type { ExtractedCharacter };

export class CharacterExtractor {
  async extract(
    screenplay: string,
    analysis?: ScreenplayAnalysis | null
  ): Promise<ExtractedCharacter[]> {
    return extractFromScreenplay(screenplay, analysis).characters;
  }
}

export const characterExtractor = new CharacterExtractor();
