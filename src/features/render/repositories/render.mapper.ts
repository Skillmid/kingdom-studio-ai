import type {
  ExportManifest,
  ExportPackage,
  RenderClip,
  RenderSequence,
} from "../types/render";

export type RenderSequenceRow = {
  id: string; production_id: string; title: string | null; status: RenderSequence["status"];
  progress: number | null; item_count: number | null; ready_item_count: number | null;
  missing_media_count: number | null; total_duration_seconds: number | null;
  uncertainty_notes: string | null; source_evidence: string | null; provenance: RenderSequence["provenance"];
  user_approved: boolean | null; created_at: string; updated_at: string;
};
export type RenderClipRow = {
  id: string; production_id: string; render_id: string; sequence_number: number;
  scene_id: string | null; shot_id: string | null; panel_id: string | null; asset_id: string | null;
  title: string | null; description: string | null; media_url: string | null; duration_seconds: number | null;
  source_kind: RenderClip["sourceKind"]; source_id: string | null; source_evidence: string | null;
  uncertainty_notes: string | null; provenance: RenderClip["provenance"]; user_approved: boolean | null;
  created_at: string; updated_at: string;
};
export type ExportPackageRow = {
  id: string; production_id: string; render_id: string | null; format: ExportPackage["format"];
  title: string | null; status: ExportPackage["status"]; package_url: string | null;
  manifest: ExportManifest; serialized_package: string; uncertainty_notes: string | null;
  provenance: ExportPackage["provenance"]; user_approved: boolean | null; created_at: string; updated_at: string;
};

function compact<T extends Record<string, unknown>>(row: T): T {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined)) as T;
}

export function toRenderSequenceDatabase(sequence: Partial<RenderSequence>, defaults = false) {
  return compact({
    production_id: sequence.productionId, title: sequence.title,
    status: sequence.status ?? (defaults ? "draft" : undefined),
    progress: sequence.progress ?? (defaults ? 0 : undefined),
    item_count: sequence.itemCount ?? (defaults ? 0 : undefined),
    ready_item_count: sequence.readyItemCount ?? (defaults ? 0 : undefined),
    missing_media_count: sequence.missingMediaCount ?? (defaults ? 0 : undefined),
    total_duration_seconds: sequence.totalDurationSeconds ?? (defaults ? 0 : undefined),
    uncertainty_notes: sequence.uncertaintyNotes, source_evidence: sequence.sourceEvidence,
    provenance: sequence.provenance ?? (defaults ? "user" : undefined),
    user_approved: sequence.userApproved ?? (defaults ? false : undefined),
  });
}

export function toRenderClipDatabase(clip: Partial<RenderClip>, defaults = false) {
  return compact({
    production_id: clip.productionId, render_id: clip.renderId, sequence_number: clip.sequenceNumber,
    scene_id: clip.sceneId, shot_id: clip.shotId, panel_id: clip.panelId, asset_id: clip.assetId,
    title: clip.title, description: clip.description, media_url: clip.mediaUrl,
    duration_seconds: clip.durationSeconds, source_kind: clip.sourceKind ?? (defaults ? "user" : undefined),
    source_id: clip.sourceId, source_evidence: clip.sourceEvidence, uncertainty_notes: clip.uncertaintyNotes,
    provenance: clip.provenance ?? (defaults ? "user" : undefined),
    user_approved: clip.userApproved ?? (defaults ? false : undefined),
  });
}

export function toExportPackageDatabase(item: Partial<ExportPackage>, defaults = false) {
  return compact({
    production_id: item.productionId, render_id: item.renderId,
    format: item.format ?? (defaults ? "delivery-manifest" : undefined), title: item.title,
    status: item.status ?? (defaults ? "draft" : undefined), package_url: item.packageUrl,
    manifest: item.manifest, serialized_package: item.serializedPackage,
    uncertainty_notes: item.uncertaintyNotes,
    provenance: item.provenance ?? (defaults ? "user" : undefined),
    user_approved: item.userApproved ?? (defaults ? false : undefined),
  });
}

export function fromRenderSequenceDatabase(row: RenderSequenceRow): RenderSequence {
  return {
    id: row.id, productionId: row.production_id, title: row.title ?? undefined, status: row.status,
    progress: row.progress ?? 0, itemCount: row.item_count ?? 0, readyItemCount: row.ready_item_count ?? 0,
    missingMediaCount: row.missing_media_count ?? 0, totalDurationSeconds: row.total_duration_seconds ?? 0,
    uncertaintyNotes: row.uncertainty_notes ?? undefined, sourceEvidence: row.source_evidence ?? undefined,
    provenance: row.provenance, userApproved: Boolean(row.user_approved), createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export function fromRenderClipDatabase(row: RenderClipRow): RenderClip {
  return {
    id: row.id, productionId: row.production_id, renderId: row.render_id, sequenceNumber: row.sequence_number,
    sceneId: row.scene_id ?? undefined, shotId: row.shot_id ?? undefined, panelId: row.panel_id ?? undefined,
    assetId: row.asset_id ?? undefined, title: row.title ?? undefined, description: row.description ?? undefined,
    mediaUrl: row.media_url ?? undefined, durationSeconds: row.duration_seconds ?? undefined,
    sourceKind: row.source_kind, sourceId: row.source_id ?? undefined, sourceEvidence: row.source_evidence ?? undefined,
    uncertaintyNotes: row.uncertainty_notes ?? undefined, provenance: row.provenance,
    userApproved: Boolean(row.user_approved), createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export function fromExportPackageDatabase(row: ExportPackageRow): ExportPackage {
  return {
    id: row.id, productionId: row.production_id, renderId: row.render_id ?? undefined, format: row.format,
    title: row.title ?? undefined, status: row.status, packageUrl: row.package_url ?? undefined,
    manifest: row.manifest, serializedPackage: row.serialized_package, uncertaintyNotes: row.uncertainty_notes ?? undefined,
    provenance: row.provenance, userApproved: Boolean(row.user_approved), createdAt: row.created_at, updatedAt: row.updated_at,
  };
}
