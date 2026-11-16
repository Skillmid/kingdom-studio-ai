-- Private, production-owned media storage for generated image outputs.
-- File URLs in public.assets store a storage:// reference, never expiring signed URLs.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'production-media',
  'production-media',
  FALSE,
  20971520,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = FALSE,
    file_size_limit = 20971520,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp'];

DROP POLICY IF EXISTS "Production owners can read generated media" ON storage.objects;
CREATE POLICY "Production owners can read generated media"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'production-media'
  AND EXISTS (
    SELECT 1
    FROM public.assets a
    JOIN public.productions p ON p.id = a.production_id
    WHERE a.id::text = (storage.foldername(name))[2]
      AND a.production_id::text = (storage.foldername(name))[1]
      AND p.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Production owners can upload generated media" ON storage.objects;
CREATE POLICY "Production owners can upload generated media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'production-media'
  AND EXISTS (
    SELECT 1
    FROM public.assets a
    JOIN public.productions p ON p.id = a.production_id
    WHERE a.id::text = (storage.foldername(name))[2]
      AND a.production_id::text = (storage.foldername(name))[1]
      AND p.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Production owners can delete generated media" ON storage.objects;
CREATE POLICY "Production owners can delete generated media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'production-media'
  AND EXISTS (
    SELECT 1
    FROM public.assets a
    JOIN public.productions p ON p.id = a.production_id
    WHERE a.id::text = (storage.foldername(name))[2]
      AND a.production_id::text = (storage.foldername(name))[1]
      AND p.owner_id = auth.uid()
  )
);

COMMENT ON TABLE storage.objects IS 'Generated production media is stored privately and served through short-lived signed URLs under production-owner RLS.';
