-- Kingdom Studio AI
-- Creator Foundation fields for Story Bible
-- Keeps the filmmaker's burden and human problem available to every downstream AI workflow.

alter table public.story_bibles
  add column if not exists burden text,
  add column if not exists truth text,
  add column if not exists human_problem text;

comment on column public.story_bibles.burden is
  'The burden or conviction the filmmaker feels compelled to communicate.';

comment on column public.story_bibles.truth is
  'The truth the filmmaker wants the audience to encounter through the story.';

comment on column public.story_bibles.human_problem is
  'The real human struggle through which the truth is dramatized.';
