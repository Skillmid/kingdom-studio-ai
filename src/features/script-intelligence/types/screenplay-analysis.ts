export type ScreenplayCharacterKind = "named" | "role" | "unknown";

export interface ScreenplayEvidence {
  sceneNumber?: number;
  text: string;
}

export interface AnalyzedCharacter {
  name: string;
  kind: ScreenplayCharacterKind;
  speaks: boolean;
  dialogueCount: number;
  introduction?: string;
  evidence: ScreenplayEvidence[];
}

export interface AnalyzedLocation {
  name: string;
  setting: "interior" | "exterior" | "both";
  sourceHeading: string;
  sceneNumbers: number[];
}

export interface AnalyzedDialogueBeat {
  character: string;
  parenthetical?: string;
  dialogue: string;
}

export interface AnalyzedScene {
  number: number;
  heading: string;
  sceneType: "INT" | "EXT" | "BOTH";
  locationName: string;
  timeOfDay?: string;
  action: string[];
  dialogue: AnalyzedDialogueBeat[];
  characterNames: string[];
  sourceText: string;
}

export interface StoryBibleReview {
  facts: string[];
  interpretations: string[];
  uncertainties: string[];
}

export interface AnalyzedStoryBible {
  title?: string;
  logline?: string;
  synopsis?: string;
  burden?: string;
  truth?: string;
  human_problem?: string;
  theme?: string;
  core_message?: string;
  scripture_foundation?: string;
  kingdom_objective?: string;
  target_audience?: string;
  genre?: string;
  tone?: string;
  language?: string;
  visual_style?: string;
  aspect_ratio?: string;
  duration_minutes?: number;
  universe?: string;
  time_period?: string;
  primary_location?: string;
  beginning?: string;
  conflict?: string;
  midpoint?: string;
  climax?: string;
  ending?: string;
  ai_context?: string;
  ai_rules?: string;
  forbidden_elements?: string;
  preferred_vocabulary?: string;
  visual_consistency?: string;
}

export interface ScreenplayAnalysis {
  schemaVersion: 1;
  title?: string;
  logline?: string;
  storyBible: AnalyzedStoryBible;
  storyBibleReview: StoryBibleReview;
  characters: AnalyzedCharacter[];
  locations: AnalyzedLocation[];
  scenes: AnalyzedScene[];
}
