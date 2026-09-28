import type { Asset, AssetKind, AssetProvenance, AssetSourceKind, AssetStatus } from "../types/asset";
import type {
  GenerationJob,
  GenerationJobStatus,
  GenerationJobType,
  GenerationSourceEntityType,
} from "../types/generation-job";

export type AssetWriteRow = {
  production_id?: string;
  scene_id?: string | null;
  shot_id?: string | null;
  panel_id?: string | null;
  character_id?: string | null;
  location_id?: string | null;
  director_note_id?: string | null;
  kind?: AssetKind;
  title?: string | null;
  description?: string | null;
  prompt?: string | null;
  file_url?: string | null;
  mime_type?: string | null;
  source_kind?: AssetSourceKind;
  source_id?: string | null;
  uncertainty_notes?: string | null;
  source_evidence?: string | null;
  provenance?: AssetProvenance;
  user_approved?: boolean;
  status?: AssetStatus;
  progress?: number;
};

export type JobWriteRow = {
  production_id?: string;
  asset_id?: string | null;
  job_type?: GenerationJobType;
  status?: GenerationJobStatus;
  provider?: string | null;
  model?: string | null;
  prompt?: string | null;
  parameters?: Record<string, unknown>;
  source_entity_type?: GenerationSourceEntityType | null;
  source_entity_id?: string | null;
  output_url?: string | null;
  error_message?: string | null;
  attempt_count?: number;
  started_at?: string | null;
  completed_at?: string | null;
};

function compactRow<T extends Record<string, unknown>>(row: T): T {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined)) as T;
}

export function toAssetDatabase(asset: Partial<Asset>, options: { includeDefaults?: boolean } = {}): AssetWriteRow {
  const includeDefaults = options.includeDefaults ?? false;
  return compactRow({
    production_id: asset.productionId,
    scene_id: asset.sceneId,
    shot_id: asset.shotId,
    panel_id: asset.panelId,
    character_id: asset.characterId,
    location_id: asset.locationId,
    director_note_id: asset.directorNoteId,
    kind: asset.kind,
    title: asset.title,
    description: asset.description,
    prompt: asset.prompt,
    file_url: asset.fileUrl,
    mime_type: asset.mimeType,
    source_kind: asset.sourceKind ?? (includeDefaults ? "user" : undefined),
    source_id: asset.sourceId,
    uncertainty_notes: asset.uncertaintyNotes,
    source_evidence: asset.sourceEvidence,
    provenance: asset.provenance ?? (includeDefaults ? "user" : undefined),
    user_approved: asset.userApproved ?? (includeDefaults ? false : undefined),
    status: asset.status ?? (includeDefaults ? "draft" : undefined),
    progress: asset.progress ?? (includeDefaults ? 0 : undefined),
  });
}

export function toGenerationJobDatabase(
  job: Partial<GenerationJob>,
  options: { includeDefaults?: boolean } = {},
): JobWriteRow {
  const includeDefaults = options.includeDefaults ?? false;
  return compactRow({
    production_id: job.productionId,
    asset_id: job.assetId,
    job_type: job.jobType,
    status: job.status ?? (includeDefaults ? "queued" : undefined),
    provider: job.provider,
    model: job.model,
    prompt: job.prompt,
    parameters: job.parameters ?? (includeDefaults ? {} : undefined),
    source_entity_type: job.sourceEntityType,
    source_entity_id: job.sourceEntityId,
    output_url: job.outputUrl,
    error_message: job.errorMessage,
    attempt_count: job.attemptCount ?? (includeDefaults ? 0 : undefined),
    started_at: job.startedAt,
    completed_at: job.completedAt,
  });
}
