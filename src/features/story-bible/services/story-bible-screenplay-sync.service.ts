import { analyzeScreenplay } from "@/features/script-intelligence/services/screenplay-analysis.service";

import type { StoryBibleReview } from "@/features/script-intelligence/types/screenplay-analysis";

import type { StoryBibleDTO } from "../validation/story-bible.schema";

export interface StoryBibleScreenplayProposal {
  fields: Partial<StoryBibleDTO>;
  review: StoryBibleReview;
}

export class StoryBibleScreenplaySyncService {
  async propose(screenplay: string): Promise<StoryBibleScreenplayProposal> {
    if (!screenplay.trim()) {
      throw new Error("Screenplay content is required to sync the Story Bible.");
    }

    const analysis = await analyzeScreenplay(screenplay);
    const fields: Partial<StoryBibleDTO> = {};

    for (const [key, value] of Object.entries(analysis.storyBible)) {
      if (value === undefined || value === null) continue;
      if (typeof value === "string" && !value.trim()) continue;
      if (key === "duration_minutes" && typeof value !== "number") continue;

      (fields as Record<string, string | number>)[key] = value as string | number;
    }

    if (!fields.title && analysis.title) {
      fields.title = analysis.title;
    }

    if (!fields.logline && analysis.logline) {
      fields.logline = analysis.logline;
    }

    return {
      fields,
      review: analysis.storyBibleReview,
    };
  }
}

export const storyBibleScreenplaySync = new StoryBibleScreenplaySyncService();
