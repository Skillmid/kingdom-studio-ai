import {
  extractFromScreenplay,
  type ExtractedScene,
} from "../extract-from-screenplay";

export type { ExtractedScene };

export class SceneExtractor {
  async extract(screenplay: string): Promise<ExtractedScene[]> {
    return extractFromScreenplay(screenplay).scenes;
  }
}

export const sceneExtractor = new SceneExtractor();
