-- Add distinct creator-entered direction fields to production scenes.
-- Nullable columns preserve all existing scene rows and screenplay provenance.
ALTER TABLE public.scenes
    ADD COLUMN IF NOT EXISTS camera_direction TEXT,
    ADD COLUMN IF NOT EXISTS mood TEXT,
    ADD COLUMN IF NOT EXISTS music_notes TEXT,
    ADD COLUMN IF NOT EXISTS video_prompt TEXT;

COMMENT ON COLUMN public.scenes.camera_direction IS 'Creator-entered camera direction, kept separate from broader visual direction.';
COMMENT ON COLUMN public.scenes.mood IS 'Creator-entered scene atmosphere, kept separate from the emotional beat.';
COMMENT ON COLUMN public.scenes.music_notes IS 'Creator-entered music direction, kept separate from general sound notes.';
COMMENT ON COLUMN public.scenes.video_prompt IS 'Creator-entered scene video prompt, kept separate from the AI visual reference prompt.';
