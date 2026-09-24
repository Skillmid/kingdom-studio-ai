import type {
  ScreenplaySource,
} from "@/features/production-knowledge";

import type { ScreenplayAnalysis } from "./screenplay-analysis";

export type ScreenplayStatus =
  | "draft"
  | "imported"
  | "review"
  | "revised"
  | "approved"
  | "locked";

export interface Screenplay {
  id: string;
  productionId: string;
  title: string;
  content: string;
  source: ScreenplaySource;
  sourceFileName: string | null;
  version: number;
  status: ScreenplayStatus;
  analysis: ScreenplayAnalysis | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScreenplayRevision {
  id: string;
  screenplayId: string;
  version: number;
  title: string;
  content: string;
  analysis: ScreenplayAnalysis | null;
  reason: string;
  createdAt: string;
}

export interface SaveScreenplayInput {
  title: string;
  content: string;
  analysis?: ScreenplayAnalysis | null;
  source?: ScreenplaySource;
  sourceFileName?: string | null;
  status?: ScreenplayStatus;
  reason?: string;
}
