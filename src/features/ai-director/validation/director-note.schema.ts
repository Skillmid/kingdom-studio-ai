import { z } from "zod";

export const directorNoteStatusSchema = z.enum(["draft", "in-progress", "completed"]);
export const directorNoteProvenanceSchema = z.enum(["user", "production-derived", "ai-proposal"]);

const optionalText = z.string().trim().max(50000).optional();

export const directorNoteSchema = z.object({
  id: z.string().uuid().optional(),
  productionId: z.string().uuid({ message: "Production ID is required." }),
  sceneId: z.string().uuid().optional(),
  shotId: z.string().uuid().optional(),
  panelId: z.string().uuid().optional(),
  noteNumber: z.number().int().min(1, { message: "Note number must be at least 1." }),
  title: z.string().trim().max(255).optional(),
  sceneIntent: optionalText,
  blocking: optionalText,
  camera: optionalText,
  composition: optionalText,
  lighting: optionalText,
  pacing: optionalText,
  sound: optionalText,
  emotion: optionalText,
  continuity: optionalText,
  uncertaintyNotes: optionalText,
  sourceEvidence: optionalText,
  characterIds: z.array(z.string().uuid()).default([]),
  locationId: z.string().uuid().optional(),
  provenance: directorNoteProvenanceSchema.default("user"),
  userApproved: z.boolean().default(false),
  status: directorNoteStatusSchema.default("draft"),
  progress: z.number().int().min(0).max(100).default(0),
});

export type DirectorNoteFormData = z.infer<typeof directorNoteSchema>;
