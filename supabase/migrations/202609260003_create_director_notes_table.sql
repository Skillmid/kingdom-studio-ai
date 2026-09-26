-- AI Director notes consume scene, shot, and storyboard intelligence.

CREATE TABLE IF NOT EXISTS public.director_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
    scene_id UUID REFERENCES public.scenes(id) ON DELETE SET NULL,
    shot_id UUID REFERENCES public.shots(id) ON DELETE SET NULL,
    note_number INTEGER NOT NULL CHECK (note_number >= 1),
    title TEXT,
    scene_intent TEXT,
    blocking TEXT,
    camera TEXT,
    composition TEXT,
    lighting TEXT,
    pacing TEXT,
    sound TEXT,
    emotional_progression TEXT,
    continuity TEXT,
    visual_storytelling TEXT,
    source_evidence TEXT,
    character_ids UUID[] NOT NULL DEFAULT '{}',
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    provenance TEXT NOT NULL DEFAULT 'user'
        CHECK (provenance IN ('user', 'production-derived', 'ai-proposal')),
    user_approved BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'in-progress', 'completed')),
    progress INTEGER NOT NULL DEFAULT 0
        CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_director_notes_production
    ON public.director_notes(production_id);
CREATE INDEX IF NOT EXISTS idx_director_notes_scene
    ON public.director_notes(scene_id);
CREATE INDEX IF NOT EXISTS idx_director_notes_shot
    ON public.director_notes(shot_id);
CREATE INDEX IF NOT EXISTS idx_director_notes_status
    ON public.director_notes(status);

CREATE UNIQUE INDEX IF NOT EXISTS director_notes_production_scene_unique
    ON public.director_notes(production_id, scene_id)
    WHERE scene_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS director_notes_production_number_unique
    ON public.director_notes(production_id, note_number);

DROP TRIGGER IF EXISTS update_director_notes_updated_at ON public.director_notes;
CREATE TRIGGER update_director_notes_updated_at
BEFORE UPDATE ON public.director_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.director_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view director notes in their productions" ON public.director_notes;
CREATE POLICY "Users can view director notes in their productions"
    ON public.director_notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = director_notes.production_id
              AND productions.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create director notes" ON public.director_notes;
CREATE POLICY "Users can create director notes"
    ON public.director_notes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = director_notes.production_id
              AND productions.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update director notes" ON public.director_notes;
CREATE POLICY "Users can update director notes"
    ON public.director_notes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = director_notes.production_id
              AND productions.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = director_notes.production_id
              AND productions.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete director notes" ON public.director_notes;
CREATE POLICY "Users can delete director notes"
    ON public.director_notes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = director_notes.production_id
              AND productions.owner_id = auth.uid()
        )
    );

COMMENT ON TABLE public.director_notes IS
    'Scene-level directing guidance derived from persisted production records or created by the filmmaker.';
