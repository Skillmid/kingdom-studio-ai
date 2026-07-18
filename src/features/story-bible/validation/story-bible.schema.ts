import { z } from "zod";

export const storyBibleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must contain at least 3 characters.")
    .max(200),

  logline: z
    .string()
    .trim()
    .max(500)
    .nullable(),

  synopsis: z
    .string()
    .trim()
    .max(5000)
    .nullable(),

  theme: z
    .string()
    .trim()
    .max(200)
    .nullable(),

  core_message: z
    .string()
    .trim()
    .max(1000)
    .nullable(),

  scripture_foundation: z
    .string()
    .trim()
    .max(1000)
    .nullable(),

  kingdom_objective: z
    .string()
    .trim()
    .max(1000)
    .nullable(),

  target_audience: z
    .string()
    .trim()
    .max(300)
    .nullable(),

  genre: z
    .string()
    .trim()
    .max(100)
    .nullable(),

  tone: z
    .string()
    .trim()
    .max(100)
    .nullable(),

  language: z
    .string()
    .trim()
    .min(2)
    .max(50),

  visual_style: z
    .string()
    .trim()
    .max(300)
    .nullable(),

  aspect_ratio: z
    .string()
    .trim()
    .min(2)
    .max(20),

  duration_minutes: z
    .number()
    .int()
    .positive(),

  universe: z
    .string()
    .trim()
    .max(300)
    .nullable(),

  time_period: z
    .string()
    .trim()
    .max(300)
    .nullable(),

  primary_location: z
    .string()
    .trim()
    .max(300)
    .nullable(),

  beginning: z
    .string()
    .trim()
    .max(5000)
    .nullable(),

  conflict: z
    .string()
    .trim()
    .max(5000)
    .nullable(),

  midpoint: z
    .string()
    .trim()
    .max(5000)
    .nullable(),

  climax: z
    .string()
    .trim()
    .max(5000)
    .nullable(),

  ending: z
    .string()
    .trim()
    .max(5000)
    .nullable(),

  ai_context: z
    .string()
    .trim()
    .max(8000)
    .nullable(),

  ai_rules: z
    .string()
    .trim()
    .max(4000)
    .nullable(),

  forbidden_elements: z
    .string()
    .trim()
    .max(4000)
    .nullable(),

  preferred_vocabulary: z
    .string()
    .trim()
    .max(3000)
    .nullable(),

  visual_consistency: z
    .string()
    .trim()
    .max(4000)
    .nullable(),
});

export type StoryBibleDTO =
  z.infer<typeof storyBibleSchema>;