-- Migration: Narrow song categories to 3 (Lobpreis, Anbetung, Sonstiges)
-- Genre (Rock/Pop/Ballade) is now handled via tags instead of categories.

-- 1. Move legacy genre categories into tags and reset category to 'Sonstiges'.
--    The old category value is appended to tags (de-duplicated, case-sensitive).
UPDATE public.songs
SET
  tags = (
    SELECT array_agg(DISTINCT t)
    FROM unnest(tags || ARRAY[category::text]) AS t
  ),
  category = 'Sonstiges'
WHERE category IN ('Rock', 'Pop', 'Ballade');

-- 2. Replace the enum with the 3-value version.
--    All rows are guaranteed to be in the new set after step 1.
ALTER TYPE public.song_category RENAME TO song_category_old;

CREATE TYPE public.song_category AS ENUM ('Lobpreis', 'Anbetung', 'Sonstiges');

ALTER TABLE public.songs
  ALTER COLUMN category DROP DEFAULT,
  ALTER COLUMN category TYPE public.song_category
    USING category::text::public.song_category,
  ALTER COLUMN category SET DEFAULT 'Sonstiges';

DROP TYPE public.song_category_old;
