import { z } from "zod";

export const generationJobStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

export const generationJobTypeSchema = z.enum(["image", "video", "audio", "music", "document"]);

const optionalText = z.string().trim().max(50000).optional();

export const generationJobSchema = z.object({
  id: z.string().uuid().optional(),
  productionId: z.string().uuid({ message: "Production ID is required." }),
  assetId: z.string().uuid().optional(),
  sceneId: z.string().uuid().optional(),
  shotId: z.string().uuid().optional(),
  panelId: z.string().uuid().optional(),
  characterId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  jobType: generationJobTypeSchema.default("image"),
  provider: z.string().trim().max(120).optional(),
  model: z.string().trim().max(255).optional(),
  prompt: optionalText,
  parameters: z.record(z.string(), z.unknown()).default({}),
  status: generationJobStatusSchema.default("queued"),
  outputUrl: z.string().trim().max(2000).optional(),
  outputAssetId: z.string().uuid().optional(),
  errorMessage: optionalText,
  externalJobId: z.string().trim().max(255).optional(),
  attemptCount: z.number().int().min(0).default(0),
});

export type GenerationJobFormData = z.infer<typeof generationJobSchema>;
