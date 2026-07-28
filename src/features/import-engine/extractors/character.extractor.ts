export interface ExtractedCharacter {
  name: string;

  role: string;

  description: string;

  dialogueCount: number;
}

export class CharacterExtractor {
  async extract(
    screenplay: string
  ): Promise<ExtractedCharacter[]> {
    console.log(
      "Extracting characters..."
    );

    return [];
  }
}

export const characterExtractor =
  new CharacterExtractor();