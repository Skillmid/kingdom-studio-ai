ALTER TABLE public.characters
    ADD COLUMN IF NOT EXISTS profile_provenance JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'characters_profile_provenance_object_check'
          AND conrelid = 'public.characters'::regclass
    ) THEN
        ALTER TABLE public.characters
            ADD CONSTRAINT characters_profile_provenance_object_check
            CHECK (jsonb_typeof(profile_provenance) = 'object');
    END IF;
END $$;

COMMENT ON COLUMN public.characters.profile_provenance IS
    'Per-field provenance for accepted AI character proposals, including screenplay revision and supporting evidence.';