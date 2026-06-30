export interface Production {
  id: string;

  owner_id: string;

  created_by: string;

  title: string;

  slug: string;

  logline: string | null;

  synopsis: string | null;

  genre: string | null;

  target_audience: string | null;

  art_style: string | null;

  language: string;

  aspect_ratio: string;

  target_duration_seconds: number;

  cover_image_url: string | null;

  status:
    | "concept"
    | "writing"
    | "pre-production"
    | "production"
    | "post-production"
    | "released"
    | "archived";

  visibility:
    | "private"
    | "team"
    | "public";

  created_at: string;

  updated_at: string;

  last_opened_at: string | null;

  deleted_at: string | null;
}