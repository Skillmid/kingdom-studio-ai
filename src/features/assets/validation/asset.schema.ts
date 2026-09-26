import { z } from "zod";

export const assetKindSchema = z.enum([
  "character-reference",
  "location-reference",
  "prop",
  "costume",
  "image",
  "video",
  "audio",
  "music",
  "document",
  "other",
]);
export const assetSourceKindSchema = z.enum([
  "character",
  "location",
  "scene",
  "shot",
  "panel",
  "director-note",
  "user",
]);
export const assetProvenanceSchema = z.enum(["user", "production-derived", "generated"]);
export const assetStatusSchema = z.enum(["draft", "ready", "generating", "failed"]);

const optionalText = z.string().trim().max(50000).optional();

export const assetSchema = z.object({
  id: z.string().uuid().optional(),
  productionId: z.string().uuid({ message: "Production ID is required." }),
  sceneId: z.string().uuid().optional(),
  shotId: z.string().uuid().optional(),
  panelId: z.string().uuid().optional(),
  characterId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  directorNoteId: z.string().uuid().optional(),
  kind: assetKindSchema,
  title: z.string().trim().max(255).optional(),
  description: optionalText,
  prompt: optionalText,
  fileUrl: z.string().trim().max(2000).optional(),
  mimeType: z.string().trim().max(255).optional(),
  sourceKind: assetSourceKindSchema.default("user"),
  sourceId: z.string().uuid().optional(),
  uncertaintyNotes: optionalText,
  sourceEvidence: optionalText,
  provenance: assetProvenanceSchema.default("user"),
  userApproved: z.boolean().default(false),
  status: assetStatusSchema.default("draft"),
  progress: z.number().int().min(0).max(100).default(0),
});

export type AssetFormData = z.infer<typeof assetSchema>;
