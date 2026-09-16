export type SceneStatus = "draft" | "in-progress" | "completed";

export interface Scene {
  id: string;
  productionId: string;
  number: number;
  heading: string;
  summary?: string;
  characterIds: string[];
  locationId?: string;
  status: SceneStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
}
