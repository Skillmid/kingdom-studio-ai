CREATE OR REPLACE FUNCTION public.claim_video_render_job(
    p_worker_id UUID,
    p_lease_seconds INTEGER DEFAULT 60
)
RETURNS SETOF public.video_render_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_worker_id IS NULL OR p_lease_seconds NOT BETWEEN 15 AND 600 THEN
        RAISE EXCEPTION 'Invalid worker lease parameters';
    END IF;

    UPDATE public.video_render_jobs
    SET status = CASE
            WHEN cancel_requested THEN 'cancelled'
            WHEN attempts >= max_attempts THEN 'failed'
            ELSE 'queued'
        END,
        failure_code = CASE WHEN cancel_requested THEN failure_code ELSE 'worker_lease_expired' END,
        error = CASE WHEN cancel_requested THEN error ELSE 'Worker lease expired before the render completed.' END,
        retryable = CASE WHEN cancel_requested THEN FALSE ELSE attempts < max_attempts END,
        next_attempt_at = CASE
            WHEN cancel_requested OR attempts >= max_attempts THEN next_attempt_at
            ELSE timezone('utc', now()) +
                LEAST(900, 5 * power(2, GREATEST(0, attempts - 1)))::INTEGER * interval '1 second'
        END,
        completed_at = CASE
            WHEN cancel_requested OR attempts >= max_attempts THEN timezone('utc', now())
            ELSE NULL
        END,
        lease_owner = NULL,
        lease_token = NULL,
        lease_expires_at = NULL,
        updated_at = timezone('utc', now())
    WHERE status = 'running'
      AND lease_expires_at <= timezone('utc', now());

    UPDATE public.video_render_jobs
    SET status = 'failed',
        retryable = FALSE,
        failure_code = 'unknown',
        error = 'Render job exhausted its attempt limit.',
        completed_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    WHERE status = 'queued'
      AND attempts >= max_attempts
      AND next_attempt_at <= timezone('utc', now());

    RETURN QUERY
    WITH candidate AS (
        SELECT id
        FROM public.video_render_jobs
        WHERE status = 'queued'
          AND cancel_requested = FALSE
          AND attempts < max_attempts
          AND next_attempt_at <= timezone('utc', now())
        ORDER BY next_attempt_at, created_at
        FOR UPDATE SKIP LOCKED
        LIMIT 1
    )
    UPDATE public.video_render_jobs AS job
    SET status = 'running',
        progress = GREATEST(job.progress, 1),
        attempts = job.attempts + 1,
        started_at = timezone('utc', now()),
        completed_at = NULL,
        lease_owner = p_worker_id,
        lease_token = gen_random_uuid(),
        lease_expires_at = timezone('utc', now()) + make_interval(secs => p_lease_seconds),
        updated_at = timezone('utc', now())
    FROM candidate
    WHERE job.id = candidate.id
    RETURNING job.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.heartbeat_video_render_job(
    p_job_id UUID,
    p_lease_token UUID,
    p_lease_seconds INTEGER DEFAULT 60
)
RETURNS SETOF public.video_render_jobs
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    UPDATE public.video_render_jobs
    SET lease_expires_at = CASE WHEN cancel_requested THEN lease_expires_at
                                ELSE timezone('utc', now()) + make_interval(secs => p_lease_seconds) END,
        updated_at = timezone('utc', now())
    WHERE id = p_job_id
      AND status = 'running'
      AND lease_token = p_lease_token
      AND lease_expires_at > timezone('utc', now())
    RETURNING *;
$$;

CREATE OR REPLACE FUNCTION public.update_video_render_progress(
    p_job_id UUID,
    p_lease_token UUID,
    p_progress INTEGER
)
RETURNS SETOF public.video_render_jobs
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    UPDATE public.video_render_jobs
    SET progress = GREATEST(progress, LEAST(99, GREATEST(0, p_progress))),
        updated_at = timezone('utc', now())
    WHERE id = p_job_id
      AND status = 'running'
      AND cancel_requested = FALSE
      AND lease_token = p_lease_token
      AND lease_expires_at > timezone('utc', now())
    RETURNING *;
