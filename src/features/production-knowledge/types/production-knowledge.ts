export interface ProductionKnowledge {
  productionId: string;

  storyBible: StoryBibleKnowledge;

  screenplay: ScreenplayKnowledge;

  characters: CharacterKnowledge[];

  locations: LocationKnowledge[];

  scenes: SceneKnowledge[];

  assets: AssetKnowledge[];

  director: DirectorKnowledge;

  aiMemory: AIMemory;
}

export interface StoryBibleKnowledge {
  title: string;

  logline: string;

  synopsis: string;

  theme: string;

  kingdomVision: string;

  scriptureFoundation: string;

  audience: string;

  genre: string;

  tone: string;

  language: string;
}

export type ScreenplaySource =
  | "internal"
  | "pdf"
  | "fdx"
  | "docx"
  | "txt"
  | "fountain"
  | "markdown";

export interface ScreenplayKnowledge {
  imported: boolean;

  source: ScreenplaySource;

  title: string;

  acts: number;

  scenes: number;

  pages: number;

  status: string;
}

export interface CharacterKnowledge {
  id: string;

  name: string;

  role: string;

  summary: string;

  arc: string;
}

export interface LocationKnowledge {
  id: string;

  name: string;

  description: string;

  country: string;

  culture: string;
}

export interface SceneKnowledge {
  id: string;

  number: number;

  heading: string;

  summary: string;

  characters: string[];

  locationId: string;
}

export interface AssetKnowledge {
  id: string;

  type: string;

  title: string;

  status: string;
}

export interface DirectorKnowledge {
  notes: string;

  productionGoals: string;

  visualStyle: string;

  cameraStyle: string;
}

export interface AIMemory {
  conversations: string[];

  decisions: string[];

  generatedAssets: string[];

  revisions: string[];
}