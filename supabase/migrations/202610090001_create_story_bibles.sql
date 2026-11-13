-- Story Bible schema used by the production-scoped editor and screenplay sync.
-- Safe for clean installs and additive upgrades. Existing rows are preserved.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.story_bibles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL
        REFERENCES public.productions(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Story Bible',
    logline TEXT,
    synopsis TEXT,
    burden TEXT,
    truth TEXT,
    human_problem TEXT,
    theme TEXT,
    core_message TEXT,
    scripture_foundation TEXT,
    kingdom_objective TEXT,
    target_audience TEXT,
    genre TEXT,
    tone TEXT,
    language TEXT NOT NULL DEFAULT 'English',
    visual_style TEXT,
    aspect_ratio TEXT NOT NULL DEFAULT '16:9',
    duration_minutes INTEGER NOT NULL DEFAULT 10 CHECK (duration_minutes > 0),
    universe TEXT,
    time_period TEXT,
    primary_location TEXT,
    beginning TEXT,
    conflict TEXT,
    midpoint TEXT,
    climax TEXT,
    ending TEXT,
    ai_context TEXT,
    ai_rules TEXT,
    forbidden_elements TEXT,
    preferred_vocabulary TEXT,
    visual_consistency TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Reconcile installations where a partial Story Bible table was provisioned manually.
ALTER TABLE public.story_bibles
    ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS production_id UUID,
    ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Untitled Story Bible',
    ADD COLUMN IF NOT EXISTS logline TEXT,
    ADD COLUMN IF NOT EXISTS synopsis TEXT,
    ADD COLUMN IF NOT EXISTS burden TEXT,
    ADD COLUMN IF NOT EXISTS truth TEXT,
    ADD COLUMN IF NOT EXISTS human_problem TEXT,
    ADD COLUMN IF NOT EXISTS theme TEXT,
    ADD COLUMN IF NOT EXISTS core_message TEXT,
    ADD COLUMN IF NOT EXISTS scripture_foundation TEXT,
    ADD COLUMN IF NOT EXISTS kingdom_objective TEXT,
    ADD COLUMN IF NOT EXISTS target_audience TEXT,
    ADD COLUMN IF NOT EXISTS genre TEXT,
    ADD COLUMN IF NOT EXISTS tone TEXT,
    ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'English',
    ADD COLUMN IF NOT EXISTS visual_style TEXT,
    ADD COLUMN IF NOT EXISTS aspect_ratio TEXT NOT NULL DEFAULT '16:9',
    ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 10,
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
    ADD COLUMN IF NOT EXISTS visual_consistency TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now());

-- Populate only missing legacy values. Existing authored content is untouched.
UPDATE public.story_bibles
SET id = COALESCE(id, gen_random_uuid()),
    title = COALESCE(title, 'Untitled Story Bible'),
    language = COALESCE(language, 'English'),
    aspect_ratio = COALESCE(aspect_ratio, '16:9'),
    duration_minutes = CASE WHEN duration_minutes IS NULL OR duration_minutes <= 0 THEN 10 ELSE duration_minutes END,
    created_at = COALESCE(created_at, timezone('utc', now())),
    updated_at = COALESCE(updated_at, timezone('utc', now()))
WHERE id IS NULL
   OR title IS NULL
   OR language IS NULL
   OR aspect_ratio IS NULL
   OR duration_minutes IS NULL
   OR duration_minutes <= 0
   OR created_at IS NULL
   OR updated_at IS NULL;

ALTER TABLE public.story_bibles
    ALTER COLUMN id SET DEFAULT gen_random_uuid(),
    ALTER COLUMN id SET NOT NULL,
    ALTER COLUMN title SET DEFAULT 'Untitled Story Bible',
    ALTER COLUMN title SET NOT NULL,
    ALTER COLUMN language SET DEFAULT 'English',
    ALTER COLUMN language SET NOT NULL,
    ALTER COLUMN aspect_ratio SET DEFAULT '16:9',
    ALTER COLUMN aspect_ratio SET NOT NULL,
    ALTER COLUMN duration_minutes SET DEFAULT 10,
    ALTER COLUMN duration_minutes SET NOT NULL,
    ALTER COLUMN created_at SET DEFAULT timezone('utc', now()),
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET DEFAULT timezone('utc', now()),
    ALTER COLUMN updated_at SET NOT NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.story_bibles WHERE production_id IS NULL) THEN
        RAISE EXCEPTION 'Cannot attach existing Story Bible rows: production_id is null. Backfill each row to its owning production, then rerun this migration.';
    END IF;

    IF EXISTS (
        SELECT production_id
        FROM public.story_bibles
        GROUP BY production_id
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cannot enforce one Story Bible per production: duplicate production_id values exist. Reconcile duplicates without deleting approved content, then rerun this migration.';
    END IF;

    IF EXISTS (
        SELECT id
        FROM public.story_bibles
        GROUP BY id
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cannot establish Story Bible row identity: duplicate id values exist. Reconcile identifiers, then rerun this migration.';
    END IF;
END $$;

ALTER TABLE public.story_bibles
    ALTER COLUMN production_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS story_bibles_production_id_uidx
    ON public.story_bibles(production_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'story_bibles_production_id_fkey'
          AND conrelid = 'public.story_bibles'::regclass
    ) THEN
        ALTER TABLE public.story_bibles
            ADD CONSTRAINT story_bibles_production_id_fkey
            FOREIGN KEY (production_id)
            REFERENCES public.productions(id)
            ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'story_bibles_duration_minutes_check'
          AND conrelid = 'public.story_bibles'::regclass
    ) THEN
        ALTER TABLE public.story_bibles
            ADD CONSTRAINT story_bibles_duration_minutes_check
            CHECK (duration_minutes > 0) NOT VALID;
    END IF;
END $$;

DROP TRIGGER IF EXISTS update_story_bibles_updated_at
    ON public.story_bibles;

CREATE TRIGGER update_story_bibles_updated_at
BEFORE UPDATE ON public.story_bibles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.story_bibles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage story bibles of their productions"
    ON public.story_bibles;

DROP POLICY IF EXISTS "Users can view Story Bibles in their productions"
    ON public.story_bibles;
CREATE POLICY "Users can view Story Bibles in their productions"
    ON public.story_bibles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = story_bibles.production_id
              AND productions.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create Story Bibles in their productions"
    ON public.story_bibles;
CREATE POLICY "Users can create Story Bibles in their productions"
    ON public.story_bibles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = story_bibles.production_id
              AND productions.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update Story Bibles in their productions"
    ON public.story_bibles;
CREATE POLICY "Users can update Story Bibles in their productions"
    ON public.story_bibles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = story_bibles.production_id
              AND productions.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = story_bibles.production_id
              AND productions.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete Story Bibles in their productions"
    ON public.story_bibles;
CREATE POLICY "Users can delete Story Bibles in their productions"
    ON public.story_bibles FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.productions
            WHERE productions.id = story_bibles.production_id
              AND productions.owner_id = auth.uid()
        )
    );

COMMENT ON TABLE public.story_bibles IS
    'One user-owned Story Bible per production; screenplay sync proposals remain subject to creator review.';

NOTIFY pgrst, 'reload schema';
