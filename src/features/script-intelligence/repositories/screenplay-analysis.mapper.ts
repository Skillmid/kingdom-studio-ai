import type { ScriptAnalysis } from "../types/script-analysis";

export interface ScreenplayAnalysisRecord {
  id: string;
  productionId: string;
  screenplayId: string;
  revisionId: string;
  screenplayVersion: number;
  analysis: ScriptAnalysis;
  createdAt: string;
}

export interface ScreenplayAnalysisRow {
  id: string;
  production_id: string;
  screenplay_id: string;
  revision_id: string;
  screenplay_version: number;
  analysis: ScriptAnalysis;
  created_at: string;
}

export function toScreenplayAnalysisDatabase(
  record: Omit<ScreenplayAnalysisRecord, "id" | "createdAt">,
) {
  return {
    production_id: record.productionId,
    screenplay_id: record.screenplayId,
    revision_id: record.revisionId,
    screenplay_version: record.screenplayVersion,
    analysis: record.analysis,
  };
}

export function fromScreenplayAnalysisDatabase(row: ScreenplayAnalysisRow): ScreenplayAnalysisRecord {
  return {
    id: row.id,
    productionId: row.production_id,
    screenplayId: row.screenplay_id,
    revisionId: row.revision_id,
    screenplayVersion: row.screenplay_version,
    analysis: row.analysis,
    createdAt: row.created_at,
  };
}
