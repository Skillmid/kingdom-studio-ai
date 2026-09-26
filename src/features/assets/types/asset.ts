export type AssetStatus = "draft" | "in-progress" | "completed";
export type AssetProvenance = "user" | "production-derived" | "ai-proposal";

export type AssetType =
  | "character-reference"
  | "location-reference"
  | "storyboard-still"
  | "shot-plate"
  | "prop"
  | "costume"
  | "generated-image"
  | "generated-video"
  | "audio"
  | "music"
  | "document"
  | "other";

export interface Asset {
  id: string;
  productionId: string;
  sceneId?: string;
  shotId?: string;
  panelId?: string;
  characterId?: string;
  locationId?: string;
  assetNumber: number;
  title?: string;
  assetType: AssetType;
  description?: string;
  generationPrompt?: string;
  fileUrl?: string;
  mimeType?: string;
  sourceEvidence?: string;
  continuityNotes?: string;
  characterIds: string[];
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
  assetNumber: number;
  title?: string;
  assetType: AssetType;
  description?: string;
  generationPrompt?: string;
  fileUrl?: string;
  mimeType?: string;
  sourceEvidence?: string;
  continuityNotes?: string;
  characterIds: string[];
  provenance: AssetProvenance;
  userApproved: boolean;
  status: AssetStatus;
  progress: number;
}
