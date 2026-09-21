-- =====================================================
-- Kingdom Studio AI by Skillmid Creatives
-- Migration: Create Locations
-- =====================================================

CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    production_id UUID NOT NULL
        REFERENCES public.productions(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    description TEXT,

    setting TEXT NOT NULL DEFAULT 'interior'
        CHECK (
            setting IN (
                'interior',
                'exterior',
                'both'
            )
        ),

    notes TEXT,

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
        DEFAULT timezone('utc', now())
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
BEFORE UPDATE
ON public.locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.locations
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS
"Users can view locations in their productions"
ON public.locations;

CREATE POLICY
"Users can view locations in their productions"
ON public.locations
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.productions
        WHERE productions.id = locations.production_id
        AND productions.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS
"Users can create locations"
ON public.locations;

CREATE POLICY
"Users can create locations"
ON public.locations
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.productions
        WHERE productions.id = locations.production_id
        AND productions.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS
"Users can update locations"
ON public.locations;

CREATE POLICY
"Users can update locations"
ON public.locations
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM public.productions
        WHERE productions.id = locations.production_id
        AND productions.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.productions
        WHERE productions.id = locations.production_id
        AND productions.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS
"Users can delete locations"
ON public.locations;

CREATE POLICY
"Users can delete locations"
ON public.locations
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM public.productions
        WHERE productions.id = locations.production_id
        AND productions.owner_id = auth.uid()
    )
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'scenes_location_id_fkey'
    ) THEN
        ALTER TABLE public.scenes
        ADD CONSTRAINT scenes_location_id_fkey
        FOREIGN KEY (location_id)
        REFERENCES public.locations(id)
        ON DELETE SET NULL;
    END IF;
END $$;

COMMENT ON TABLE public.locations IS
'Location records belonging to Kingdom Studio AI productions.';
