import { aiGateway } from "@/platform/ai";

import type { StoryBibleDTO } from "../validation/story-bible.schema";

export type StoryBibleScreenplayProposal = Partial<StoryBibleDTO>;

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/, "");
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

function stringValue(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(1, Math.round(value))
    : undefined;
}

function parseProposal(text: string): StoryBibleScreenplayProposal {
  let parsed: unknown;

  try {
    parsed = JSON.parse(cleanJsonResponse(text));
  } catch {
    throw new Error("AI returned an invalid Story Bible proposal.");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new Error("AI returned an invalid Story Bible proposal.");
  }

  const data = parsed as Record<string, unknown>;
  const proposal: StoryBibleScreenplayProposal = {};

  const stringFields: Array<keyof StoryBibleDTO> = [
    "title",
    "logline",
    "synopsis",
    "burden",
    "truth",
    "human_problem",
    "theme",
    "core_message",
    "scripture_foundation",
    "kingdom_objective",
    "target_audience",
    "genre",
    "tone",
    "language",
    "visual_style",
    "aspect_ratio",
    "universe",
    "time_period",
    "primary_location",
    "beginning",
    "conflict",
    "midpoint",
    "climax",
    "ending",
    "ai_context",
    "ai_rules",
    "forbidden_elements",
    "preferred_vocabulary",
    "visual_consistency",
  ];

  for (const field of stringFields) {
    const value = stringValue(data[field]);
    if (value !== undefined) {
      proposal[field] = value as never;
    }
  }

  const duration = numberValue(data.duration_minutes);
  if (duration !== undefined) {
    proposal.duration_minutes = duration;
  }

  return proposal;
}

function buildSystemPrompt(): string {
  return `You are the Story Bible intelligence layer inside Kingdom Studio AI.

The filmmaker is the creative authority. Your job is to study the supplied screenplay and propose Story Bible values that are strongly supported by the screenplay. Do not invent specific facts simply to fill fields. If the screenplay does not support a field, leave it as an empty string.

The Story Bible is a production foundation, not a screenplay rewrite. Preserve the filmmaker's apparent intent, spiritual direction, cultural context, characters, locations, and story logic. For Kingdom productions, identify biblical or kingdom foundations only when the screenplay supports them. Do not manufacture Scripture references.

Return ONLY valid JSON with these keys:
title, logline, synopsis, burden, truth, human_problem, theme, core_message, scripture_foundation, kingdom_objective, target_audience, genre, tone, language, visual_style, aspect_ratio, duration_minutes, universe, time_period, primary_location, beginning, conflict, midpoint, climax, ending, ai_context, ai_rules, forbidden_elements, preferred_vocabulary, visual_consistency.

Narrative beats must describe what actually happens in the screenplay:
- beginning: setup and inciting situation
- conflict: central opposition/problem driving the story
- midpoint: major turning point or revelation around the middle
- climax: decisive confrontation or choice
- ending: resolution and final state

For AI context/rules/visual consistency, propose concise production guidance grounded in observable screenplay details. Keep the output editable and practical for a filmmaker.`;
}

function buildUserPrompt(screenplay: string): string {
  return `Analyse this screenplay and propose the Story Bible foundation. Use only evidence reasonably supported by the screenplay.

SCREENPLAY:

${screenplay}`;
}

export class StoryBibleScreenplaySyncService {
  async propose(screenplay: string): Promise<StoryBibleScreenplayProposal> {
    if (!screenplay.trim()) {
      throw new Error("Screenplay content is required to sync the Story Bible.");
    }

    const response = await aiGateway.generate({
      provider: "openrouter",
      systemPrompt: buildSystemPrompt(),
      userPrompt: buildUserPrompt(screenplay),
      temperature: 0.2,
      maxTokens: 5000,
    });

    return parseProposal(response.text);
  }
}

export const storyBibleScreenplaySync =
  new StoryBibleScreenplaySyncService();
