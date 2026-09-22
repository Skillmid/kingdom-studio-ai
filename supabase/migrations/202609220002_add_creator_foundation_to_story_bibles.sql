-- Kingdom Studio AI
-- Creator Foundation fields for Story Bible
-- Keeps the filmmaker's burden and human problem available to every downstream AI workflow.

ALTER TABLE IF EXISTS public.story_bibles
  ADD COLUMN IF NOT EXISTS burden TEXT,
  ADD COLUMN IF NOT EXISTS truth TEXT,
  ADD COLUMN IF NOT EXISTS human_problem TEXT;

COMMENT ON COLUMN public.story_bibles.burden IS
  'The burden or conviction the filmmaker feels compelled to communicate through the story.';

COMMENT ON COLUMN public.story_bibles.truth IS
  'The truth the filmmaker wants the audience to encounter through the story.';

COMMENT ON COLUMN public.story_bibles.human_problem IS
  'The real human struggle through which the truth is dramatized.';
