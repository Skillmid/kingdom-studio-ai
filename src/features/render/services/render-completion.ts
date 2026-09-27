import type {
  ExportPackage,
  ExportPackageProposal,
  RenderSequence,
  RenderSequenceProposal,
  RenderStatus,
} from "../types/render";

export function calculateRenderProgress(sequence: Partial<RenderSequence> | RenderSequenceProposal): number {
  const itemCount = sequence.itemCount ?? 0;
  if (itemCount === 0) return 0;
  const ready = sequence.readyItemCount ?? 0;
  return Math.round((ready / itemCount) * 100);
}

export function deriveRenderStatus(
  sequence: Partial<RenderSequence> | RenderSequenceProposal,
  current?: RenderStatus,
): RenderStatus {
  if (current === "failed" || current === "assembling") return current;
  const itemCount = sequence.itemCount ?? 0;
  const ready = sequence.readyItemCount ?? 0;
  if (itemCount > 0 && ready === itemCount) return "ready";
  if (itemCount > 0) return current ?? "draft";
  return "draft";
}

export function withRenderProgress<T extends Partial<RenderSequence> | RenderSequenceProposal>(
  sequence: T,
): T & { progress: number; status: RenderStatus } {
  const progress = calculateRenderProgress(sequence);
  return {
    ...sequence,
    progress,
    status: deriveRenderStatus(sequence, sequence.status),
  };
}

export function summarizeExportReadiness(pkg: Partial<ExportPackage> | ExportPackageProposal): {
  clipCount: number;
  readyClipCount: number;
  missingMediaCount: number;
} {
  const clips = pkg.manifest?.clips ?? [];
  const readyClipCount = clips.filter((clip) => Boolean(clip.mediaUrl?.trim())).length;
  return {
    clipCount: clips.length,
    readyClipCount,
    missingMediaCount: Math.max(0, clips.length - readyClipCount),
  };
}
