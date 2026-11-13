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

export type AssetRow = {
  id: string;
  production_id: string;
  scene_id: string | null;
  shot_id: string | null;
  panel_id: string | null;
  character_id: string | null;
  location_id: string | null;
  director_note_id: string | null;
  kind: AssetKind;
  title: string | null;
  description: string | null;
  prompt: string | null;
  file_url: string | null;
  mime_type: string | null;
  source_kind: AssetSourceKind;
  source_id: string | null;
  uncertainty_notes: string | null;
  source_evidence: string | null;
  provenance: AssetProvenance;
  user_approved: boolean | null;
  status: AssetStatus;
  progress: number | null;
  created_at: string;
  updated_at: string;
};

export type GenerationJobRow = {
  id: string;
  production_id: string;
  asset_id: string | null;
  job_type: GenerationJobType;
  status: GenerationJobStatus;
  provider: string | null;
  model: string | null;
  prompt: string | null;
  parameters: Record<string, unknown> | null;
  source_entity_type: GenerationSourceEntityType | null;
  source_entity_id: string | null;
  output_url: string | null;
  error_message: string | null;
  attempt_count: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export function fromAssetRow(data: AssetRow): Asset {
  return {
    id: data.id,
    productionId: data.production_id,
    sceneId: data.scene_id ?? undefined,
    shotId: data.shot_id ?? undefined,
    panelId: data.panel_id ?? undefined,
    characterId: data.character_id ?? undefined,
    locationId: data.location_id ?? undefined,
    directorNoteId: data.director_note_id ?? undefined,
    kind: data.kind,
    title: data.title ?? undefined,
    description: data.description ?? undefined,
    prompt: data.prompt ?? undefined,
    fileUrl: data.file_url ?? undefined,
    mimeType: data.mime_type ?? undefined,
    sourceKind: data.source_kind,
    sourceId: data.source_id ?? undefined,
    uncertaintyNotes: data.uncertainty_notes ?? undefined,
    sourceEvidence: data.source_evidence ?? undefined,
    provenance: data.provenance,
    userApproved: Boolean(data.user_approved),
    status: data.status,
    progress: data.progress ?? 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export function fromGenerationJobRow(data: GenerationJobRow): GenerationJob {
  return {
    id: data.id,
    productionId: data.production_id,
    assetId: data.asset_id ?? undefined,
    jobType: data.job_type,
    status: data.status,
    provider: data.provider ?? undefined,
    model: data.model ?? undefined,
    prompt: data.prompt ?? undefined,
    parameters: data.parameters ?? {},
    sourceEntityType: data.source_entity_type ?? undefined,
    sourceEntityId: data.source_entity_id ?? undefined,
    outputUrl: data.output_url ?? undefined,
    errorMessage: data.error_message ?? undefined,
    attemptCount: data.attempt_count ?? 0,
    startedAt: data.started_at ?? undefined,
    completedAt: data.completed_at ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Full result patch for a dispatched job. Unlike toGenerationJobDatabase it writes explicit
 * nulls so stale error/output values from a previous attempt are cleared.
 */
export function toJobResultDatabase(job: GenerationJob) {
  return {
    status: job.status,
    provider: job.provider ?? null,
    model: job.model ?? null,
    parameters: job.parameters ?? {},
    output_url: job.outputUrl ?? null,
    error_message: job.errorMessage ?? null,
    attempt_count: job.attemptCount,
    started_at: job.startedAt ?? null,
    completed_at: job.completedAt ?? null,
  };
}

/**
 * Asset patch for server-side generation updates. Keys present in the patch with an undefined
 * value are written as null so stale notes/URLs are actually cleared.
 */
export function toAssetPatchDatabase(
  patch: Partial<Pick<Asset, "fileUrl" | "status" | "uncertaintyNotes" | "provenance" | "progress">>,
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if ("fileUrl" in patch) row.file_url = patch.fileUrl ?? null;
  if ("uncertaintyNotes" in patch) row.uncertainty_notes = patch.uncertaintyNotes ?? null;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.provenance !== undefined) row.provenance = patch.provenance;
  if (patch.progress !== undefined) row.progress = patch.progress;
  return row;
}
