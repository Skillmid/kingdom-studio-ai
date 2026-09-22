CREATE TABLE IF NOT EXISTS public.scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
    scene_number INTEGER NOT NULL CHECK (scene_number >= 1),
    heading TEXT NOT NULL,
    summary TEXT,
    character_ids UUID[] NOT NULL DEFAULT '{}',
    location_id UUID,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in-progress', 'completed')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT scenes_production_number_unique UNIQUE (production_id, scene_number)
);

CREATE INDEX IF NOT EXISTS idx_scenes_production ON public.scenes(production_id);
CREATE INDEX IF NOT EXISTS idx_scenes_status ON public.scenes(status);
CREATE INDEX IF NOT EXISTS idx_scenes_location ON public.scenes(location_id);
