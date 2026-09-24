export type StoryBibleSectionStatus =
  | "Complete"
  | "Partially Complete"
  | "Pending";

export interface StoryBibleProgressFieldValues {
  title: string;
  logline: string;
  synopsis: string;

  burden: string;
  truth: string;
  human_problem: string;

  theme: string;
  core_message: string;
  scripture_foundation: string;
  kingdom_objective: string;

  beginning: string;
  conflict: string;
  midpoint: string;
  climax: string;
  ending: string;

  genre: string;
  target_audience: string;
  tone: string;
  visual_style: string;
  universe: string;
  time_period: string;
  primary_location: string;

  ai_context: string;
  ai_rules: string;
  forbidden_elements: string;
  preferred_vocabulary: string;
  visual_consistency: string;
}

export interface StoryBibleSectionProgress {
  id: string;
  label: string;
  filled: number;
  total: number;
  status: StoryBibleSectionStatus;
}

export interface StoryBibleProgressResult {
  percentage: number;
  filled: number;
  total: number;
  sections: StoryBibleSectionProgress[];
}

function isFilled(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function sectionStatus(filled: number, total: number): StoryBibleSectionStatus {
  if (filled <= 0) {
    return "Pending";
  }

  if (filled >= total) {
    return "Complete";
  }

  return "Partially Complete";
}

function measureSection(
  id: string,
  label: string,
  fields: Array<string | null | undefined>
): StoryBibleSectionProgress {
  const filled = fields.filter(isFilled).length;
  const total = fields.length;

  return {
    id,
    label,
    filled,
    total,
    status: sectionStatus(filled, total),
  };
}

/**
 * Live Story Bible completion from actual field values.
 *
 * Percentage = filled counted fields / total counted fields.
 * Empty or whitespace-only strings do not count.
 *
 * language, aspect_ratio, and duration_minutes are excluded because the
 * editor seeds them with defaults. Counting them would report progress
 * on a blank Story Bible.
 */
export function calculateStoryBibleProgress(
  values: StoryBibleProgressFieldValues
): StoryBibleProgressResult {
  const sections: StoryBibleSectionProgress[] = [
    measureSection("overview", "Overview", [
      values.title,
      values.logline,
      values.synopsis,
    ]),
    measureSection("creator-foundation", "Creator Foundation", [
      values.burden,
      values.truth,
      values.human_problem,
    ]),
    measureSection("kingdom-vision", "Kingdom Vision", [
      values.theme,
      values.core_message,
      values.scripture_foundation,
      values.kingdom_objective,
    ]),
    measureSection("narrative", "Narrative", [
      values.beginning,
      values.conflict,
      values.midpoint,
      values.climax,
      values.ending,
    ]),
    measureSection("production-details", "Production Details", [
      values.genre,
      values.target_audience,
      values.tone,
      values.visual_style,
      values.universe,
      values.time_period,
      values.primary_location,
    ]),
    measureSection("ai-context", "AI Context", [
      values.ai_context,
      values.ai_rules,
      values.forbidden_elements,
      values.preferred_vocabulary,
      values.visual_consistency,
    ]),
  ];

  const filled = sections.reduce((sum, section) => sum + section.filled, 0);
  const total = sections.reduce((sum, section) => sum + section.total, 0);

  return {
    percentage: total === 0 ? 0 : Math.round((filled / total) * 100),
    filled,
    total,
    sections,
  };
}
