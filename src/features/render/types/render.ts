export type RenderStatus = "draft" | "assembling" | "ready" | "failed";
export type RenderProvenance = "user" | "production-derived";
export type RenderClipSourceKind = "shot" | "panel" | "asset" | "scene" | "user";
export type ExportFormat = "edit-decision-list" | "delivery-manifest" | "preview-package";
export type ExportStatus = "draft" | "packaged" | "failed";

export interface RenderClip {
  id: string;
  productionId: string;
  renderId: string;
  sequenceNumber: number;
  sceneId?: string;
  shotId?: string;
  panelId?: string;
  assetId?: string;
  title?: string;
  description?: string;
  mediaUrl?: string;
  durationSeconds?: number;
  sourceKind: RenderClipSourceKind;
  sourceId?: string;
  sourceEvidence?: string;
  uncertaintyNotes?: string;
  provenance: RenderProvenance;
  userApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RenderClipProposal {
  productionId: string;
  renderId?: string;
  sequenceNumber: number;
  sceneId?: string;
  shotId?: string;
  panelId?: string;
  assetId?: string;
  title?: string;
  description?: string;
  mediaUrl?: string;
  durationSeconds?: number;
  sourceKind: RenderClipSourceKind;
  sourceId?: string;
  sourceEvidence?: string;
  uncertaintyNotes?: string;
  provenance: RenderProvenance;
  userApproved: boolean;
}

export interface RenderSequence {
  id: string;
  productionId: string;
  title?: string;
  status: RenderStatus;
  progress: number;
  itemCount: number;
  readyItemCount: number;
  missingMediaCount: number;
  totalDurationSeconds: number;
  uncertaintyNotes?: string;
  sourceEvidence?: string;
  provenance: RenderProvenance;
  userApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RenderSequenceProposal {
  productionId: string;
  title?: string;
  status: RenderStatus;
  progress: number;
  itemCount: number;
  readyItemCount: number;
  missingMediaCount: number;
  totalDurationSeconds: number;
  uncertaintyNotes?: string;
  sourceEvidence?: string;
  provenance: RenderProvenance;
  userApproved: boolean;
}

export interface ExportManifestClip {
  sequenceNumber: number;
  title?: string;
  durationSeconds?: number;
  mediaUrl?: string;
  sourceKind: RenderClipSourceKind;
  sourceId?: string;
  uncertaintyNotes?: string;
}

export interface ExportManifest {
  productionId: string;
  renderId?: string;
  title?: string;
  generatedAt: string;
  clipCount: number;
  readyClipCount: number;
  missingMediaCount: number;
  totalDurationSeconds: number;
  clips: ExportManifestClip[];
}

export interface ExportPackage {
  id: string;
  productionId: string;
  renderId?: string;
  format: ExportFormat;
  title?: string;
  status: ExportStatus;
  packageUrl?: string;
  manifest: ExportManifest;
  uncertaintyNotes?: string;
  provenance: RenderProvenance;
  userApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExportPackageProposal {
  productionId: string;
  renderId?: string;
  format: ExportFormat;
  title?: string;
  status: ExportStatus;
  packageUrl?: string;
  manifest: ExportManifest;
  uncertaintyNotes?: string;
  provenance: RenderProvenance;
  userApproved: boolean;
}
