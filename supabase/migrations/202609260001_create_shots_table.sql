-- Shot List persistence for production-owned camera coverage.
-- Shots belong to a production and may optionally link to a scene and location.

CREATE TABLE IF NOT EXISTS public.shots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
    scene_id UUID REFERENCES public.scenes(id) ON DELETE SET NULL,
    shot_number INTEGER NOT NULL CHECK (shot_number >= 1),
    shot_code TEXT,
    shot_type TEXT NOT NULL DEFAULT 'medium' CHECK (
        shot_type IN (
            'establishing',
            'wide',
            'full',
            'medium',
            'close-up',
            'extreme-close-up',
            'over-shoulder',
            'pov',
            'insert',
            'two-shot',
            'group',
            'cutaway',
            'aerial',
            'tracking'
        )
    ),
    framing TEXT NOT NULL DEFAULT 'MS' CHECK (
        framing IN ('EWS', 'WS', 'FS', 'MS', 'MCU', 'CU', 'ECU', 'OTS', 'POV')
    ),
    camera_angle TEXT CHECK (
        camera_angle IS NULL OR camera_angle IN (
            'eye-level',
            'high',
            'low',
            'dutch',
            'birds-eye',
            'worms-eye'
        )
    ),
    camera_movement TEXT CHECK (
        camera_movement IS NULL OR camera_movement IN (
            'static',
            'pan',
            'tilt',
            'dolly',
            'track',
            'crane',
            'handheld',
            'steadicam',
            'zoom',
            'rack-focus'
        )
    ),
    lens TEXT,
    subject TEXT,
    action TEXT,
    dialogue_reference TEXT,
    visual_description TEXT,
    continuity_notes TEXT,
    generation_prompt TEXT,
    source_evidence TEXT,
    character_ids UUID[] NOT NULL DEFAULT '{}',
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    estimated_duration_seconds INTEGER CHECK (
        estimated_duration_seconds IS NULL OR estimated_duration_seconds >= 0
    ),
    provenance TEXT NOT NULL DEFAULT 'user' CHECK (
        provenance IN ('user', 'scene-derived', 'ai-proposal')
    ),
    user_approved BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in-progress', 'completed')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT shots_production_number_unique UNIQUE (production_id, shot_number)
);

CREATE INDEX IF NOT EXISTS idx_shots_production ON public.shots(production_id);
CREATE INDEX IF NOT EXISTS idx_shots_scene ON public.shots(scene_id);
CREATE INDEX IF NOT EXISTS idx_shots_location ON public.shots(location_id);
CREATE INDEX IF NOT EXISTS idx_shots_status ON public.shots(status);
CREATE INDEX IF NOT EXISTS idx_shots_user_approved ON public.shots(user_approved);

DROP TRIGGER IF EXISTS update_shots_updated_at ON public.shots;
CREATE TRIGGER update_shots_updated_at
BEFORE UPDATE ON public.shots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.shots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view shots in their productions" ON public.shots;
CREATE POLICY "Users can view shots in their productions"
ON public.shots FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.productions
        WHERE productions.id = shots.production_id
          AND productions.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can create shots" ON public.shots;
CREATE POLICY "Users can create shots"
ON public.shots FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.productions
        WHERE productions.id = shots.production_id
          AND productions.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can update shots" ON public.shots;
CREATE POLICY "Users can update shots"
ON public.shots FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.productions
        WHERE productions.id = shots.production_id
          AND productions.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.productions
        WHERE productions.id = shots.production_id
          AND productions.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can delete shots" ON public.shots;
CREATE POLICY "Users can delete shots"
ON public.shots FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.productions
        WHERE productions.id = shots.production_id
          AND productions.owner_id = auth.uid()
    )
);

COMMENT ON TABLE public.shots IS
  'Production-owned camera coverage derived from scenes or created by the filmmaker.';
COMMENT ON COLUMN public.shots.user_approved IS
  'Filmmaker-approved shots must not be overwritten by later planning runs.';
COMMENT ON COLUMN public.shots.source_evidence IS
  'Screenplay or scene text that grounded this shot proposal.';
