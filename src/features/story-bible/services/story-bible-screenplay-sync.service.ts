import { analyzeScreenplay } from "@/features/script-intelligence/services/screenplay-analysis.service";

import type { StoryBibleDTO } from "../validation/story-bible.schema";

export type StoryBibleScreenplayProposal = Partial<StoryBibleDTO>;

export class StoryBibleScreenplaySyncService {
  async propose(screenplay: string): Promise<StoryBibleScreenplayProposal> {
    if (!screenplay.trim()) {
      throw new Error("Screenplay content is required to sync the Story Bible.");
    }

    const analysis = await analyzeScreenplay(screenplay);
    const proposal: StoryBibleScreenplayProposal = {};

    for (const [key, value] of Object.entries(analysis.storyBible)) {
      if (value === undefined || value === null) continue;

      if (typeof value === "string" && !value.trim()) continue;
      if (key === "duration_minutes" && typeof value !== "number") continue;

      if (key in proposal) {
        (proposal as Record<string, string | number>)[key] = value as string | number;
      } else {
        (proposal as Record<string, string | number>)[key] = value as string | number;
      }
    }

    if (!proposal.title && analysis.title) {
      proposal.title = analysis.title;
    }

    if (!proposal.logline && analysis.logline) {
      proposal.logline = analysis.logline;
    }

    return proposal;
  }
}

export const storyBibleScreenplaySync = new StoryBibleScreenplaySyncService();
