export interface ExtractedScene {
  number: number;

  heading: string;

  summary: string;
}

export class SceneExtractor {
  async extract(
    screenplay: string
  ): Promise<ExtractedScene[]> {
    console.log(
      "Extracting scenes..."
    );

    return [];
  }
}

export const sceneExtractor =
  new SceneExtractor();