import type { SceneStatus } from "@/features/scenes/types/scene";

export interface ProposedScene {
  clientId: string;
  number: number;
  heading: string;
  summary: string;
  status: SceneStatus;
  progress: number;
  selected: boolean;
}
