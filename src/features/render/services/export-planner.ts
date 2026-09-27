import type { ExportFormat, ExportManifest, ExportPackageProposal, RenderClip, RenderSequence } from "../types/render";

export function buildExportManifest(
  productionId: string,
  clips: Array<Pick<RenderClip, "sequenceNumber" | "title" | "durationSeconds" | "mediaUrl" | "sourceKind" | "sourceId" | "uncertaintyNotes">>,
  sequence?: Pick<RenderSequence, "id" | "title">,
  generatedAt = new Date().toISOString(),
): ExportManifest {
  const readyClipCount = clips.filter((clip) => Boolean(clip.mediaUrl?.trim())).length;
  return {
    productionId,
    renderId: sequence?.id,
    title: sequence?.title || "Delivery manifest",
    generatedAt,
    clipCount: clips.length,
    readyClipCount,
    missingMediaCount: Math.max(0, clips.length - readyClipCount),
    totalDurationSeconds: clips.reduce((sum, clip) => sum + (clip.durationSeconds ?? 0), 0),
    clips: [...clips].sort((a, b) => a.sequenceNumber - b.sequenceNumber).map((clip) => ({
      sequenceNumber: clip.sequenceNumber,
      title: clip.title,
      durationSeconds: clip.durationSeconds,
      mediaUrl: clip.mediaUrl,
      sourceKind: clip.sourceKind,
      sourceId: clip.sourceId,
      uncertaintyNotes: clip.uncertaintyNotes,
    })),
  };
}

export function serializeExportPackage(format: ExportFormat, manifest: ExportManifest): string {
  if (format === "edit-decision-list") {
    return ["TITLE: " + (manifest.title || "Assembly"), "FCM: NON-DROP FRAME", "", ...manifest.clips.map((clip) => `${String(clip.sequenceNumber).padStart(3, "0")}  ${clip.title || "Untitled"}  ${clip.durationSeconds ?? 0}s  ${clip.mediaUrl || "MEDIA MISSING"}`)].join("\n");
  }
  return JSON.stringify(format === "preview-package" ? { kind: "preview-package", title: manifest.title, generatedAt: manifest.generatedAt, clips: manifest.clips, packageUrl: null } : manifest, null, 2);
}

export function planExportPackage(
  productionId: string,
  clips: RenderClip[],
  format: ExportFormat = "delivery-manifest",
  sequence?: RenderSequence,
  generatedAt = new Date().toISOString(),
): ExportPackageProposal {
  const manifest = buildExportManifest(productionId, clips, sequence, generatedAt);
  return {
    productionId,
    renderId: sequence?.id,
    format,
    title: sequence?.title || manifest.title,
    status: "packaged",
    packageUrl: undefined,
    manifest,
    serializedPackage: serializeExportPackage(format, manifest),
    uncertaintyNotes: "Package file URL is omitted until an export renderer writes a real file.",
    provenance: "production-derived",
    userApproved: false,
  };
}
