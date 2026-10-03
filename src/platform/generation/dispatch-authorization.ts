import type { GenerationJob } from "@/features/assets/types/generation-job";
import { canCheckGenerationJobStatus } from "@/features/assets/services/generation-job";

export interface DispatchAssetAuthority {
  id: string;
  productionId: string;
  userApproved: boolean;
}

export function canDispatchPersistedJob(
  job: Pick<GenerationJob, "status" | "productionId" | "assetId" | "provider" | "parameters">,
  asset: DispatchAssetAuthority | null,
): boolean {
  const isDispatchable = job.status === "queued";
  const isPollable = canCheckGenerationJobStatus(job);

  return Boolean(
    (isDispatchable || isPollable) &&
      job.assetId &&
      asset &&
      asset.id === job.assetId &&
      asset.productionId === job.productionId &&
      (isPollable || asset.userApproved),
  );
}
