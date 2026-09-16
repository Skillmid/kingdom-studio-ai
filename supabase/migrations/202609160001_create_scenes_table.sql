-- =====================================================
-- Kingdom Studio AI by Skillmid Creatives
-- Migration: Create Scenes
-- =====================================================

CREATE TABLE IF NOT EXISTS public.scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    production_id UUID NOT NULL
        REFERENCES public.productions(id)
        ON DELETE CASCADE,

    scene_number INTEGER NOT NULL
        CHECK (scene_number >= 1),

    heading TEXT NOT NULL,

    summary TEXT,

    character_ids UUID[] NOT NULL DEFAULT '{}',

    location_id UUID,

    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (
            status IN (
                'draft',
                'in-progress',
                'completed'
            )
        ),

    progress INTEGER NOT NULL DEFAULT 0
        CHECK (
            progress >= 0
            AND progress <= 100
        ),

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT timezone('utc', now()),

    updated_at TIMESTAMPTZ NOT NULL
        DEFAULT timezone('utc', now()),

    CONSTRAINT scenes_production_number_unique
        UNIQUE (production_id, scene_number)
);

CREATE INDEX IF NOT EXISTS idx_scenes_production
ON public.scenes(production_id);

CREATE INDEX IF NOT EXISTS idx_scenes_status
ON public.scenes(status);

CREATE INDEX IF NOT EXISTS idx_scenes_location
ON public.scenes(location_id);

DROP TRIGGER IF EXISTS update_scenes_updated_at
ON public.scenes;

CREATE TRIGGER update_scenes_updated_at
BEFORE UPDATE
ON public.scenes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.scenes
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS
"Users can view scenes in their productions"
ON public.scenes;

CREATE POLICY
"Users can view scenes in their productions"
ON public.scenes
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.productions
        WHERE productions.id = scenes.production_id
        AND productions.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS
"Users can create scenes"
ON public.scenes;

CREATE POLICY
"Users can create scenes"
ON public.scenes
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.productions
        WHERE productions.id = scenes.production_id
        AND productions.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS
"Users can update scenes"
ON public.scenes;

CREATE POLICY
"Users can update scenes"
ON public.scenes
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM public.productions
        WHERE productions.id = scenes.production_id
        AND productions.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.productions
        WHERE productions.id = scenes.production_id
        AND productions.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS
"Users can delete scenes"
ON public.scenes;

CREATE POLICY
"Users can delete scenes"
ON public.scenes
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM public.productions
        WHERE productions.id = scenes.production_id
        AND productions.owner_id = auth.uid()
    )
);

COMMENT ON TABLE public.scenes IS
'Scene records belonging to Kingdom Studio AI productions.';
