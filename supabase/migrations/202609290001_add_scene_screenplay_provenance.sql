-- Keep accepted scene proposals traceable to the exact screenplay revision that produced them.
ALTER TABLE public.screenplay_revisions
    ADD CONSTRAINT screenplay_revisions_source_identity_unique
    UNIQUE (id, screenplay_id, version);

ALTER TABLE public.screenplays
    ADD CONSTRAINT screenplays_source_production_unique
    UNIQUE (id, production_id);

ALTER TABLE public.scenes
    ADD COLUMN source_screenplay_id UUID,
    ADD COLUMN source_revision_id UUID,
    ADD COLUMN source_screenplay_version INTEGER,
    ADD CONSTRAINT scenes_source_provenance_complete
        CHECK (
            (source_screenplay_id IS NULL AND source_revision_id IS NULL AND source_screenplay_version IS NULL)
            OR
            (source_screenplay_id IS NOT NULL AND source_revision_id IS NOT NULL AND source_screenplay_version IS NOT NULL AND source_screenplay_version > 0)
        ),
    ADD CONSTRAINT scenes_source_screenplay_production_fk
        FOREIGN KEY (source_screenplay_id, production_id)
        REFERENCES public.screenplays (id, production_id),
    ADD CONSTRAINT scenes_source_revision_fk
        FOREIGN KEY (source_revision_id, source_screenplay_id, source_screenplay_version)
        REFERENCES public.screenplay_revisions (id, screenplay_id, version);

CREATE INDEX idx_scenes_source_revision
    ON public.scenes(source_revision_id)
    WHERE source_revision_id IS NOT NULL;

COMMENT ON COLUMN public.scenes.source_screenplay_id IS 'Optional source screenplay for an accepted extracted scene.';
COMMENT ON COLUMN public.scenes.source_revision_id IS 'Optional exact saved screenplay revision that produced an accepted scene.';
COMMENT ON COLUMN public.scenes.source_screenplay_version IS 'Screenplay version paired with the source revision for readable provenance.';
