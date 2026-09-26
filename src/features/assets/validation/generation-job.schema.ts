import { z } from "zod";

export const generationJobTypeSchema = z.enum(["image", "video", "audio", "document"]);
export const generationJobStatusSchema = z.enum(["queued", "running", "completed", "failed", "cancelled"]);
export const generationSourceEntityTypeSchema = z.enum([
  "asset",
  "character",
  "location",
  "scene",
  "shot",
  "panel",
  "director-note",
]);

const optionalText = z.string().trim().max(50000).optional();

export const generationJobSchema = z.object({
  id: z.string().uuid().optional(),
  productionId: z.string().uuid({ message: "Production ID is required." }),
  assetId: z.string().uuid().optional(),
  jobType: generationJobTypeSchema,
  status: generationJobStatusSchema.default("queued"),
  provider: z.string().trim().max(100).optional(),
  model: z.string().trim().max(200).optional(),
  prompt: optionalText,
  parameters: z.record(z.string(), z.unknown()).default({}),
  sourceEntityType: generationSourceEntityTypeSchema.optional(),
  sourceEntityId: z.string().uuid().optional(),
  outputUrl: z.string().trim().max(2000).optional(),
  errorMessage: optionalText,
  attemptCount: z.number().int().min(0).default(0),
});

export type GenerationJobFormData = z.infer<typeof generationJobSchema>;
