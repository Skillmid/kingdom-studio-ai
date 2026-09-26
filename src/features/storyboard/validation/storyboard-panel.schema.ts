import { z } from "zod";

export const storyboardStatusSchema = z.enum(["draft", "in-progress", "completed"]);
export const storyboardProvenanceSchema = z.enum(["user", "shot-derived", "ai-proposal"]);

const optionalText = z.string().trim().max(50000).optional();

export const storyboardPanelSchema = z.object({
  id: z.string().uuid().optional(),
  productionId: z.string().uuid({ message: "Production ID is required." }),
  sceneId: z.string().uuid().optional(),
  shotId: z.string().uuid().optional(),
  panelNumber: z.number().int().min(1, { message: "Panel number must be at least 1." }),
  title: z.string().trim().max(255).optional(),
  visualDescription: optionalText,
  composition: optionalText,
  continuityNotes: optionalText,
  generationPrompt: optionalText,
  imageUrl: z.string().trim().max(2000).optional(),
  sourceEvidence: optionalText,
  characterIds: z.array(z.string().uuid()).default([]),
  locationId: z.string().uuid().optional(),
  provenance: storyboardProvenanceSchema.default("user"),
  userApproved: z.boolean().default(false),
  status: storyboardStatusSchema.default("draft"),
  progress: z.number().int().min(0).max(100).default(0),
});

export type StoryboardPanelFormData = z.infer<typeof storyboardPanelSchema>;
