import { z } from "zod";

export const locationSettingSchema = z.enum([
  "interior",
  "exterior",
  "both",
]);

export const locationStatusSchema = z.enum([
  "draft",
  "in-progress",
  "completed",
]);

export const locationSchema = z.object({
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
      message: "Location name must contain at least 2 characters.",
    })
    .max(255),

  description: z.string().optional(),

  setting: locationSettingSchema.default("interior"),

  notes: z.string().optional(),

  status: locationStatusSchema.default("draft"),

  progress: z.number().int().min(0).max(100).default(0),
});

export type LocationFormData = z.infer<typeof locationSchema>;
