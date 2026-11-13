-- Run with `supabase test db` after migrations on an isolated local/test database.
BEGIN;

DO $$
DECLARE
    productions_oid REGCLASS := to_regclass('public.productions');
    missing_columns TEXT[];
    expected_columns TEXT[] := ARRAY[
        'id', 'owner_id', 'created_by', 'title', 'slug', 'target_duration_seconds',
        'cover_image_url', 'last_opened_at', 'deleted_at', 'created_at', 'updated_at'
    ];
BEGIN
    IF productions_oid IS NULL THEN
        RAISE EXCEPTION 'Missing public.productions';
    END IF;

    SELECT array_agg(required.column_name)
    INTO missing_columns
    FROM unnest(expected_columns) AS required(column_name)
    LEFT JOIN information_schema.columns AS actual
      ON actual.table_schema = 'public'
     AND actual.table_name = 'productions'
     AND actual.column_name = required.column_name
    WHERE actual.column_name IS NULL;

    IF missing_columns IS NOT NULL THEN
        RAISE EXCEPTION 'Missing production columns: %', array_to_string(missing_columns, ', ');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'productions'
          AND column_name = 'created_by'
          AND is_nullable = 'NO'
    ) THEN
        RAISE EXCEPTION 'Production created_by must be NOT NULL';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = productions_oid
          AND contype = 'f'
          AND conkey = ARRAY[(
              SELECT attnum FROM pg_attribute
              WHERE attrelid = productions_oid AND attname = 'created_by'
          )]::SMALLINT[]
          AND confrelid = 'auth.users'::regclass
    ) THEN
        RAISE EXCEPTION 'Production created_by must reference auth.users';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_class
        WHERE oid = productions_oid AND relrowsecurity
    ) THEN
        RAISE EXCEPTION 'Row-level security is not enabled on productions';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policy
        WHERE polrelid = productions_oid AND polcmd = 'r'
          AND position('auth.uid()' IN lower(pg_get_expr(polqual, polrelid))) > 0
          AND position('owner_id' IN lower(pg_get_expr(polqual, polrelid))) > 0
    ) THEN
        RAISE EXCEPTION 'Owner-scoped production SELECT policy is missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policy
        WHERE polrelid = productions_oid AND polcmd = 'a'
          AND position('auth.uid()' IN lower(pg_get_expr(polwithcheck, polrelid))) > 0
          AND position('owner_id' IN lower(pg_get_expr(polwithcheck, polrelid))) > 0
    ) THEN
        RAISE EXCEPTION 'Owner-scoped production INSERT policy is missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policy
        WHERE polrelid = productions_oid AND polcmd = 'w'
          AND position('auth.uid()' IN lower(pg_get_expr(polqual, polrelid))) > 0
          AND position('owner_id' IN lower(pg_get_expr(polqual, polrelid))) > 0
          AND position('auth.uid()' IN lower(pg_get_expr(polwithcheck, polrelid))) > 0
          AND position('owner_id' IN lower(pg_get_expr(polwithcheck, polrelid))) > 0
    ) THEN
        RAISE EXCEPTION 'Owner-scoped production UPDATE policy is missing or incomplete';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policy
        WHERE polrelid = productions_oid AND polcmd = 'd'
          AND position('auth.uid()' IN lower(pg_get_expr(polqual, polrelid))) > 0
          AND position('owner_id' IN lower(pg_get_expr(polqual, polrelid))) > 0
    ) THEN
        RAISE EXCEPTION 'Owner-scoped production DELETE policy is missing';
    END IF;
END $$;

ROLLBACK;
