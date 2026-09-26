import { z } from "zod";

export const assetStatusSchema = z.enum(["draft", "in-progress", "completed"]);
export const assetProvenanceSchema = z.enum(["user", "production-derived", "ai-proposal"]);
export const assetTypeSchema = z.enum([
  "character-reference",
  "location-reference",
  "storyboard-still",
  "shot-plate",
  "prop",
  "costume",
  "generated-image",
  "generated-video",
  "audio",
  "music",
  "document",
  "other",
]);

const optionalText = z.string().trim().max(50000).optional();

export const assetSchema = z.object({
  id: z.string().uuid().optional(),
  productionId: z.string().uuid({ message: "Production ID is required." }),
  sceneId: z.string().uuid().optional(),
  shotId: z.string().uuid().optional(),
  panelId: z.string().uuid().optional(),
  characterId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  assetNumber: z.number().int().min(1, { message: "Asset number must be at least 1." }),
  title: z.string().trim().max(255).optional(),
  assetType: assetTypeSchema.default("other"),
  description: optionalText,
  generationPrompt: optionalText,
  fileUrl: z.string().trim().max(2000).optional(),
  mimeType: z.string().trim().max(255).optional(),
  sourceEvidence: optionalText,
  continuityNotes: optionalText,
  characterIds: z.array(z.string().uuid()).default([]),
  provenance: assetProvenanceSchema.default("user"),
  userApproved: z.boolean().default(false),
  status: assetStatusSchema.default("draft"),
  progress: z.number().int().min(0).max(100).default(0),
});

export type AssetFormData = z.infer<typeof assetSchema>;
