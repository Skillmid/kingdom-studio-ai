export type DirectorNoteStatus = "draft" | "in-progress" | "completed";
export type DirectorNoteProvenance = "user" | "production-derived" | "ai-proposal";

export interface DirectorNote {
  id: string;
  productionId: string;
  sceneId?: string;
  shotId?: string;
  noteNumber: number;
  title?: string;
  sceneIntent?: string;
  blocking?: string;
  camera?: string;
  composition?: string;
  lighting?: string;
  pacing?: string;
  sound?: string;
  emotionalProgression?: string;
  continuity?: string;
  visualStorytelling?: string;
  sourceEvidence?: string;
  characterIds: string[];
  locationId?: string;
  provenance: DirectorNoteProvenance;
  userApproved: boolean;
  status: DirectorNoteStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface DirectorNoteProposal {
  productionId: string;
  sceneId?: string;
  shotId?: string;
  noteNumber: number;
  title?: string;
  sceneIntent?: string;
  blocking?: string;
  camera?: string;
  composition?: string;
  lighting?: string;
  pacing?: string;
  sound?: string;
  emotionalProgression?: string;
  continuity?: string;
  visualStorytelling?: string;
  sourceEvidence?: string;
  characterIds: string[];
  locationId?: string;
  provenance: DirectorNoteProvenance;
  userApproved: boolean;
  status: DirectorNoteStatus;
  progress: number;
}
