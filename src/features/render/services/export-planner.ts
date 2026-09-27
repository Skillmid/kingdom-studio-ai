import type {
  ExportFormat,
  ExportManifest,
  ExportPackageProposal,
  RenderClipProposal,
  RenderSequenceProposal,
} from "../types/render";

export function buildExportManifest(
  productionId: string,
  clips: Array<
    Pick<
      RenderClipProposal,
      "sequenceNumber" | "title" | "durationSeconds" | "mediaUrl" | "sourceKind" | "sourceId" | "uncertaintyNotes"
    >
  >,
  options: { renderId?: string; title?: string; generatedAt?: string } = {},
): ExportManifest {
  const ordered = [...clips].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const readyClipCount = ordered.filter((clip) => Boolean(clip.mediaUrl?.trim())).length;

  return {
    productionId,
    renderId: options.renderId,
    title: options.title,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    clipCount: ordered.length,
    readyClipCount,
    missingMediaCount: Math.max(0, ordered.length - readyClipCount),
    totalDurationSeconds: ordered.reduce((sum, clip) => sum + (clip.durationSeconds ?? 0), 0),
    clips: ordered.map((clip) => ({
      sequenceNumber: clip.sequenceNumber,
      title: clip.title,
      durationSeconds: clip.durationSeconds,
      mediaUrl: clip.mediaUrl?.trim() || undefined,
      sourceKind: clip.sourceKind,
      sourceId: clip.sourceId,
      uncertaintyNotes: clip.uncertaintyNotes,
    })),
  };
}

export function planExportPackage(
  productionId: string,
  clips: RenderClipProposal[],
  sequence?: Pick<RenderSequenceProposal, "title"> & { id?: string },
  format: ExportFormat = "delivery-manifest",
  generatedAt = new Date().toISOString(),
): ExportPackageProposal {
  const manifest = buildExportManifest(productionId, clips, {
    renderId: sequence?.id,
    title: sequence?.title || "Production sequence",
    generatedAt,
  });
  const missing = manifest.missingMediaCount;

  return {
    productionId,
    renderId: sequence?.id,
    format,
    title: `${sequence?.title || "Production sequence"} ${format.replace(/-/g, " ")}`,
    status: manifest.clipCount === 0 ? "failed" : "packaged",
    packageUrl: undefined,
    manifest,
    uncertaintyNotes:
      manifest.clipCount === 0
        ? "No clips are available to package."
        : missing > 0
          ? `${missing} clip${missing === 1 ? "" : "s"} are listed without media. The package is a manifest only; no delivery file URL was invented.`
          : "Manifest packaged from existing clip media. No additional file host URL was invented.",
    provenance: "production-derived",
    userApproved: false,
  };
}

export function serializeExportPackage(pkg: ExportPackageProposal, pretty = true): string {
  return JSON.stringify(
    {
      format: pkg.format,
      title: pkg.title,
      status: pkg.status,
      packageUrl: pkg.packageUrl ?? null,
      uncertaintyNotes: pkg.uncertaintyNotes,
      manifest: pkg.manifest,
    },
    null,
    pretty ? 2 : 0,
  );
}
