export type ShotStatus = "draft" | "in-progress" | "completed";

export type ShotType =
  | "establishing"
  | "wide"
  | "full"
  | "medium"
  | "close-up"
  | "extreme-close-up"
  | "over-shoulder"
  | "pov"
  | "insert"
  | "two-shot"
  | "group"
  | "cutaway"
  | "aerial"
  | "tracking";

export type ShotFraming = "EWS" | "WS" | "FS" | "MS" | "MCU" | "CU" | "ECU" | "OTS" | "POV";

export type CameraAngle =
  | "eye-level"
  | "high"
  | "low"
  | "dutch"
  | "birds-eye"
  | "worms-eye";

export type CameraMovement =
  | "static"
  | "pan"
  | "tilt"
  | "dolly"
  | "track"
  | "crane"
  | "handheld"
  | "steadicam"
  | "zoom"
  | "rack-focus";

export type ShotProvenance = "user" | "scene-derived" | "ai-proposal";

export interface Shot {
  id: string;
  productionId: string;
  sceneId?: string;
  shotNumber: number;
  shotCode?: string;
  shotType: ShotType;
  framing: ShotFraming;
  cameraAngle?: CameraAngle;
  cameraMovement?: CameraMovement;
  lens?: string;
  subject?: string;
  action?: string;
  dialogueReference?: string;
  visualDescription?: string;
  continuityNotes?: string;
  generationPrompt?: string;
  sourceEvidence?: string;
  characterIds: string[];
  locationId?: string;
  estimatedDurationSeconds?: number;
  provenance: ShotProvenance;
  userApproved: boolean;
  status: ShotStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShotProposal {
  productionId: string;
  sceneId?: string;
  sceneNumber?: number;
  shotNumber: number;
  shotCode?: string;
  shotType: ShotType;
  framing: ShotFraming;
  cameraAngle?: CameraAngle;
  cameraMovement?: CameraMovement;
  lens?: string;
  subject?: string;
  action?: string;
  dialogueReference?: string;
  visualDescription?: string;
  continuityNotes?: string;
  generationPrompt?: string;
  sourceEvidence?: string;
  characterIds: string[];
  locationId?: string;
  estimatedDurationSeconds?: number;
  provenance: ShotProvenance;
  userApproved: boolean;
  status: ShotStatus;
  progress: number;
}
