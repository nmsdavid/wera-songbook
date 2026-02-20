-- Migration: Indexes
-- Performance indexes for foreign keys and common query patterns.

-- Departments
CREATE INDEX idx_departments_org_id ON public.departments(org_id);

-- Org Members
CREATE INDEX idx_org_members_user_id ON public.org_members(user_id);
CREATE INDEX idx_org_members_org_id ON public.org_members(org_id);
CREATE INDEX idx_org_members_department_id ON public.org_members(department_id);
CREATE INDEX idx_org_members_role ON public.org_members(role);

-- Songs
CREATE INDEX idx_songs_org_id ON public.songs(org_id);
CREATE INDEX idx_songs_department_id ON public.songs(department_id);
CREATE INDEX idx_songs_category ON public.songs(category);
CREATE INDEX idx_songs_title ON public.songs(title);
CREATE INDEX idx_songs_created_by ON public.songs(created_by);

-- Song Resources
CREATE INDEX idx_song_resources_song_id ON public.song_resources(song_id);

-- Setlists
CREATE INDEX idx_setlists_org_id ON public.setlists(org_id);
CREATE INDEX idx_setlists_department_id ON public.setlists(department_id);
CREATE INDEX idx_setlists_date ON public.setlists(date DESC);
CREATE INDEX idx_setlists_created_by ON public.setlists(created_by);

-- Setlist Songs
CREATE INDEX idx_setlist_songs_setlist_id ON public.setlist_songs(setlist_id);
CREATE INDEX idx_setlist_songs_song_id ON public.setlist_songs(song_id);
CREATE INDEX idx_setlist_songs_position ON public.setlist_songs(setlist_id, position);

-- Push Subscriptions
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
