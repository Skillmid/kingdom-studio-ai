-- Run against an isolated local database after all migrations have been applied.
BEGIN;

DO $$
DECLARE
    jobs_oid REGCLASS := to_regclass('public.video_render_jobs');
    storage_objects_oid REGCLASS := to_regclass('storage.objects');
    missing_constraints TEXT[];
    required_constraints TEXT[] := ARRAY[
        'video_render_jobs_attempt_cap',
        'video_render_jobs_storage_key_shape',
        'video_render_jobs_storage_url_matches_key'
    ];
    missing_indexes TEXT[];
    required_indexes TEXT[] := ARRAY[
        'idx_video_render_jobs_production_created',
        'idx_video_render_jobs_queued',
        'idx_video_render_jobs_expired_lease'
    ];
BEGIN
    IF jobs_oid IS NULL THEN
        RAISE EXCEPTION 'Missing public.video_render_jobs';
    END IF;

    SELECT array_agg(required.constraint_name)
    INTO missing_constraints
    FROM unnest(required_constraints) AS required(constraint_name)
    WHERE NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = jobs_oid AND conname = required.constraint_name
    );
    IF missing_constraints IS NOT NULL THEN
        RAISE EXCEPTION 'Missing render-job constraints: %', array_to_string(missing_constraints, ', ');
    END IF;

    SELECT array_agg(required.index_name)
    INTO missing_indexes
    FROM unnest(required_indexes) AS required(index_name)
    WHERE NOT EXISTS (
        SELECT 1 FROM pg_index AS index_record
        WHERE index_record.indrelid = jobs_oid
          AND index_record.indexrelid = to_regclass('public.' || required.index_name)
          AND index_record.indisvalid
    );
    IF missing_indexes IS NOT NULL THEN
        RAISE EXCEPTION 'Missing render-job indexes: %', array_to_string(missing_indexes, ', ');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid = jobs_oid AND relrowsecurity) THEN
        RAISE EXCEPTION 'Row-level security is not enabled on render jobs';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy
        WHERE polrelid = jobs_oid
          AND polname = 'Users can view render jobs in their productions'
          AND position('auth.uid()' IN lower(pg_get_expr(polqual, polrelid))) > 0
          AND position('owner_id' IN lower(pg_get_expr(polqual, polrelid))) > 0
    ) THEN
        RAISE EXCEPTION 'Owner-scoped render-job SELECT policy is missing';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy
        WHERE polrelid = jobs_oid
          AND polname = 'Users can create render jobs in their productions'
          AND position('auth.uid()' IN lower(pg_get_expr(polwithcheck, polrelid))) > 0
          AND position('owner_id' IN lower(pg_get_expr(polwithcheck, polrelid))) > 0
    ) THEN
        RAISE EXCEPTION 'Owner-scoped render-job INSERT policy is missing';
    END IF;

    IF NOT has_table_privilege('authenticated', jobs_oid, 'SELECT')
       OR NOT has_table_privilege('authenticated', jobs_oid, 'INSERT')
       OR NOT has_table_privilege('service_role', jobs_oid, 'SELECT') THEN
        RAISE EXCEPTION 'Render-job table grants are incomplete';
    END IF;
    IF has_table_privilege('anon', jobs_oid, 'SELECT')
       OR has_table_privilege('anon', jobs_oid, 'INSERT') THEN
        RAISE EXCEPTION 'Anonymous role has render-job table access';
    END IF;

    IF NOT has_function_privilege('service_role', 'public.claim_video_render_job(uuid,integer)', 'EXECUTE')
       OR NOT has_function_privilege('service_role', 'public.heartbeat_video_render_job(uuid,uuid,integer)', 'EXECUTE')
       OR NOT has_function_privilege('service_role', 'public.complete_video_render_job(uuid,uuid,text,text,bigint,numeric,jsonb)', 'EXECUTE')
       OR NOT has_function_privilege('service_role', 'public.fail_video_render_job(uuid,uuid,text,text,boolean)', 'EXECUTE')
       OR NOT has_function_privilege('service_role', 'public.release_video_render_job(uuid,uuid)', 'EXECUTE') THEN
        RAISE EXCEPTION 'Render worker RPC grants are incomplete';
    END IF;
    IF has_function_privilege('authenticated', 'public.claim_video_render_job(uuid,integer)', 'EXECUTE')
       OR has_function_privilege('anon', 'public.claim_video_render_job(uuid,integer)', 'EXECUTE') THEN
        RAISE EXCEPTION 'Non-worker role can execute the worker claim RPC';
    END IF;
    IF NOT has_function_privilege('authenticated', 'public.cancel_video_render_job(uuid,text)', 'EXECUTE')
       OR NOT has_function_privilege('authenticated', 'public.retry_video_render_job(uuid)', 'EXECUTE')
       OR has_function_privilege('anon', 'public.cancel_video_render_job(uuid,text)', 'EXECUTE')
       OR has_function_privilege('anon', 'public.retry_video_render_job(uuid)', 'EXECUTE') THEN
        RAISE EXCEPTION 'Owner cancel/retry RPC grants are incorrect';
    END IF;

    IF storage_objects_oid IS NULL
       OR NOT EXISTS (
          SELECT 1 FROM pg_policy
          WHERE polrelid = storage_objects_oid
            AND polname = 'Production owners can read render objects'
            AND position('owner_id' IN lower(pg_get_expr(polqual, polrelid))) > 0
       )
       OR NOT EXISTS (
          SELECT 1 FROM storage.buckets
          WHERE id = 'renders' AND public = FALSE AND file_size_limit = 268435456
       ) THEN
        RAISE EXCEPTION 'Private owner-scoped render storage is not configured';
    END IF;
END $$;

ROLLBACK;
