import type { RenderSequence, RenderSequenceProposal, RenderStatus } from "../types/render";

export function calculateRenderProgress(itemCount: number, readyItemCount: number): number {
  if (itemCount <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((readyItemCount / itemCount) * 100)));
}

export function deriveRenderStatus(
  itemCount: number,
  readyItemCount: number,
  current?: RenderStatus,
): RenderStatus {
  if (current === "failed" || current === "assembling") return current;
  if (itemCount > 0 && readyItemCount === itemCount) return "ready";
  return current === "ready" ? "draft" : current ?? "draft";
}

export function withRenderProgress<T extends Partial<RenderSequence> | RenderSequenceProposal>(
  sequence: T,
): T & {
  progress: number;
  status: RenderStatus;
  itemCount: number;
  readyItemCount: number;
  missingMediaCount: number;
  totalDurationSeconds: number;
} {
  const itemCount = sequence.itemCount ?? 0;
  const readyItemCount = sequence.readyItemCount ?? 0;
  const progress = calculateRenderProgress(itemCount, readyItemCount);
  return {
    ...sequence,
    itemCount,
    readyItemCount,
    missingMediaCount: sequence.missingMediaCount ?? Math.max(0, itemCount - readyItemCount),
    totalDurationSeconds: sequence.totalDurationSeconds ?? 0,
    progress,
    status: deriveRenderStatus(itemCount, readyItemCount, sequence.status),
  };
}
