import type { RenderSequence } from "../types/render";

export function canPrepareExport(
  sequence: Pick<RenderSequence, "id" | "userApproved" | "status"> | undefined,
  clipsLoadedForRenderId: string | undefined,
  selectedRenderId: string,
  clipsLoading: boolean,
): boolean {
  return Boolean(
    sequence && sequence.id === selectedRenderId && sequence.userApproved && sequence.status !== "failed" &&
    clipsLoadedForRenderId === sequence.id && !clipsLoading,
  );
}
