export type StoryboardStatus = "draft" | "in-progress" | "completed";
export type StoryboardProvenance = "user" | "shot-derived" | "ai-proposal";

export interface StoryboardPanel {
  id: string;
  productionId: string;
  sceneId?: string;
  shotId?: string;
  panelNumber: number;
  title?: string;
  visualDescription?: string;
  composition?: string;
  continuityNotes?: string;
  generationPrompt?: string;
  imageUrl?: string;
  sourceEvidence?: string;
  characterIds: string[];
  locationId?: string;
  provenance: StoryboardProvenance;
  userApproved: boolean;
  status: StoryboardStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoryboardPanelProposal {
  productionId: string;
  sceneId?: string;
  shotId?: string;
  panelNumber: number;
  title?: string;
  visualDescription?: string;
  composition?: string;
  continuityNotes?: string;
  generationPrompt?: string;
  imageUrl?: string;
  sourceEvidence?: string;
  characterIds: string[];
  locationId?: string;
  provenance: StoryboardProvenance;
  userApproved: boolean;
  status: StoryboardStatus;
  progress: number;
}
