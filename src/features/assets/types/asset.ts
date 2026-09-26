export type AssetKind =
  | "character-reference"
  | "location-reference"
  | "prop"
  | "costume"
  | "image"
  | "video"
  | "audio"
  | "music"
  | "document"
  | "other";

export type AssetSourceKind = "character" | "location" | "scene" | "shot" | "panel" | "director-note" | "user";
export type AssetProvenance = "user" | "production-derived" | "generated";
export type AssetStatus = "draft" | "ready" | "generating" | "failed";

export interface Asset {
  id: string;
  productionId: string;
  sceneId?: string;
  shotId?: string;
  panelId?: string;
  characterId?: string;
  locationId?: string;
  directorNoteId?: string;
  kind: AssetKind;
  title?: string;
  description?: string;
  prompt?: string;
  fileUrl?: string;
  mimeType?: string;
  sourceKind: AssetSourceKind;
  sourceId?: string;
  uncertaintyNotes?: string;
  sourceEvidence?: string;
  provenance: AssetProvenance;
  userApproved: boolean;
  status: AssetStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssetProposal {
  productionId: string;
  sceneId?: string;
  shotId?: string;
  panelId?: string;
  characterId?: string;
  locationId?: string;
  directorNoteId?: string;
  kind: AssetKind;
  title?: string;
  description?: string;
  prompt?: string;
  fileUrl?: string;
  mimeType?: string;
  sourceKind: AssetSourceKind;
  sourceId?: string;
  uncertaintyNotes?: string;
  sourceEvidence?: string;
  provenance: AssetProvenance;
  userApproved: boolean;
  status: AssetStatus;
  progress: number;
}
