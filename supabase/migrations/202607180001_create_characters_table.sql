-- =====================================================
-- CHARACTERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    production_id UUID NOT NULL
        REFERENCES public.productions(id)
        ON DELETE CASCADE,

    -- =====================================
    -- BASIC INFORMATION
    -- =====================================

    name TEXT NOT NULL,

    role TEXT NOT NULL DEFAULT 'supporting'
        CHECK (
            role IN (
                'lead',
                'supporting',
                'minor',
                'extra'
            )
        ),

    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (
            status IN (
                'draft',
                'in-progress',
                'completed'
            )
        ),

    age TEXT,

    gender TEXT,

    occupation TEXT,

    nationality TEXT,

    ethnicity TEXT,

    biography TEXT,

    -- =====================================
    -- APPEARANCE
    -- =====================================

    appearance TEXT,

    height TEXT,

    weight TEXT,

    eye_color TEXT,

    hair_color TEXT,

    distinguishing_features TEXT,

    -- =====================================
    -- PERSONALITY
    -- =====================================

    personality TEXT,

    strengths TEXT,

    weaknesses TEXT,

    fears TEXT,

    habits TEXT,

    values TEXT,

    -- =====================================
    -- STORY
    -- =====================================

    motivation TEXT,

    goal TEXT,

    conflict TEXT,

    character_arc TEXT,

    spiritual_journey TEXT,

    -- =====================================
    -- SPEECH
    -- =====================================

    speech_style TEXT,

    catch_phrases TEXT,

    -- =====================================
    -- AI
    -- =====================================

    ai_instructions TEXT,

    -- =====================================
    -- PROGRESS
    -- =====================================

    progress INTEGER NOT NULL DEFAULT 0
        CHECK (
            progress >= 0
            AND progress <= 100
        ),

    -- =====================================
    -- METADATA
    -- =====================================

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_characters_production
ON public.characters (production_id);

CREATE INDEX IF NOT EXISTS idx_characters_name
ON public.characters (name);

CREATE INDEX IF NOT EXISTS idx_characters_role
ON public.characters (role);

CREATE INDEX IF NOT EXISTS idx_characters_status
ON public.characters (status);

-- =====================================================
-- UPDATED AT TRIGGER
-- =====================================================

CREATE TRIGGER update_characters_updated_at
BEFORE UPDATE
ON public.characters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.characters
ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES
-- =====================================================

CREATE POLICY "Users can view characters in their productions"
ON public.characters
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.productions
        WHERE productions.id = characters.production_id
        AND productions.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create characters"
ON public.characters
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.productions
        WHERE productions.id = characters.production_id
        AND productions.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update characters"
ON public.characters
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM public.productions
        WHERE productions.id = characters.production_id
        AND productions.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete characters"
ON public.characters
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM public.productions
        WHERE productions.id = characters.production_id
        AND productions.user_id = auth.uid()
    )
);