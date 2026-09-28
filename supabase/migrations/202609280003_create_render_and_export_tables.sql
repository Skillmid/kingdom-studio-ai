-- Render assembly and export package persistence.
CREATE TABLE IF NOT EXISTS public.render_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
    title TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'assembling', 'ready', 'failed')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    item_count INTEGER NOT NULL DEFAULT 0 CHECK (item_count >= 0),
    ready_item_count INTEGER NOT NULL DEFAULT 0 CHECK (ready_item_count >= 0),
    missing_media_count INTEGER NOT NULL DEFAULT 0 CHECK (missing_media_count >= 0),
    total_duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (total_duration_seconds >= 0),
    uncertainty_notes TEXT,
    source_evidence TEXT,
    provenance TEXT NOT NULL DEFAULT 'user' CHECK (provenance IN ('user', 'production-derived')),
    user_approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_render_sequences_production ON public.render_sequences(production_id, created_at DESC);
DROP TRIGGER IF EXISTS update_render_sequences_updated_at ON public.render_sequences;
CREATE TRIGGER update_render_sequences_updated_at BEFORE UPDATE ON public.render_sequences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.render_sequences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view render sequences in their productions" ON public.render_sequences;
CREATE POLICY "Users can view render sequences in their productions" ON public.render_sequences FOR SELECT
USING (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = render_sequences.production_id AND productions.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Users can create render sequences in their productions" ON public.render_sequences;
CREATE POLICY "Users can create render sequences in their productions" ON public.render_sequences FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = render_sequences.production_id AND productions.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Users can update render sequences in their productions" ON public.render_sequences;
CREATE POLICY "Users can update render sequences in their productions" ON public.render_sequences FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = render_sequences.production_id AND productions.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = render_sequences.production_id AND productions.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Users can delete render sequences in their productions" ON public.render_sequences;
CREATE POLICY "Users can delete render sequences in their productions" ON public.render_sequences FOR DELETE
USING (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = render_sequences.production_id AND productions.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.render_clips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
    render_id UUID NOT NULL REFERENCES public.render_sequences(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL CHECK (sequence_number >= 1),
    scene_id UUID REFERENCES public.scenes(id) ON DELETE SET NULL,
    shot_id UUID REFERENCES public.shots(id) ON DELETE SET NULL,
    panel_id UUID REFERENCES public.storyboard_panels(id) ON DELETE SET NULL,
    asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
    title TEXT,
    description TEXT,
    media_url TEXT,
    duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    source_kind TEXT NOT NULL CHECK (source_kind IN ('shot', 'panel', 'asset', 'scene', 'user')),
    source_id UUID,
    source_evidence TEXT,
    uncertainty_notes TEXT,
    provenance TEXT NOT NULL DEFAULT 'production-derived' CHECK (provenance IN ('user', 'production-derived')),
    user_approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT render_clips_sequence_unique UNIQUE (render_id, sequence_number)
);
CREATE INDEX IF NOT EXISTS idx_render_clips_production ON public.render_clips(production_id);
CREATE INDEX IF NOT EXISTS idx_render_clips_render_sequence ON public.render_clips(render_id, sequence_number);
DROP TRIGGER IF EXISTS update_render_clips_updated_at ON public.render_clips;
CREATE TRIGGER update_render_clips_updated_at BEFORE UPDATE ON public.render_clips
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.render_clips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view render clips in their productions" ON public.render_clips;
CREATE POLICY "Users can view render clips in their productions" ON public.render_clips FOR SELECT
USING (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = render_clips.production_id AND productions.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Users can create render clips in their productions" ON public.render_clips;
CREATE POLICY "Users can create render clips in their productions" ON public.render_clips FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = render_clips.production_id AND productions.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Users can update render clips in their productions" ON public.render_clips;
CREATE POLICY "Users can update render clips in their productions" ON public.render_clips FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = render_clips.production_id AND productions.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = render_clips.production_id AND productions.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Users can delete render clips in their productions" ON public.render_clips;
CREATE POLICY "Users can delete render clips in their productions" ON public.render_clips FOR DELETE
USING (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = render_clips.production_id AND productions.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.export_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
    render_id UUID REFERENCES public.render_sequences(id) ON DELETE SET NULL,
    format TEXT NOT NULL CHECK (format IN ('edit-decision-list', 'delivery-manifest', 'preview-package')),
    title TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'packaged', 'failed')),
    package_url TEXT,
    manifest JSONB NOT NULL CHECK (jsonb_typeof(manifest) = 'object'),
    serialized_package TEXT NOT NULL,
    uncertainty_notes TEXT,
    provenance TEXT NOT NULL DEFAULT 'production-derived' CHECK (provenance IN ('user', 'production-derived')),
    user_approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_export_packages_production ON public.export_packages(production_id, created_at DESC);
DROP TRIGGER IF EXISTS update_export_packages_updated_at ON public.export_packages;
CREATE TRIGGER update_export_packages_updated_at BEFORE UPDATE ON public.export_packages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.export_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view export packages in their productions" ON public.export_packages;
CREATE POLICY "Users can view export packages in their productions" ON public.export_packages FOR SELECT
USING (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = export_packages.production_id AND productions.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Users can create export packages in their productions" ON public.export_packages;
CREATE POLICY "Users can create export packages in their productions" ON public.export_packages FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = export_packages.production_id AND productions.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Users can update export packages in their productions" ON public.export_packages;
CREATE POLICY "Users can update export packages in their productions" ON public.export_packages FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = export_packages.production_id AND productions.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = export_packages.production_id AND productions.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Users can delete export packages in their productions" ON public.export_packages;
CREATE POLICY "Users can delete export packages in their productions" ON public.export_packages FOR DELETE
USING (EXISTS (SELECT 1 FROM public.productions WHERE productions.id = export_packages.production_id AND productions.owner_id = auth.uid()));

COMMENT ON TABLE public.render_sequences IS 'Creator-approved render assembly plans for screenplay-derived clips.';
COMMENT ON TABLE public.render_clips IS 'Ordered, traceable clip records for a render sequence.';
COMMENT ON TABLE public.export_packages IS 'Persisted export manifests and serialized package contents.';
