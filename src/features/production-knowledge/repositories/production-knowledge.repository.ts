import { storyBibleRepository } from "@/features/story-bible/repositories/story-bible.repository";

import type {
  ProductionKnowledge,
} from "../types/production-knowledge";

export class ProductionKnowledgeRepository {
  async get(
    productionId: string
  ): Promise<ProductionKnowledge> {

    const storyBible =
      await storyBibleRepository.getByProductionId(
        productionId
      );

    return {
      productionId,

      storyBible: {
        title:
          storyBible?.title ?? "",

        logline:
          storyBible?.logline ?? "",

        synopsis:
          storyBible?.synopsis ?? "",

        theme:
          storyBible?.theme ?? "",

        kingdomVision:
          storyBible?.kingdom_objective ??
          "",

        scriptureFoundation:
          storyBible?.scripture_foundation ??
          "",

        audience:
          storyBible?.target_audience ??
          "",

        genre:
          storyBible?.genre ?? "",

        tone:
          storyBible?.tone ?? "",

        language:
          storyBible?.language ??
          "English",
      },

      screenplay: {
        imported: false,

        source: "internal",

        title: "",

        acts: 0,

        scenes: 0,

        pages: 0,

        status: "draft",
      },

      characters: [],

      locations: [],

      scenes: [],

      assets: [],

      director: {
        notes: "",

        productionGoals: "",

        visualStyle: "",

        cameraStyle: "",
      },

      aiMemory: {
        conversations: [],

        decisions: [],

        generatedAssets: [],

        revisions: [],
      },
    };
  }
}

export const productionKnowledgeRepository =
  new ProductionKnowledgeRepository();