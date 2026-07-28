import {
  storyExtractor,
} from "../extractors/story.extractor";

import {
  characterExtractor,
} from "../extractors/character.extractor";

import {
  sceneExtractor,
} from "../extractors/scene.extractor";

import {
  dialogueExtractor,
} from "../extractors/dialogue.extractor";

import {
  spiritualExtractor,
} from "../extractors/spiritual.extractor";

import {
  culturalExtractor,
} from "../extractors/cultural.extractor";

import {
  assembleProductionKnowledge,
} from "@/features/production-knowledge/builders/knowledge-assembler";

import type {
  ProductionKnowledge,
} from "@/features/production-knowledge";

import type {
  DialogueMetrics,
} from "../extractors/dialogue.extractor";

export interface KnowledgeExtractionResult {
  knowledge: ProductionKnowledge;

  dialogue: DialogueMetrics;
}

export class KnowledgeExtractionService {
  async extract(
    productionId: string,
    screenplay: string,
    source: ProductionKnowledge["screenplay"]["source"] = "txt"
  ): Promise<KnowledgeExtractionResult> {
    const [
      story,
      characters,
      scenes,
      dialogue,
      spiritual,
      cultural,
    ] = await Promise.all([
      storyExtractor.extract(
        screenplay
      ),

      characterExtractor.extract(
        screenplay
      ),

      sceneExtractor.extract(
        screenplay
      ),

      dialogueExtractor.analyze(
        screenplay
      ),

      spiritualExtractor.extract(
        screenplay
      ),

      culturalExtractor.extract(
        screenplay
      ),
    ]);

    const knowledge =
      assembleProductionKnowledge({
        productionId,

        story,

        characters,

        scenes,

        spiritual,

        cultural,

        source,

        screenplayTitle:
          story.title,
      });

    return {
      knowledge,
      dialogue,
    };
  }
}

export const knowledgeExtractionService =
  new KnowledgeExtractionService();