-- Immutable focused Script Intelligence reviews linked to saved screenplay revisions.
CREATE TABLE IF NOT EXISTS public.screenplay_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
    screenplay_id UUID NOT NULL REFERENCES public.screenplays(id) ON DELETE CASCADE,
    revision_id UUID NOT NULL REFERENCES public.screenplay_revisions(id) ON DELETE CASCADE,
    screenplay_version INTEGER NOT NULL CHECK (screenplay_version > 0),
    review_type TEXT NOT NULL CHECK (review_type IN ('professional', 'spiritual', 'cultural', 'dialogue', 'character', 'story', 'production')),
    review JSONB NOT NULL CHECK (jsonb_typeof(review) = 'object'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_screenplay_reviews_revision_latest
    ON public.screenplay_reviews(revision_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_screenplay_reviews_production
    ON public.screenplay_reviews(production_id, created_at DESC);

ALTER TABLE public.screenplay_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view focused reviews for their screenplay revisions" ON public.screenplay_reviews;
CREATE POLICY "Users can view focused reviews for their screenplay revisions"
    ON public.screenplay_reviews FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.screenplays AS screenplay
            JOIN public.productions AS production ON production.id = screenplay.production_id
            JOIN public.screenplay_revisions AS revision ON revision.screenplay_id = screenplay.id
            WHERE screenplay.id = screenplay_reviews.screenplay_id
              AND screenplay.production_id = screenplay_reviews.production_id
              AND revision.id = screenplay_reviews.revision_id
              AND revision.version = screenplay_reviews.screenplay_version
              AND production.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create focused reviews for their screenplay revisions" ON public.screenplay_reviews;
CREATE POLICY "Users can create focused reviews for their screenplay revisions"
    ON public.screenplay_reviews FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.screenplays AS screenplay
            JOIN public.productions AS production ON production.id = screenplay.production_id
            JOIN public.screenplay_revisions AS revision ON revision.screenplay_id = screenplay.id
            WHERE screenplay.id = screenplay_reviews.screenplay_id
              AND screenplay.production_id = screenplay_reviews.production_id
              AND revision.id = screenplay_reviews.revision_id
              AND revision.version = screenplay_reviews.screenplay_version
              AND production.owner_id = auth.uid()
        )
    );

COMMENT ON TABLE public.screenplay_reviews IS 'Immutable focused Script Intelligence reviews associated with a saved screenplay revision.';
