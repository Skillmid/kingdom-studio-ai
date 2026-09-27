import { z } from "zod";

export const renderStatusSchema = z.enum(["draft", "assembling", "ready", "failed"]);
export const renderProvenanceSchema = z.enum(["user", "production-derived"]);
export const renderClipSourceKindSchema = z.enum(["shot", "panel", "asset", "scene", "user"]);
export const exportFormatSchema = z.enum(["edit-decision-list", "delivery-manifest", "preview-package"]);
export const exportStatusSchema = z.enum(["draft", "packaged", "failed"]);

const optionalText = z.string().trim().max(50000).optional();

export const renderClipSchema = z.object({
  id: z.string().uuid().optional(),
  productionId: z.string().uuid({ message: "Production ID is required." }),
  renderId: z.string().uuid().optional(),
  sequenceNumber: z.number().int().min(1),
  sceneId: z.string().uuid().optional(),
  shotId: z.string().uuid().optional(),
  panelId: z.string().uuid().optional(),
  assetId: z.string().uuid().optional(),
  title: z.string().trim().max(255).optional(),
  description: optionalText,
  mediaUrl: z.string().trim().max(2000).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  sourceKind: renderClipSourceKindSchema.default("user"),
  sourceId: z.string().uuid().optional(),
  sourceEvidence: optionalText,
  uncertaintyNotes: optionalText,
  provenance: renderProvenanceSchema.default("user"),
  userApproved: z.boolean().default(false),
});

export const renderSequenceSchema = z.object({
  id: z.string().uuid().optional(),
  productionId: z.string().uuid({ message: "Production ID is required." }),
  title: z.string().trim().max(255).optional(),
  status: renderStatusSchema.default("draft"),
  progress: z.number().int().min(0).max(100).default(0),
  itemCount: z.number().int().min(0).default(0),
  readyItemCount: z.number().int().min(0).default(0),
  missingMediaCount: z.number().int().min(0).default(0),
  totalDurationSeconds: z.number().int().min(0).default(0),
  uncertaintyNotes: optionalText,
  sourceEvidence: optionalText,
  provenance: renderProvenanceSchema.default("user"),
  userApproved: z.boolean().default(false),
});

export const exportPackageSchema = z.object({
  id: z.string().uuid().optional(),
  productionId: z.string().uuid({ message: "Production ID is required." }),
  renderId: z.string().uuid().optional(),
  format: exportFormatSchema.default("delivery-manifest"),
  title: z.string().trim().max(255).optional(),
  status: exportStatusSchema.default("draft"),
  packageUrl: z.string().trim().max(2000).optional(),
  uncertaintyNotes: optionalText,
  provenance: renderProvenanceSchema.default("user"),
  userApproved: z.boolean().default(false),
});