$$;

CREATE OR REPLACE FUNCTION public.complete_video_render_job(
    p_job_id UUID,
    p_lease_token UUID,
    p_storage_key TEXT,
    p_storage_url TEXT,
    p_file_size_bytes BIGINT,
    p_duration_seconds NUMERIC,
    p_warnings JSONB DEFAULT '[]'::jsonb
)
RETURNS SETOF public.video_render_jobs
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    UPDATE public.video_render_jobs
    SET status = 'completed',
        progress = 100,
        storage_key = p_storage_key,
        storage_url = p_storage_url,
        file_size_bytes = p_file_size_bytes,
        duration_seconds = p_duration_seconds,
        warnings = p_warnings,
        error = NULL,
        failure_code = NULL,
        retryable = FALSE,
        cancel_requested = FALSE,
        completed_at = timezone('utc', now()),
        lease_owner = NULL,
        lease_token = NULL,
        lease_expires_at = NULL,
        updated_at = timezone('utc', now())
    WHERE id = p_job_id
      AND status = 'running'
      AND cancel_requested = FALSE
      AND lease_token = p_lease_token
      AND lease_expires_at > timezone('utc', now())
      AND p_storage_key = 'productions/' || production_id::text || '/renders/' || id::text || '/' || p_lease_token::text || '.mp4'
      AND p_storage_url IN ('storage://' || p_storage_key, 'local://' || p_storage_key)
      AND p_file_size_bytes BETWEEN 1 AND 268435456
      AND p_duration_seconds > 0
      AND jsonb_typeof(p_warnings) = 'array'
    RETURNING *;
$$;

