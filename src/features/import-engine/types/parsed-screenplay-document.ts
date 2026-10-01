export interface ParsedDialogue {
  character: string;
  text: string;
}

export interface ParsedScreenplayScene {
  number: number;
  heading: string;
  sceneType: "INT" | "EXT" | "BOTH";
  timeOfDay?: string;
  summary: string;
  action: string;
  dialogue: string;
  dialogues: ParsedDialogue[];
  sourceText: string;
  locationName?: string;
}

export interface ParsedScreenplayDocument {
  scenes: ParsedScreenplayScene[];
}