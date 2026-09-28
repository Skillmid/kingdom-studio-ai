-- Immutable Script Intelligence results linked to the exact saved screenplay revision.
CREATE TABLE IF NOT EXISTS public.screenplay_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
    screenplay_id UUID NOT NULL REFERENCES public.screenplays(id) ON DELETE CASCADE,
    revision_id UUID NOT NULL REFERENCES public.screenplay_revisions(id) ON DELETE CASCADE,
    screenplay_version INTEGER NOT NULL CHECK (screenplay_version > 0),
    analysis JSONB NOT NULL CHECK (jsonb_typeof(analysis) = 'object'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_screenplay_analyses_revision_latest
    ON public.screenplay_analyses(revision_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_screenplay_analyses_production
    ON public.screenplay_analyses(production_id, created_at DESC);

ALTER TABLE public.screenplay_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view analyses for their screenplay revisions" ON public.screenplay_analyses;
CREATE POLICY "Users can view analyses for their screenplay revisions"
    ON public.screenplay_analyses FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.screenplays AS screenplay
            JOIN public.productions AS production ON production.id = screenplay.production_id
            JOIN public.screenplay_revisions AS revision ON revision.screenplay_id = screenplay.id
            WHERE screenplay.id = screenplay_analyses.screenplay_id
              AND screenplay.production_id = screenplay_analyses.production_id
              AND revision.id = screenplay_analyses.revision_id
              AND revision.version = screenplay_analyses.screenplay_version
              AND production.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create analyses for their screenplay revisions" ON public.screenplay_analyses;
CREATE POLICY "Users can create analyses for their screenplay revisions"
    ON public.screenplay_analyses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.screenplays AS screenplay
            JOIN public.productions AS production ON production.id = screenplay.production_id
            JOIN public.screenplay_revisions AS revision ON revision.screenplay_id = screenplay.id
            WHERE screenplay.id = screenplay_analyses.screenplay_id
              AND screenplay.production_id = screenplay_analyses.production_id
              AND revision.id = screenplay_analyses.revision_id
              AND revision.version = screenplay_analyses.screenplay_version
              AND production.owner_id = auth.uid()
        )
    );

COMMENT ON TABLE public.screenplay_analyses IS 'Immutable Script Intelligence results associated with a saved screenplay revision.';
