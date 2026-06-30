import { z } from "zod";

export const createProductionSchema = z.object({
  owner_id: z.string().uuid(),

  created_by: z.string().uuid(),

  title: z.string().min(3).max(120),

  slug: z.string(),

  logline: z.string().optional(),

  synopsis: z.string().optional(),

  genre: z.string().optional(),

  target_audience: z.string().optional(),

  art_style: z.string().optional(),

  language: z.string().default("English"),

  aspect_ratio: z.string().default("16:9"),

  target_duration_seconds: z.number().default(0),

  cover_image_url: z.string().optional(),

  status: z
    .enum([
      "concept",
      "writing",
      "pre-production",
      "production",
      "post-production",
      "released",
      "archived",
    ])
    .default("concept"),

  visibility: z
    .enum(["private", "team", "public"])
    .default("private"),
});

export type CreateProductionDTO =
  z.infer<typeof createProductionSchema>;