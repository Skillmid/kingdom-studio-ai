import type {
  AIMemory,
  AssetKnowledge,
  CharacterKnowledge,
  DirectorKnowledge,
  LocationKnowledge,
  ProductionKnowledge,
  SceneKnowledge,
  ScreenplayKnowledge,
  StoryBibleKnowledge,
} from "../types/production-knowledge";

export interface ProductionContext {
  system: string;

  production: {
    id: string;
    title: string;
  };

  storyBible: StoryBibleKnowledge;

  screenplay: ScreenplayKnowledge;

  characters: CharacterKnowledge[];

  locations: LocationKnowledge[];

  scenes: SceneKnowledge[];

  assets: AssetKnowledge[];

  director: DirectorKnowledge;

  memory: AIMemory;
}

export function buildProductionContext(
  knowledge: ProductionKnowledge
): ProductionContext {
  return {
    system:
      "Kingdom Studio AI Production Intelligence Engine",

    production: {
      id: knowledge.productionId,

      title: knowledge.storyBible.title,
    },

    storyBible: knowledge.storyBible,

    screenplay: knowledge.screenplay,

    characters: knowledge.characters,

    locations: knowledge.locations,

    scenes: knowledge.scenes,

    assets: knowledge.assets,

    director: knowledge.director,

    memory: knowledge.aiMemory,
  };
}