CREATE OR REPLACE FUNCTION public.fail_video_render_job(
    p_job_id UUID,
    p_lease_token UUID,
    p_failure_code TEXT,
    p_error TEXT,
    p_retryable BOOLEAN
)
RETURNS SETOF public.video_render_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    current_job public.video_render_jobs%ROWTYPE;
BEGIN
    SELECT * INTO current_job
    FROM public.video_render_jobs
    WHERE id = p_job_id
      AND status = 'running'
      AND lease_token = p_lease_token
      AND lease_expires_at > timezone('utc', now())
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    IF current_job.cancel_requested THEN
        UPDATE public.video_render_jobs
        SET status = 'cancelled',
            failure_code = 'cancelled',
            error = 'Render cancelled by creator.',
            retryable = FALSE,
            completed_at = timezone('utc', now()),
            lease_owner = NULL,
            lease_token = NULL,
            lease_expires_at = NULL,
            updated_at = timezone('utc', now())
        WHERE id = p_job_id
        RETURNING * INTO current_job;
        RETURN NEXT current_job;
        RETURN;
    END IF;

    UPDATE public.video_render_jobs
    SET status = CASE WHEN p_retryable AND attempts < max_attempts THEN 'queued' ELSE 'failed' END,
        failure_code = p_failure_code,
        error = left(p_error, 4000),
        retryable = p_retryable AND attempts < max_attempts,
        next_attempt_at = CASE
            WHEN p_retryable AND attempts < max_attempts THEN timezone('utc', now()) +
                LEAST(900, 5 * power(2, GREATEST(0, attempts - 1)))::INTEGER * interval '1 second'
            ELSE next_attempt_at
        END,
        completed_at = CASE WHEN p_retryable AND attempts < max_attempts THEN NULL ELSE timezone('utc', now()) END,
        lease_owner = NULL,
        lease_token = NULL,
        lease_expires_at = NULL,
        updated_at = timezone('utc', now())
    WHERE id = p_job_id
    RETURNING * INTO current_job;

    RETURN NEXT current_job;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_video_render_job(
    p_job_id UUID,
    p_lease_token UUID
)
RETURNS SETOF public.video_render_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    current_job public.video_render_jobs%ROWTYPE;
BEGIN
    UPDATE public.video_render_jobs
    SET status = CASE WHEN cancel_requested THEN 'cancelled' ELSE 'queued' END,
        progress = CASE WHEN cancel_requested THEN progress ELSE 0 END,
        failure_code = CASE WHEN cancel_requested THEN 'cancelled' ELSE 'worker_shutdown' END,
        error = CASE WHEN cancel_requested THEN 'Render cancelled by creator.'
                     ELSE 'Worker is shutting down; render will be retried.' END,
        retryable = NOT cancel_requested,
        attempts = GREATEST(0, attempts - 1),
        next_attempt_at = timezone('utc', now()),
        completed_at = CASE WHEN cancel_requested THEN timezone('utc', now()) ELSE NULL END,
        lease_owner = NULL,
        lease_token = NULL,
        lease_expires_at = NULL,
        updated_at = timezone('utc', now())
    WHERE id = p_job_id
      AND status = 'running'
      AND lease_token = p_lease_token
    RETURNING * INTO current_job;

    IF FOUND THEN RETURN NEXT current_job; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_video_render_job(
    p_job_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS SETOF public.video_render_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    current_job public.video_render_jobs%ROWTYPE;
BEGIN
    UPDATE public.video_render_jobs AS job
    SET status = CASE WHEN job.status = 'queued' THEN 'cancelled' ELSE job.status END,
        cancel_requested = TRUE,
        error = left(COALESCE(NULLIF(trim(p_reason), ''), 'Render cancelled by creator.'), 500),
        failure_code = 'cancelled',
        retryable = FALSE,
        completed_at = CASE WHEN job.status = 'queued' THEN timezone('utc', now()) ELSE job.completed_at END,
        lease_owner = CASE WHEN job.status = 'queued' THEN NULL ELSE job.lease_owner END,
        lease_token = CASE WHEN job.status = 'queued' THEN NULL ELSE job.lease_token END,
        lease_expires_at = CASE WHEN job.status = 'queued' THEN NULL ELSE job.lease_expires_at END,
        updated_at = timezone('utc', now())
    WHERE job.id = p_job_id
      AND job.status IN ('queued', 'running')
      AND EXISTS (
          SELECT 1 FROM public.productions AS production
          WHERE production.id = job.production_id
            AND production.owner_id = auth.uid()
      )
    RETURNING job.* INTO current_job;

    IF FOUND THEN
        RETURN NEXT current_job;
        RETURN;
    END IF;

    SELECT job.* INTO current_job
    FROM public.video_render_jobs AS job
    JOIN public.productions AS production ON production.id = job.production_id
    WHERE job.id = p_job_id AND production.owner_id = auth.uid();
    IF FOUND AND current_job.status = 'cancelled' THEN RETURN NEXT current_job; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.retry_video_render_job(p_job_id UUID)
RETURNS SETOF public.video_render_jobs
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    UPDATE public.video_render_jobs AS job
    SET status = 'queued',
        progress = 0,
        error = NULL,
        failure_code = NULL,
        retryable = TRUE,
        cancel_requested = FALSE,
        started_at = NULL,
        completed_at = NULL,
        next_attempt_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    WHERE job.id = p_job_id
      AND job.status = 'failed'
      AND job.retryable = TRUE
      AND job.attempts < job.max_attempts
      AND EXISTS (
          SELECT 1 FROM public.productions AS production
          WHERE production.id = job.production_id
            AND production.owner_id = auth.uid()
      )
    RETURNING job.*;
$$;

REVOKE ALL ON FUNCTION public.claim_video_render_job(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.heartbeat_video_render_job(UUID, UUID, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_video_render_progress(UUID, UUID, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_video_render_job(UUID, UUID, TEXT, TEXT, BIGINT, NUMERIC, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_video_render_job(UUID, UUID, TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_video_render_job(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_video_render_job(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.heartbeat_video_render_job(UUID, UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_video_render_progress(UUID, UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_video_render_job(UUID, UUID, TEXT, TEXT, BIGINT, NUMERIC, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_video_render_job(UUID, UUID, TEXT, TEXT, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_video_render_job(UUID, UUID) TO service_role;

REVOKE ALL ON FUNCTION public.cancel_video_render_job(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.retry_video_render_job(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_video_render_job(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.retry_video_render_job(UUID) TO authenticated;
