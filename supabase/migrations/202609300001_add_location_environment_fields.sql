ALTER TABLE public.locations
    ADD COLUMN IF NOT EXISTS time_period TEXT,
    ADD COLUMN IF NOT EXISTS weather TEXT,
    ADD COLUMN IF NOT EXISTS architecture TEXT,
    ADD COLUMN IF NOT EXISTS lighting TEXT,
    ADD COLUMN IF NOT EXISTS mood TEXT;

NOTIFY pgrst, 'reload schema';