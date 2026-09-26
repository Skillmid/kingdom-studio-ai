import { z } from "zod";

export const shotStatusSchema = z.enum(["draft", "in-progress", "completed"]);
export const shotTypeSchema = z.enum([
  "establishing",
  "wide",
  "full",
  "medium",
  "close-up",
  "extreme-close-up",
  "over-shoulder",
  "pov",
  "insert",
  "two-shot",
  "group",
  "cutaway",
  "aerial",
  "tracking",
]);
export const shotFramingSchema = z.enum(["EWS", "WS", "FS", "MS", "MCU", "CU", "ECU", "OTS", "POV"]);
export const cameraAngleSchema = z.enum([
  "eye-level",
  "high",
  "low",
  "dutch",
  "birds-eye",
  "worms-eye",
]);
export const cameraMovementSchema = z.enum([
  "static",
  "pan",
  "tilt",
  "dolly",
  "track",
  "crane",
  "handheld",
  "steadicam",
  "zoom",
  "rack-focus",
]);
export const shotProvenanceSchema = z.enum(["user", "scene-derived", "ai-proposal"]);

const optionalText = z.string().trim().max(50000).optional();

export const shotSchema = z.object({
  id: z.string().uuid().optional(),
  productionId: z.string().uuid({ message: "Production ID is required." }),
  sceneId: z.string().uuid().optional(),
  shotNumber: z.number().int().min(1, { message: "Shot number must be at least 1." }),
  shotCode: z.string().trim().max(40).optional(),
  shotType: shotTypeSchema.default("medium"),
  framing: shotFramingSchema.default("MS"),
  cameraAngle: cameraAngleSchema.optional(),
  cameraMovement: cameraMovementSchema.optional(),
  lens: z.string().trim().max(80).optional(),
  subject: optionalText,
  action: optionalText,
  dialogueReference: optionalText,
  visualDescription: optionalText,
  continuityNotes: optionalText,
  generationPrompt: optionalText,
  sourceEvidence: optionalText,
  characterIds: z.array(z.string().uuid()).default([]),
  locationId: z.string().uuid().optional(),
  estimatedDurationSeconds: z.number().int().min(0).optional(),
  provenance: shotProvenanceSchema.default("user"),
  userApproved: z.boolean().default(false),
  status: shotStatusSchema.default("draft"),
  progress: z.number().int().min(0).max(100).default(0),
});

export type ShotFormData = z.infer<typeof shotSchema>;
