import { z } from "zod";

export const characterRoleSchema = z.enum([
  "lead",
  "supporting",
  "minor",
  "extra",
]);

export const characterStatusSchema = z.enum([
  "draft",
  "in-progress",
  "completed",
]);

export const characterSchema = z.object({
  id: z.string().uuid().optional(),

  productionId: z
    .string()
    .uuid({
      message: "Production ID is required.",
    }),

  name: z
    .string()
    .trim()
    .min(2, {
      message: "Character name must contain at least 2 characters.",
    })
    .max(100),

  role: characterRoleSchema,

  status: characterStatusSchema.default("draft"),

  age: z.string().optional(),

  gender: z.string().optional(),

  occupation: z.string().optional(),

  nationality: z.string().optional(),

  ethnicity: z.string().optional(),

  biography: z.string().optional(),

  appearance: z.string().optional(),

  height: z.string().optional(),

  weight: z.string().optional(),

  eyeColor: z.string().optional(),

  hairColor: z.string().optional(),

  distinguishingFeatures: z.string().optional(),

  personality: z.string().optional(),

  strengths: z.string().optional(),

  weaknesses: z.string().optional(),

  fears: z.string().optional(),

  habits: z.string().optional(),

  values: z.string().optional(),

  motivation: z.string().optional(),

  goal: z.string().optional(),

  conflict: z.string().optional(),

  characterArc: z.string().optional(),

  spiritualJourney: z.string().optional(),

  speechStyle: z.string().optional(),

  catchPhrases: z.string().optional(),

  aiInstructions: z.string().optional(),

  progress: z.number().min(0).max(100).default(0),
});

export type CharacterFormData = z.infer<typeof characterSchema>;