-- Run with `supabase test db` after the migrations on an isolated local/test database.
-- This test is transactional and performs no persistent fixture writes.
BEGIN;

DO $$
DECLARE
    missing_columns TEXT[];
    story_bibles_oid REGCLASS := to_regclass('public.story_bibles');
    expected_columns TEXT[] := ARRAY[
        'id', 'production_id', 'title', 'logline', 'synopsis', 'burden', 'truth',
        'human_problem', 'theme', 'core_message', 'scripture_foundation',
        'kingdom_objective', 'target_audience', 'genre', 'tone', 'language',
        'visual_style', 'aspect_ratio', 'duration_minutes', 'universe', 'time_period',
        'primary_location', 'beginning', 'conflict', 'midpoint', 'climax', 'ending',
        'ai_context', 'ai_rules', 'forbidden_elements', 'preferred_vocabulary',
        'visual_consistency', 'created_at', 'updated_at'
    ];
BEGIN
    IF story_bibles_oid IS NULL THEN
        RAISE EXCEPTION 'Missing public.story_bibles';
    END IF;

    SELECT array_agg(required.column_name)
    INTO missing_columns
    FROM unnest(expected_columns) AS required(column_name)
    LEFT JOIN information_schema.columns AS actual
      ON actual.table_schema = 'public'
     AND actual.table_name = 'story_bibles'
     AND actual.column_name = required.column_name
    WHERE actual.column_name IS NULL;

    IF missing_columns IS NOT NULL THEN
        RAISE EXCEPTION 'Missing Story Bible columns: %', array_to_string(missing_columns, ', ');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = story_bibles_oid
          AND conname = 'story_bibles_production_id_fkey'
          AND contype = 'f'
    ) THEN
        RAISE EXCEPTION 'Story Bible production foreign key is missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_index AS index_record
        WHERE index_record.indrelid = story_bibles_oid
          AND index_record.indisunique
          AND pg_get_indexdef(index_record.indexrelid) ILIKE '%(production_id)%'
    ) THEN
        RAISE EXCEPTION 'One-Story-Bible-per-production unique index is missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_class
        WHERE oid = story_bibles_oid AND relrowsecurity
    ) THEN
        RAISE EXCEPTION 'Row-level security is not enabled on Story Bibles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policy
        WHERE polrelid = story_bibles_oid AND polcmd = 'r'
          AND position('auth.uid()' IN lower(pg_get_expr(polqual, polrelid))) > 0
          AND position('owner_id' IN lower(pg_get_expr(polqual, polrelid))) > 0
    ) THEN
        RAISE EXCEPTION 'Owner-scoped Story Bible SELECT policy is missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policy
        WHERE polrelid = story_bibles_oid AND polcmd = 'a'
          AND position('auth.uid()' IN lower(pg_get_expr(polwithcheck, polrelid))) > 0
          AND position('owner_id' IN lower(pg_get_expr(polwithcheck, polrelid))) > 0
    ) THEN
        RAISE EXCEPTION 'Owner-scoped Story Bible INSERT policy is missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policy
        WHERE polrelid = story_bibles_oid AND polcmd = 'w'
          AND position('auth.uid()' IN lower(pg_get_expr(polqual, polrelid))) > 0
          AND position('owner_id' IN lower(pg_get_expr(polqual, polrelid))) > 0
          AND position('auth.uid()' IN lower(pg_get_expr(polwithcheck, polrelid))) > 0
          AND position('owner_id' IN lower(pg_get_expr(polwithcheck, polrelid))) > 0
    ) THEN
        RAISE EXCEPTION 'Owner-scoped Story Bible UPDATE policy is missing or incomplete';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policy
        WHERE polrelid = story_bibles_oid AND polcmd = 'd'
          AND position('auth.uid()' IN lower(pg_get_expr(polqual, polrelid))) > 0
          AND position('owner_id' IN lower(pg_get_expr(polqual, polrelid))) > 0
    ) THEN
        RAISE EXCEPTION 'Owner-scoped Story Bible DELETE policy is missing';
    END IF;
END $$;

ROLLBACK;
