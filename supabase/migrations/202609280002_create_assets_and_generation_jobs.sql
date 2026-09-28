-- Production-owned assets and generation jobs used by the Assets workspace.
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
    scene_id UUID REFERENCES public.scenes(id) ON DELETE SET NULL,
    shot_id UUID REFERENCES public.shots(id) ON DELETE SET NULL,
    panel_id UUID REFERENCES public.storyboard_panels(id) ON DELETE SET NULL,
    character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    director_note_id UUID REFERENCES public.director_notes(id) ON DELETE SET NULL,
    kind TEXT NOT NULL CHECK (kind IN ('character-reference', 'location-reference', 'prop', 'costume', 'image', 'video', 'audio', 'music', 'document', 'other')),
    title TEXT,
    description TEXT,
    prompt TEXT,
    file_url TEXT,
    mime_type TEXT,
    source_kind TEXT NOT NULL DEFAULT 'user' CHECK (source_kind IN ('character', 'location', 'scene', 'shot', 'panel', 'director-note', 'user')),
    source_id UUID,
    uncertainty_notes TEXT,
    source_evidence TEXT,
    provenance TEXT NOT NULL DEFAULT 'user' CHECK (provenance IN ('user', 'production-derived', 'generated')),
    user_approved BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'generating', 'failed')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_assets_production ON public.assets(production_id);
CREATE INDEX IF NOT EXISTS idx_assets_source ON public.assets(source_kind, source_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(production_id, status);

DROP TRIGGER IF EXISTS update_assets_updated_at ON public.assets;
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view assets in their productions" ON public.assets;
CREATE POLICY "Users can view assets in their productions" ON public.assets FOR SELECT
USING (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = assets.production_id AND productions.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Users can create assets in their productions" ON public.assets;
CREATE POLICY "Users can create assets in their productions" ON public.assets FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = assets.production_id AND productions.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Users can update assets in their productions" ON public.assets;
CREATE POLICY "Users can update assets in their productions" ON public.assets FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = assets.production_id AND productions.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = assets.production_id AND productions.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Users can delete assets in their productions" ON public.assets;
CREATE POLICY "Users can delete assets in their productions" ON public.assets FOR DELETE
USING (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = assets.production_id AND productions.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
    job_type TEXT NOT NULL CHECK (job_type IN ('image', 'video', 'audio', 'document')),
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    provider TEXT,
    model TEXT,
    prompt TEXT,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(parameters) = 'object'),
    source_entity_type TEXT CHECK (source_entity_type IN ('asset', 'character', 'location', 'scene', 'shot', 'panel', 'director-note')),
    source_entity_id UUID,
    output_url TEXT,
    error_message TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_production ON public.generation_jobs(production_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_asset ON public.generation_jobs(asset_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON public.generation_jobs(production_id, status);

DROP TRIGGER IF EXISTS update_generation_jobs_updated_at ON public.generation_jobs;
CREATE TRIGGER update_generation_jobs_updated_at BEFORE UPDATE ON public.generation_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view generation jobs in their productions" ON public.generation_jobs;
CREATE POLICY "Users can view generation jobs in their productions" ON public.generation_jobs FOR SELECT
USING (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = generation_jobs.production_id AND productions.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Users can create generation jobs in their productions" ON public.generation_jobs;
CREATE POLICY "Users can create generation jobs in their productions" ON public.generation_jobs FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = generation_jobs.production_id AND productions.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Users can update generation jobs in their productions" ON public.generation_jobs;
CREATE POLICY "Users can update generation jobs in their productions" ON public.generation_jobs FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = generation_jobs.production_id AND productions.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = generation_jobs.production_id AND productions.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Users can delete generation jobs in their productions" ON public.generation_jobs;
CREATE POLICY "Users can delete generation jobs in their productions" ON public.generation_jobs FOR DELETE
USING (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = generation_jobs.production_id AND productions.owner_id = auth.uid()));

COMMENT ON TABLE public.assets IS 'Creator-reviewed production assets and grounded media prompts.';
COMMENT ON TABLE public.generation_jobs IS 'Authorized generation job lifecycle records for production assets.';
