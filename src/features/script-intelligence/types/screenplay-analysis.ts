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

export interface ScreenplayAnalysis {
  schemaVersion: 1;
  title?: string;
  logline?: string;
  characters: AnalyzedCharacter[];
  locations: AnalyzedLocation[];
  scenes: AnalyzedScene[];
}
