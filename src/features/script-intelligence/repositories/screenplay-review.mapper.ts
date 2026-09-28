import type { ScriptReview, ScriptReviewType } from "../types/script-analysis";

export type FocusedReviewType = Exclude<ScriptReviewType, "full">;

export interface ScreenplayReviewRecord {
  id: string;
  productionId: string;
  screenplayId: string;
  revisionId: string;
  screenplayVersion: number;
  reviewType: FocusedReviewType;
  review: ScriptReview;
  createdAt: string;
}

export interface ScreenplayReviewRow {
  id: string;
  production_id: string;
  screenplay_id: string;
  revision_id: string;
  screenplay_version: number;
  review_type: FocusedReviewType;
  review: ScriptReview;
  created_at: string;
}

export function toScreenplayReviewDatabase(
  record: Omit<ScreenplayReviewRecord, "id" | "createdAt">,
) {
  return {
    production_id: record.productionId,
    screenplay_id: record.screenplayId,
    revision_id: record.revisionId,
    screenplay_version: record.screenplayVersion,
    review_type: record.reviewType,
    review: record.review,
  };
}

export function fromScreenplayReviewDatabase(row: ScreenplayReviewRow): ScreenplayReviewRecord {
  return {
    id: row.id,
    productionId: row.production_id,
    screenplayId: row.screenplay_id,
    revisionId: row.revision_id,
    screenplayVersion: row.screenplay_version,
    reviewType: row.review_type,
    review: row.review,
    createdAt: row.created_at,
  };
}
