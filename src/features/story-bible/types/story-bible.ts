export interface StoryBible {
  id: string;

  production_id: string;

  title: string;

  logline: string | null;

  synopsis: string | null;

  theme: string | null;

  core_message: string | null;

  scripture_foundation: string | null;

  kingdom_objective: string | null;

  target_audience: string | null;

  genre: string | null;

  tone: string | null;

  language: string;

  visual_style: string | null;

  aspect_ratio: string;

  duration_minutes: number;

  universe: string | null;

  time_period: string | null;

  primary_location: string | null;

  beginning: string | null;

  conflict: string | null;

  midpoint: string | null;

  climax: string | null;

  ending: string | null;

  ai_context: string | null;

  ai_rules: string | null;

  forbidden_elements: string | null;

  preferred_vocabulary: string | null;

  visual_consistency: string | null;

  created_at: string;

  updated_at: string;
}