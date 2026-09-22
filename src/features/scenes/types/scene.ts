export type SceneStatus = "draft" | "in-progress" | "completed";
export type SceneType = "INT" | "EXT" | "BOTH";

export interface Scene {
  id: string;
  productionId: string;
  number: number;
  heading: string;
  sceneType: SceneType;
  timeOfDay?: string;
  summary?: string;
  action?: string;
  dialogue?: string;
  characterIds: string[];
  locationId?: string;
  purpose?: string;
  emotionalBeat?: string;
  storyBeat?: string;
  visualDirection?: string;
  props: string[];
  wardrobe?: string;
  soundNotes?: string;
  continuityNotes?: string;
  vfxNotes?: string;
  productionNotes?: string;
  aiPrompt?: string;
  sourceText?: string;
  estimatedDurationSeconds?: number;
  status: SceneStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
}
