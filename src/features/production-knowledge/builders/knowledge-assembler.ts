import type {
  ProductionKnowledge,
} from "../types/production-knowledge";

import type {
  StoryExtraction,
} from "@/features/import-engine/extractors/story.extractor";

import type {
  ExtractedCharacter,
} from "@/features/import-engine/extractors/character.extractor";

import type {
  ExtractedScene,
} from "@/features/import-engine/extractors/scene.extractor";

import type {
  SpiritualExtraction,
} from "@/features/import-engine/extractors/spiritual.extractor";

import type {
  CulturalExtraction,
} from "@/features/import-engine/extractors/cultural.extractor";

export interface KnowledgeAssemblyInput {
  productionId: string;

  story: StoryExtraction;

  characters: ExtractedCharacter[];

  scenes: ExtractedScene[];

  spiritual: SpiritualExtraction;

  cultural: CulturalExtraction;

  source?: ProductionKnowledge["screenplay"]["source"];

  screenplayTitle?: string;

  pages?: number;
}

export function assembleProductionKnowledge(
  input: KnowledgeAssemblyInput
): ProductionKnowledge {
  const {
    productionId,
    story,
    characters,
    scenes,
    spiritual,
    cultural,
  } = input;

  return {
    productionId,

    storyBible: {
      title:
        story.title ||
        input.screenplayTitle ||
        "",

      logline: story.logline,

      synopsis: story.synopsis,

      theme: story.theme,

      kingdomVision:
        spiritual.ministryObjectives.join(
          "\n"
        ),

      scriptureFoundation:
        spiritual.scriptures.join(
          "\n"
        ),

      audience: "",

      genre: story.genre,

      tone: "",

      language:
        cultural.languages[0] ??
        "English",
    },

    screenplay: {
      imported: true,

      source:
        input.source ?? "txt",

      title:
        input.screenplayTitle ||
        story.title,

      acts: story.acts,

      scenes:
        scenes.length ||
        story.scenes,

      pages:
        input.pages ?? 0,

      status: "imported",
    },

    characters:
      characters.map(
        (character, index) => ({
          id: `imported-character-${index + 1}`,

          name: character.name,

          role: character.role,

          summary:
            character.description,

          arc: "",
        })
      ),

    locations: [],

    scenes:
      scenes.map(
        (scene, index) => ({
          id: `imported-scene-${index + 1}`,

          number: scene.number,

          heading: scene.heading,

          summary: scene.summary,

          characters: [],

          locationId: "",
        })
      ),

    assets: [],

    director: {
      notes: "",

      productionGoals:
        spiritual.ministryObjectives.join(
          "\n"
        ),

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