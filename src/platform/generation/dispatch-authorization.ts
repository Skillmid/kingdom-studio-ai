import type { GenerationJob } from "@/features/assets/types/generation-job";

export interface DispatchAssetAuthority {
  id: string;
  productionId: string;
  userApproved: boolean;
}

export function canDispatchPersistedJob(
  job: Pick<GenerationJob, "status" | "productionId" | "assetId">,
  asset: DispatchAssetAuthority | null,
): boolean {
  return Boolean(
    job.status === "queued" &&
      job.assetId &&
      asset &&
      asset.id === job.assetId &&
      asset.productionId === job.productionId &&
      asset.userApproved,
  );
}
