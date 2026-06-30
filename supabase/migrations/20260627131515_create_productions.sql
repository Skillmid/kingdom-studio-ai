-- ==========================================================
-- Kingdom Studio AI br Skillmid Creatives
-- Migration: Create Productions
-- Version: 1.0
-- Description:
-- Creates the root Production entity for the platform.
-- Every creative artifact belongs to a Production.
-- ==========================================================

create extension if not exists pgcrypto;

create table public.productions (

    id uuid primary key default gen_random_uuid(),

    owner_id uuid not null
        references auth.users(id)
        on delete cascade,

    title text not null,

    slug text not null unique,

    logline text,

    synopsis text,

    genre text,

    target_audience text,

    art_style text,

    language text not null default 'English',

    aspect_ratio text not null default '16:9',

    duration integer not null default 0,

    cover_image text,

    status text not null default 'concept',

    visibility text not null default 'private',

    created_at timestamptz not null default timezone('utc', now()),

    updated_at timestamptz not null default timezone('utc', now()),

    constraint productions_status_check
        check (
            status in (
                'concept',
                'writing',
                'pre-production',
                'production',
                'post-production',
                'released',
                'archived'
            )
        ),

    constraint productions_visibility_check
        check (
            visibility in (
                'private',
                'team',
                'public'
            )
        )
);

create index productions_owner_idx
on public.productions(owner_id);

create index productions_status_idx
on public.productions(status);

alter table public.productions
enable row level security;

create policy "Users can view own productions"
on public.productions
for select
using (
    auth.uid() = owner_id
);

create policy "Users can create own productions"
on public.productions
for insert
with check (
    auth.uid() = owner_id
);

create policy "Users can update own productions"
on public.productions
for update
using (
    auth.uid() = owner_id
);

create policy "Users can delete own productions"
on public.productions
for delete
using (
    auth.uid() = owner_id
);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

create trigger update_productions_updated_at
before update
on public.productions
for each row
execute function public.update_updated_at_column();

comment on table public.productions is
'Root aggregate for every filmmaking project in Kingdom Studio AI.';