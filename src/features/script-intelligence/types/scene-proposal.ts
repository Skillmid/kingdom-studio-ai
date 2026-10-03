import type { SceneStatus } from "@/features/scenes/types/scene";

export interface ProposedScene {
  clientId: string;
  number: number;
  heading: string;
  sceneType?: "INT" | "EXT" | "BOTH";
  timeOfDay?: string;
  summary: string;
  action?: string;
  dialogue?: string;
  sourceText?: string;
  status: SceneStatus;
  progress: number;
  selected: boolean;
  sourceScreenplayId: string;
  sourceRevisionId: string;
  sourceScreenplayVersion: number;
}
