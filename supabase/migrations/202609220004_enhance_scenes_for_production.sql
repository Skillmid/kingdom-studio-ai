-- Enhance Scene Planner into a full production scene bible.
ALTER TABLE public.scenes
  ADD COLUMN IF NOT EXISTS scene_type TEXT NOT NULL DEFAULT 'INT' CHECK (scene_type IN ('INT', 'EXT', 'BOTH')),
  ADD COLUMN IF NOT EXISTS time_of_day TEXT,
  ADD COLUMN IF NOT EXISTS action TEXT,
  ADD COLUMN IF NOT EXISTS dialogue TEXT,
  ADD COLUMN IF NOT EXISTS purpose TEXT,
  ADD COLUMN IF NOT EXISTS emotional_beat TEXT,
  ADD COLUMN IF NOT EXISTS story_beat TEXT,
  ADD COLUMN IF NOT EXISTS visual_direction TEXT,
  ADD COLUMN IF NOT EXISTS props TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS wardrobe TEXT,
  ADD COLUMN IF NOT EXISTS sound_notes TEXT,
  ADD COLUMN IF NOT EXISTS continuity_notes TEXT,
  ADD COLUMN IF NOT EXISTS vfx_notes TEXT,
  ADD COLUMN IF NOT EXISTS production_notes TEXT,
  ADD COLUMN IF NOT EXISTS ai_prompt TEXT,
  ADD COLUMN IF NOT EXISTS source_text TEXT,
  ADD COLUMN IF NOT EXISTS estimated_duration_seconds INTEGER CHECK (estimated_duration_seconds IS NULL OR estimated_duration_seconds >= 0);

CREATE INDEX IF NOT EXISTS idx_scenes_scene_type ON public.scenes(scene_type);
CREATE INDEX IF NOT EXISTS idx_scenes_time_of_day ON public.scenes(time_of_day);

COMMENT ON COLUMN public.scenes.scene_type IS 'Parsed screenplay scene type: INT, EXT, or BOTH.';
COMMENT ON COLUMN public.scenes.time_of_day IS 'Parsed screenplay time marker such as MORNING, NIGHT, or SUNSET.';
COMMENT ON COLUMN public.scenes.source_text IS 'Original scene content captured during screenplay extraction for traceability.';
