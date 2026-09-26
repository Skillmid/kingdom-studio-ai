-- =====================================================
-- Character intelligence proposals and provenance
-- =====================================================

CREATE TABLE IF NOT EXISTS public.character_profile_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
    screenplay_version INTEGER,
    proposal JSONB NOT NULL DEFAULT '{}'::jsonb,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_character_profile_proposals_character
ON public.character_profile_proposals(character_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_character_profile_proposals_production
ON public.character_profile_proposals(production_id, created_at DESC);

DROP TRIGGER IF EXISTS update_character_profile_proposals_updated_at
ON public.character_profile_proposals;

CREATE TRIGGER update_character_profile_proposals_updated_at
BEFORE UPDATE ON public.character_profile_proposals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.character_profile_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view character profile proposals" ON public.character_profile_proposals;
CREATE POLICY "Users can view character profile proposals"
ON public.character_profile_proposals FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.productions
        WHERE productions.id = character_profile_proposals.production_id
        AND productions.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can create character profile proposals" ON public.character_profile_proposals;
CREATE POLICY "Users can create character profile proposals"
ON public.character_profile_proposals FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.productions
        WHERE productions.id = character_profile_proposals.production_id
        AND productions.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can update character profile proposals" ON public.character_profile_proposals;
CREATE POLICY "Users can update character profile proposals"
ON public.character_profile_proposals FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.productions
        WHERE productions.id = character_profile_proposals.production_id
        AND productions.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.productions
        WHERE productions.id = character_profile_proposals.production_id
        AND productions.owner_id = auth.uid()
    )
);

COMMENT ON TABLE public.character_profile_proposals IS
'AI-generated character profile proposals. Proposals are reviewable and never silently overwrite character records.';
