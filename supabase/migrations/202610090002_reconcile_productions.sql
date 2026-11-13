-- Reconcile the production root schema with the fields used by current repositories.
-- Existing production rows are retained; legacy values are copied only where possible.

ALTER TABLE public.productions
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS target_duration_seconds INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
    ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- New columns already receive defaults; repair nulls only on older partially migrated tables.
UPDATE public.productions
SET created_by = owner_id
WHERE created_by IS NULL;

UPDATE public.productions
SET target_duration_seconds = 0
WHERE target_duration_seconds IS NULL;

-- The original base migration named this field `cover_image`; current code uses `cover_image_url`.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'productions'
          AND column_name = 'cover_image'
    ) THEN
        EXECUTE $sql$
            UPDATE public.productions
            SET cover_image_url = cover_image
            WHERE cover_image_url IS NULL AND cover_image IS NOT NULL
        $sql$;
    END IF;
END $$;

ALTER TABLE public.productions
    ALTER COLUMN created_by SET NOT NULL,
    ALTER COLUMN target_duration_seconds SET DEFAULT 0,
    ALTER COLUMN target_duration_seconds SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.productions'::regclass
          AND conname = 'productions_created_by_fkey'
    ) THEN
        ALTER TABLE public.productions
            ADD CONSTRAINT productions_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES auth.users(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS productions_owner_deleted_updated_idx
    ON public.productions(owner_id, deleted_at, updated_at DESC);

-- Harden update policy to ensure the caller remains the owner upon update.
DROP POLICY IF EXISTS "Users can update own productions"
    ON public.productions;

CREATE POLICY "Users can update own productions"
    ON public.productions FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

COMMENT ON COLUMN public.productions.created_by IS
    'Authenticated user who created the production; backfilled from owner_id for legacy rows.';

COMMENT ON COLUMN public.productions.target_duration_seconds IS
    'Planned production runtime in seconds.';
