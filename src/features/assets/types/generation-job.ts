export type GenerationJobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type GenerationJobType = "image" | "video" | "audio" | "music" | "document";

export interface GenerationJob {
  id: string;
  productionId: string;
  assetId?: string;
  sceneId?: string;
  shotId?: string;
  panelId?: string;
  characterId?: string;
  locationId?: string;
  jobType: GenerationJobType;
  provider?: string;
  model?: string;
  prompt?: string;
  parameters: Record<string, unknown>;
  status: GenerationJobStatus;
  outputUrl?: string;
  outputAssetId?: string;
  errorMessage?: string;
  externalJobId?: string;
  attemptCount: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationJobProposal {
  productionId: string;
  assetId?: string;
  sceneId?: string;
  shotId?: string;
  panelId?: string;
  characterId?: string;
  locationId?: string;
  jobType: GenerationJobType;
  provider?: string;
  model?: string;
  prompt?: string;
  parameters: Record<string, unknown>;
  status: GenerationJobStatus;
  outputUrl?: string;
  errorMessage?: string;
  attemptCount: number;
}
