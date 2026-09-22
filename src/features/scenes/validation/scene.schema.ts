import { z } from "zod";

export const sceneStatusSchema = z.enum(["draft", "in-progress", "completed"]);
export const sceneTypeSchema = z.enum(["INT", "EXT", "BOTH"]);

const optionalText = z.string().trim().max(50000).optional();

export const sceneSchema = z.object({
  id: z.string().uuid().optional(),
  productionId: z.string().uuid({ message: "Production ID is required." }),
  number: z.number().int().min(1, { message: "Scene number must be at least 1." }),
  heading: z.string().trim().min(2, { message: "Scene heading must contain at least 2 characters." }).max(255),
  sceneType: sceneTypeSchema.default("INT"),
  timeOfDay: z.string().trim().max(120).optional(),
  summary: optionalText,
  action: optionalText,
  dialogue: optionalText,
  characterIds: z.array(z.string().uuid()).default([]),
  locationId: z.string().uuid().optional(),
  purpose: optionalText,
  emotionalBeat: optionalText,
  storyBeat: optionalText,
  visualDirection: optionalText,
  props: z.array(z.string().trim().min(1).max(500)).default([]),
  wardrobe: optionalText,
  soundNotes: optionalText,
  continuityNotes: optionalText,
  vfxNotes: optionalText,
  productionNotes: optionalText,
  aiPrompt: optionalText,
  sourceText: optionalText,
  estimatedDurationSeconds: z.number().int().min(0).optional(),
  status: sceneStatusSchema.default("draft"),
  progress: z.number().int().min(0).max(100).default(0),
});

export type SceneFormData = z.infer<typeof sceneSchema>;
