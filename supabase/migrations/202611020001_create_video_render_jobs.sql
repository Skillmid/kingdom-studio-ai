CREATE TABLE IF NOT EXISTS public.video_render_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
    render_id UUID NOT NULL REFERENCES public.render_sequences(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 5),
    retryable BOOLEAN NOT NULL DEFAULT TRUE,
    failure_code TEXT,
    error TEXT,
    clips JSONB NOT NULL CHECK (jsonb_typeof(clips) = 'array' AND jsonb_array_length(clips) BETWEEN 1 AND 25),
    config JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(config) = 'object'),
    storage_url TEXT,
    storage_key TEXT,
    output_path TEXT,
    file_size_bytes BIGINT CHECK (file_size_bytes IS NULL OR file_size_bytes BETWEEN 1 AND 268435456),
    duration_seconds NUMERIC CHECK (duration_seconds IS NULL OR duration_seconds > 0),
    warnings JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(warnings) = 'array'),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    lease_owner UUID,
    lease_token UUID,
    lease_expires_at TIMESTAMPTZ,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    cancel_requested BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT video_render_jobs_attempt_cap CHECK (attempts <= max_attempts),
    CONSTRAINT video_render_jobs_storage_key_shape CHECK (
        storage_key IS NULL OR storage_key ~* '^productions/[0-9a-f-]{36}/renders/[0-9a-f-]{36}/[0-9a-f-]{36}\.mp4$'
    ),
    CONSTRAINT video_render_jobs_storage_url_matches_key CHECK (
        storage_url IS NULL OR storage_key IS NOT NULL AND storage_url IN (
            'storage://' || storage_key,
            'local://' || storage_key
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_video_render_jobs_production_created
    ON public.video_render_jobs(production_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_render_jobs_queued
    ON public.video_render_jobs(status, next_attempt_at, created_at)
    WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_video_render_jobs_expired_lease
    ON public.video_render_jobs(lease_expires_at)
    WHERE status = 'running';

DROP TRIGGER IF EXISTS update_video_render_jobs_updated_at ON public.video_render_jobs;
CREATE TRIGGER update_video_render_jobs_updated_at BEFORE UPDATE ON public.video_render_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.video_render_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.video_render_jobs FROM PUBLIC, anon;
GRANT SELECT, INSERT ON TABLE public.video_render_jobs TO authenticated;
GRANT SELECT ON TABLE public.video_render_jobs TO service_role;
DROP POLICY IF EXISTS "Users can view render jobs in their productions" ON public.video_render_jobs;
CREATE POLICY "Users can view render jobs in their productions" ON public.video_render_jobs FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.productions
    WHERE productions.id = video_render_jobs.production_id
      AND productions.owner_id = auth.uid()
));
DROP POLICY IF EXISTS "Users can create render jobs in their productions" ON public.video_render_jobs;
CREATE POLICY "Users can create render jobs in their productions" ON public.video_render_jobs FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.productions
    WHERE productions.id = video_render_jobs.production_id
      AND productions.owner_id = auth.uid()
));
DROP POLICY IF EXISTS "Users can update render jobs in their productions" ON public.video_render_jobs;
DROP POLICY IF EXISTS "Users can delete render jobs in their productions" ON public.video_render_jobs;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('renders', 'renders', FALSE, 268435456, ARRAY['video/mp4'])
ON CONFLICT (id) DO UPDATE
SET public = FALSE,
    file_size_limit = 268435456,
    allowed_mime_types = ARRAY['video/mp4'];

DROP POLICY IF EXISTS "Production owners can read render objects" ON storage.objects;
CREATE POLICY "Production owners can read render objects" ON storage.objects FOR SELECT
USING (
    bucket_id = 'renders'
    AND EXISTS (
        SELECT 1 FROM public.productions
        WHERE productions.id::text = split_part(storage.objects.name, '/', 2)
          AND productions.owner_id = auth.uid()
    )
);
DROP POLICY IF EXISTS "Production owners can upload render objects" ON storage.objects;
CREATE POLICY "Production owners can upload render objects" ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'renders'
    AND EXISTS (
        SELECT 1 FROM public.productions
        WHERE productions.id::text = split_part(storage.objects.name, '/', 2)
          AND productions.owner_id = auth.uid()
    )
);
DROP POLICY IF EXISTS "Production owners can update render objects" ON storage.objects;
CREATE POLICY "Production owners can update render objects" ON storage.objects FOR UPDATE
USING (
    bucket_id = 'renders'
    AND EXISTS (
        SELECT 1 FROM public.productions
        WHERE productions.id::text = split_part(storage.objects.name, '/', 2)
          AND productions.owner_id = auth.uid()
    )
)
WITH CHECK (
    bucket_id = 'renders'
    AND EXISTS (
        SELECT 1 FROM public.productions
        WHERE productions.id::text = split_part(storage.objects.name, '/', 2)
          AND productions.owner_id = auth.uid()
    )
);
DROP POLICY IF EXISTS "Production owners can delete render objects" ON storage.objects;
CREATE POLICY "Production owners can delete render objects" ON storage.objects FOR DELETE
USING (
    bucket_id = 'renders'
    AND EXISTS (
        SELECT 1 FROM public.productions
        WHERE productions.id::text = split_part(storage.objects.name, '/', 2)
          AND productions.owner_id = auth.uid()
    )
);
