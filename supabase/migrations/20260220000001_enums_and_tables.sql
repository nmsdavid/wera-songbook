-- Migration: Enums and Tables
-- Creates all custom types and tables for the WERA Songbook app.

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'leader', 'member');

CREATE TYPE public.song_category AS ENUM (
  'Lobpreis', 'Anbetung', 'Rock', 'Pop', 'Ballade', 'Sonstiges'
);

CREATE TYPE public.event_type AS ENUM ('Sonntag', 'Montag', 'Event');

CREATE TYPE public.resource_type AS ENUM ('spotify', 'youtube', 'other');

-- =============================================================================
-- TABLES
-- =============================================================================

-- Organizations (top-level entity: the church)
CREATE TABLE public.organizations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Departments (sub-congregations within an org)
CREATE TABLE public.departments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Org Members (junction: user <-> org, with role + department)
CREATE TABLE public.org_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          public.app_role NOT NULL DEFAULT 'member',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

-- Songs
CREATE TABLE public.songs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  artist        TEXT,
  original_key  TEXT,
  tempo         INTEGER,
  category      public.song_category NOT NULL DEFAULT 'Sonstiges',
  tags          TEXT[] NOT NULL DEFAULT '{}',
  content       TEXT NOT NULL DEFAULT '',
  version       INTEGER NOT NULL DEFAULT 1,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Song Resources (external links per song)
CREATE TABLE public.song_resources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id       UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  url           TEXT NOT NULL,
  resource_type public.resource_type NOT NULL DEFAULT 'other',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Setlists
CREATE TABLE public.setlists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  date          DATE NOT NULL,
  event_type    public.event_type NOT NULL DEFAULT 'Sonntag',
  published_at  TIMESTAMPTZ,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Setlist Songs (junction: setlist <-> song, ordered)
CREATE TABLE public.setlist_songs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id  UUID NOT NULL REFERENCES public.setlists(id) ON DELETE CASCADE,
  song_id     UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL DEFAULT 0,
  note        TEXT,
  UNIQUE (setlist_id, song_id)
);

-- User Preferences
CREATE TABLE public.user_preferences (
  user_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  font_size          INTEGER NOT NULL DEFAULT 16,
  favorite_song_ids  UUID[] NOT NULL DEFAULT '{}',
  default_transpose  INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Push Subscriptions
CREATE TABLE public.push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint     TEXT NOT NULL UNIQUE,
  p256dh       TEXT NOT NULL,
  auth         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.songs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.setlists
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
