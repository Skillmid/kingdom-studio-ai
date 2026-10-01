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
  cameraDirection?: string;
  mood?: string;
  musicNotes?: string;
  props: string[];
  wardrobe?: string;
  soundNotes?: string;
  continuityNotes?: string;
  vfxNotes?: string;
  productionNotes?: string;
  aiPrompt?: string;
  videoPrompt?: string;
  sourceText?: string;
  sourceScreenplayId?: string;
  sourceRevisionId?: string;
  sourceScreenplayVersion?: number;
  estimatedDurationSeconds?: number;
  status: SceneStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export type SceneCreateInput = Pick<Scene, "productionId" | "number" | "heading">
  & Partial<Omit<Scene, "id" | "productionId" | "number" | "heading" | "createdAt" | "updatedAt">>;

export type SceneUpdateInput = Partial<Omit<
  Scene,
  | "id"
  | "productionId"
  | "createdAt"
  | "updatedAt"
  | "sourceText"
  | "sourceScreenplayId"
  | "sourceRevisionId"
  | "sourceScreenplayVersion"
>>;
