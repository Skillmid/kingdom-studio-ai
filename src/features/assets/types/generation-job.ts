export type GenerationJobType = "image" | "video" | "audio" | "document";
export type GenerationJobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type GenerationSourceEntityType =
  | "asset"
  | "character"
  | "location"
  | "scene"
  | "shot"
  | "panel"
  | "director-note";

export interface GenerationJob {
  id: string;
  productionId: string;
  assetId?: string;
  jobType: GenerationJobType;
  status: GenerationJobStatus;
  provider?: string;
  model?: string;
  prompt?: string;
  parameters: Record<string, unknown>;
  sourceEntityType?: GenerationSourceEntityType;
  sourceEntityId?: string;
  outputUrl?: string;
  errorMessage?: string;
  attemptCount: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationJobDraft {
  productionId: string;
  assetId?: string;
  jobType: GenerationJobType;
  status?: GenerationJobStatus;
  provider?: string;
  model?: string;
  prompt?: string;
  parameters?: Record<string, unknown>;
  sourceEntityType?: GenerationSourceEntityType;
  sourceEntityId?: string;
}
