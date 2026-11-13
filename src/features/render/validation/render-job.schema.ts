import { z } from "zod";

export const renderClipSourceKindSchema = z.enum(["shot", "panel", "asset", "scene", "user"]);

export const videoClipInputSchema = z.object({
  sequenceNumber: z.number().int().min(1),
  title: z.string().optional(),
  mediaUrl: z.string().optional(),
  durationSeconds: z.number().positive(),
  sourceKind: renderClipSourceKindSchema,
  sourceId: z.string().optional(),
  uncertaintyNotes: z.string().optional(),
});

export const videoRenderConfigSchema = z.object({
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  fps: z.number().int().positive().optional(),
  videoCodec: z.string().optional(),
  audioCodec: z.string().optional(),
  ffmpegPath: z.string().optional(),
  timeoutMs: z.number().int().positive().optional(),
});

export const createVideoRenderJobSchema = z.object({
  productionId: z.string().uuid("Invalid production ID format"),
  renderId: z.string().uuid("Invalid render sequence ID format"),
});

export const cancelVideoRenderJobSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type CreateVideoRenderJobDTO = z.infer<typeof createVideoRenderJobSchema>;
export type CancelVideoRenderJobDTO = z.infer<typeof cancelVideoRenderJobSchema>;
