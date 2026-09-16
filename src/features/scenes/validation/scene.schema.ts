import { z } from "zod";

export const sceneStatusSchema = z.enum([
  "draft",
  "in-progress",
  "completed",
]);

export const sceneSchema = z.object({
  id: z.string().uuid().optional(),

  productionId: z
    .string()
    .uuid({
      message: "Production ID is required.",
    }),

  number: z
    .number()
    .int()
    .min(1, {
      message: "Scene number must be at least 1.",
    }),

  heading: z
    .string()
    .trim()
    .min(2, {
      message: "Scene heading must contain at least 2 characters.",
    })
    .max(255),

  summary: z.string().optional(),

  characterIds: z.array(z.string().uuid()).default([]),

  locationId: z.string().uuid().optional(),

  status: sceneStatusSchema.default("draft"),

  progress: z.number().int().min(0).max(100).default(0),
});

export type SceneFormData = z.infer<typeof sceneSchema>;
