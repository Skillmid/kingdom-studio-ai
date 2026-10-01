-- Canonical AI screenplay breakdown. The original screenplay text remains untouched.
alter table public.screenplays
    add column if not exists analysis jsonb;

alter table public.screenplay_revisions
    add column if not exists analysis jsonb;

comment on column public.screenplays.analysis is
'Validated canonical AI screenplay breakdown used as the source of truth for characters, locations and scenes.';

comment on column public.screenplay_revisions.analysis is
'Canonical screenplay breakdown captured with each screenplay revision for safe restoration.';
