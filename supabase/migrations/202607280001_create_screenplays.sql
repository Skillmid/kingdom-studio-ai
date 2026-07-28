-- ==========================================================
-- Kingdom Studio AI by Skillmid Creatives
-- Migration: Create Screenplays and Screenplay Revisions
-- Version: 1.0
-- ==========================================================

create table public.screenplays (

    id uuid primary key default gen_random_uuid(),

    production_id uuid not null unique
        references public.productions(id)
        on delete cascade,

    title text not null default 'Untitled Screenplay',

    content text not null default '',

    source text not null default 'internal',

    source_file_name text,

    version integer not null default 1,

    status text not null default 'draft',

    created_at timestamptz not null
        default timezone('utc', now()),

    updated_at timestamptz not null
        default timezone('utc', now()),

    constraint screenplays_source_check
        check (
            source in (
                'internal',
                'pdf',
                'fdx',
                'docx',
                'txt',
                'fountain',
                'markdown'
            )
        ),

    constraint screenplays_status_check
        check (
            status in (
                'draft',
                'imported',
                'review',
                'revised',
                'approved',
                'locked'
            )
        ),

    constraint screenplays_version_check
        check (version > 0)
);


create table public.screenplay_revisions (

    id uuid primary key default gen_random_uuid(),

    screenplay_id uuid not null
        references public.screenplays(id)
        on delete cascade,

    version integer not null,

    title text not null,

    content text not null,

    reason text not null default 'manual-save',

    created_at timestamptz not null
        default timezone('utc', now()),

    constraint screenplay_revisions_version_check
        check (version > 0),

    unique (
        screenplay_id,
        version
    )
);


create index screenplays_production_idx
on public.screenplays(production_id);


create index screenplay_revisions_screenplay_idx
on public.screenplay_revisions(screenplay_id);


create index screenplay_revisions_created_idx
on public.screenplay_revisions(
    screenplay_id,
    created_at desc
);


alter table public.screenplays
enable row level security;


alter table public.screenplay_revisions
enable row level security;


create policy "Users can view own screenplays"
on public.screenplays
for select
using (
    exists (
        select 1
        from public.productions
        where productions.id =
            screenplays.production_id
        and productions.owner_id =
            auth.uid()
    )
);


create policy "Users can create own screenplays"
on public.screenplays
for insert
with check (
    exists (
        select 1
        from public.productions
        where productions.id =
            screenplays.production_id
        and productions.owner_id =
            auth.uid()
    )
);


create policy "Users can update own screenplays"
on public.screenplays
for update
using (
    exists (
        select 1
        from public.productions
        where productions.id =
            screenplays.production_id
        and productions.owner_id =
            auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.productions
        where productions.id =
            screenplays.production_id
        and productions.owner_id =
            auth.uid()
    )
);


create policy "Users can delete own screenplays"
on public.screenplays
for delete
using (
    exists (
        select 1
        from public.productions
        where productions.id =
            screenplays.production_id
        and productions.owner_id =
            auth.uid()
    )
);


create policy "Users can view own screenplay revisions"
on public.screenplay_revisions
for select
using (
    exists (
        select 1
        from public.screenplays
        join public.productions
          on productions.id =
             screenplays.production_id
        where screenplays.id =
            screenplay_revisions.screenplay_id
        and productions.owner_id =
            auth.uid()
    )
);


create policy "Users can create own screenplay revisions"
on public.screenplay_revisions
for insert
with check (
    exists (
        select 1
        from public.screenplays
        join public.productions
          on productions.id =
             screenplays.production_id
        where screenplays.id =
            screenplay_revisions.screenplay_id
        and productions.owner_id =
            auth.uid()
    )
);


create policy "Users can delete own screenplay revisions"
on public.screenplay_revisions
for delete
using (
    exists (
        select 1
        from public.screenplays
        join public.productions
          on productions.id =
             screenplays.production_id
        where screenplays.id =
            screenplay_revisions.screenplay_id
        and productions.owner_id =
            auth.uid()
    )
);


create trigger update_screenplays_updated_at
before update
on public.screenplays
for each row
execute function public.update_updated_at_column();


comment on table public.screenplays is
'Current screenplay document for a Kingdom Studio AI production.';


comment on table public.screenplay_revisions is
'Immutable screenplay snapshots used for revision history and restoration.';