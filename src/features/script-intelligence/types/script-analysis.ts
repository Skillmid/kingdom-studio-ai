export interface ScriptAnalysis {
  screenplay: ScreenplayAnalysis;

  story: StoryAnalysis;

  characters: CharacterAnalysis[];

  scenes: SceneAnalysis[];

  dialogue: DialogueAnalysis;

  spirituality: SpiritualAnalysis;

  culture: CulturalAnalysis;

  production: ProductionAnalysis;
}

export interface ScreenplayAnalysis {
  title: string;

  pages: number;

  acts: number;

  scenes: number;

  format: string;
}

export interface StoryAnalysis {
  genre: string;

  theme: string;

  logline: string;

  synopsis: string;

  strengths: string[];

  weaknesses: string[];

  recommendations: string[];
}

export interface CharacterAnalysis {
  name: string;

  role: string;

  arc: string;

  consistency: number;

  notes: string[];
}

export interface SceneAnalysis {
  number: number;

  heading: string;

  purpose: string;

  notes: string[];
}

export interface DialogueAnalysis {
  score: number;

  strengths: string[];

  improvements: string[];
}

export interface SpiritualAnalysis {
  biblicalAlignment: number;

  kingdomMessage: string;

  scriptureReferences: string[];

  recommendations: string[];
}

export interface CulturalAnalysis {
  country: string;

  culture: string;

  language: string;

  authenticity: number;

  recommendations: string[];
}

export interface ProductionAnalysis {
  budget: string;

  complexity: string;

  risks: string[];

  recommendations: string[];
}