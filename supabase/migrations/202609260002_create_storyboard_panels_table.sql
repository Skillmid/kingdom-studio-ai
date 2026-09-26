-- Storyboard panels consume shot, scene, character, and location intelligence.

CREATE TABLE IF NOT EXISTS public.storyboard_panels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
    scene_id UUID REFERENCES public.scenes(id) ON DELETE SET NULL,
    shot_id UUID REFERENCES public.shots(id) ON DELETE SET NULL,
    panel_number INTEGER NOT NULL CHECK (panel_number >= 1),
    title TEXT,
    visual_description TEXT,
    composition TEXT,
    continuity_notes TEXT,
    generation_prompt TEXT,
    image_url TEXT,
    source_evidence TEXT,
    character_ids UUID[] NOT NULL DEFAULT '{}',
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    provenance TEXT NOT NULL DEFAULT 'user'
        CHECK (provenance IN ('user', 'shot-derived', 'ai-proposal')),
    user_approved BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'in-progress', 'completed')),
    progress INTEGER NOT NULL DEFAULT 0
        CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_storyboard_panels_production
    ON public.storyboard_panels(production_id);
CREATE INDEX IF NOT EXISTS idx_storyboard_panels_scene
    ON public.storyboard_panels(scene_id);
CREATE INDEX IF NOT EXISTS idx_storyboard_panels_shot
    ON public.storyboard_panels(shot_id);
CREATE INDEX IF NOT EXISTS idx_storyboard_panels_status
    ON public.storyboard_panels(status);

CREATE UNIQUE INDEX IF NOT EXISTS storyboard_panels_production_shot_unique
    ON public.storyboard_panels(production_id, shot_id)
    WHERE shot_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS storyboard_panels_production_number_unique
    ON public.storyboard_panels(production_id, panel_number);

DROP TRIGGER IF EXISTS update_storyboard_panels_updated_at ON public.storyboard_panels;
CREATE TRIGGER update_storyboard_panels_updated_at
BEFORE UPDATE ON public.storyboard_panels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.storyboard_panels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view storyboard panels in their productions" ON public.storyboard_panels;
CREATE POLICY "Users can view storyboard panels in their productions"
    ON public.storyboard_panels FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = storyboard_panels.production_id
              AND productions.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create storyboard panels" ON public.storyboard_panels;
CREATE POLICY "Users can create storyboard panels"
    ON public.storyboard_panels FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = storyboard_panels.production_id
              AND productions.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update storyboard panels" ON public.storyboard_panels;
CREATE POLICY "Users can update storyboard panels"
    ON public.storyboard_panels FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = storyboard_panels.production_id
              AND productions.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = storyboard_panels.production_id
              AND productions.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete storyboard panels" ON public.storyboard_panels;
CREATE POLICY "Users can delete storyboard panels"
    ON public.storyboard_panels FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = storyboard_panels.production_id
              AND productions.owner_id = auth.uid()
        )
    );

COMMENT ON TABLE public.storyboard_panels IS
    'Visual planning panels derived from shots or created by the filmmaker.';
