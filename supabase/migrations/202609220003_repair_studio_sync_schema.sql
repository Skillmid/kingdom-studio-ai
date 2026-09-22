-- =====================================================
-- Kingdom Studio AI by Skillmid Creatives
-- Migration: Repair screenplay-driven Story Bible / Location / Scene schema
--
-- This migration is intentionally defensive. The application already has
-- screenplay sync workflows for these modules, so the database must expose
-- the corresponding tables/columns even when an earlier migration was not
-- applied to an existing Supabase project.
-- =====================================================

-- -----------------------------------------------------
-- Story Bible foundation fields
-- -----------------------------------------------------
ALTER TABLE IF EXISTS public.story_bibles
    ADD COLUMN IF NOT EXISTS burden TEXT,
    ADD COLUMN IF NOT EXISTS truth TEXT,
    ADD COLUMN IF NOT EXISTS human_problem TEXT,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS logline TEXT,
    ADD COLUMN IF NOT EXISTS synopsis TEXT,
    ADD COLUMN IF NOT EXISTS theme TEXT,
    ADD COLUMN IF NOT EXISTS core_message TEXT,
    ADD COLUMN IF NOT EXISTS scripture_foundation TEXT,
    ADD COLUMN IF NOT EXISTS kingdom_objective TEXT,
    ADD COLUMN IF NOT EXISTS target_audience TEXT,
    ADD COLUMN IF NOT EXISTS genre TEXT,
    ADD COLUMN IF NOT EXISTS tone TEXT,
    ADD COLUMN IF NOT EXISTS language TEXT,
    ADD COLUMN IF NOT EXISTS visual_style TEXT,
    ADD COLUMN IF NOT EXISTS aspect_ratio TEXT,
    ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
    ADD COLUMN IF NOT EXISTS universe TEXT,
    ADD COLUMN IF NOT EXISTS time_period TEXT,
    ADD COLUMN IF NOT EXISTS primary_location TEXT,
    ADD COLUMN IF NOT EXISTS beginning TEXT,
    ADD COLUMN IF NOT EXISTS conflict TEXT,
    ADD COLUMN IF NOT EXISTS midpoint TEXT,
    ADD COLUMN IF NOT EXISTS climax TEXT,
    ADD COLUMN IF NOT EXISTS ending TEXT,
    ADD COLUMN IF NOT EXISTS ai_context TEXT,
    ADD COLUMN IF NOT EXISTS ai_rules TEXT,
    ADD COLUMN IF NOT EXISTS forbidden_elements TEXT,
    ADD COLUMN IF NOT EXISTS preferred_vocabulary TEXT,
    ADD COLUMN IF NOT EXISTS visual_consistency TEXT;

-- -----------------------------------------------------
-- Scenes
-- -----------------------------------------------------
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
            status IN ('draft', 'in-progress', 'completed')
        ),

    progress INTEGER NOT NULL DEFAULT 0
        CHECK (progress >= 0 AND progress <= 100),

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

    CONSTRAINT scenes_production_number_unique
        UNIQUE (production_id, scene_number)
);

ALTER TABLE public.scenes
    ADD COLUMN IF NOT EXISTS location_id UUID;

CREATE INDEX IF NOT EXISTS idx_scenes_production
    ON public.scenes(production_id);

CREATE INDEX IF NOT EXISTS idx_scenes_status
    ON public.scenes(status);

CREATE INDEX IF NOT EXISTS idx_scenes_location
    ON public.scenes(location_id);

DROP TRIGGER IF EXISTS update_scenes_updated_at
    ON public.scenes;

CREATE TRIGGER update_scenes_updated_at
BEFORE UPDATE ON public.scenes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view scenes in their productions"
    ON public.scenes;
CREATE POLICY "Users can view scenes in their productions"
    ON public.scenes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = scenes.production_id
              AND productions.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create scenes"
    ON public.scenes;
CREATE POLICY "Users can create scenes"
    ON public.scenes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = scenes.production_id
              AND productions.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update scenes"
    ON public.scenes;
CREATE POLICY "Users can update scenes"
    ON public.scenes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = scenes.production_id
              AND productions.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = scenes.production_id
              AND productions.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete scenes"
    ON public.scenes;
CREATE POLICY "Users can delete scenes"
    ON public.scenes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = scenes.production_id
              AND productions.owner_id = auth.uid()
        )
    );

-- -----------------------------------------------------
-- Locations
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    production_id UUID NOT NULL
        REFERENCES public.productions(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    description TEXT,

    setting TEXT NOT NULL DEFAULT 'interior'
        CHECK (setting IN ('interior', 'exterior', 'both')),

    notes TEXT,

    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'in-progress', 'completed')),

    progress INTEGER NOT NULL DEFAULT 0
        CHECK (progress >= 0 AND progress <= 100),

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_locations_production
    ON public.locations(production_id);

CREATE INDEX IF NOT EXISTS idx_locations_name
    ON public.locations(name);

CREATE INDEX IF NOT EXISTS idx_locations_status
    ON public.locations(status);

CREATE INDEX IF NOT EXISTS idx_locations_setting
    ON public.locations(setting);

DROP TRIGGER IF EXISTS update_locations_updated_at
    ON public.locations;

CREATE TRIGGER update_locations_updated_at
BEFORE UPDATE ON public.locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view locations in their productions"
    ON public.locations;
CREATE POLICY "Users can view locations in their productions"
    ON public.locations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = locations.production_id
              AND productions.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create locations"
    ON public.locations;
CREATE POLICY "Users can create locations"
    ON public.locations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = locations.production_id
              AND productions.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update locations"
    ON public.locations;
CREATE POLICY "Users can update locations"
    ON public.locations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = locations.production_id
              AND productions.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = locations.production_id
              AND productions.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete locations"
    ON public.locations;
CREATE POLICY "Users can delete locations"
    ON public.locations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = locations.production_id
              AND productions.owner_id = auth.uid()
        )
    );

-- -----------------------------------------------------
-- Link scenes to locations after both tables exist.
-- -----------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'scenes_location_id_fkey'
          AND conrelid = 'public.scenes'::regclass
    ) THEN
        ALTER TABLE public.scenes
            ADD CONSTRAINT scenes_location_id_fkey
            FOREIGN KEY (location_id)
            REFERENCES public.locations(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- Ask PostgREST to refresh its schema cache immediately.
NOTIFY pgrst, 'reload schema';
