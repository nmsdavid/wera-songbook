-- Migration: RLS Policies
-- Enables RLS on all tables and creates access policies.
--
-- Helper: get the current user's membership info from org_members.
-- The JWT custom hook (migration 4) also embeds these, but RLS policies
-- query the table directly so they work even before the hook is active.

-- =============================================================================
-- ENABLE RLS
-- =============================================================================

ALTER TABLE public.organizations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_resources    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlists          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlist_songs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- ORGANIZATIONS
-- =============================================================================

-- Members can see their own org
CREATE POLICY "org_select" ON public.organizations
  FOR SELECT USING (
    id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

-- =============================================================================
-- DEPARTMENTS
-- =============================================================================

-- Members can see departments in their org
CREATE POLICY "dept_select" ON public.departments
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

-- Admins can manage departments in their org
CREATE POLICY "dept_insert" ON public.departments
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "dept_update" ON public.departments
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "dept_delete" ON public.departments
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- ORG_MEMBERS
-- =============================================================================

-- Members can see other members in their org
CREATE POLICY "members_select" ON public.org_members
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

-- Admins can manage members in their org
CREATE POLICY "members_insert" ON public.org_members
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "members_update" ON public.org_members
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "members_delete" ON public.org_members
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- SONGS
-- =============================================================================

-- Visible if: global (department_id IS NULL) OR same department as user
CREATE POLICY "songs_select" ON public.songs
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
    AND (
      department_id IS NULL
      OR department_id IN (
        SELECT department_id FROM public.org_members WHERE user_id = auth.uid()
      )
    )
  );

-- Only admins can create songs
CREATE POLICY "songs_insert" ON public.songs
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update songs
CREATE POLICY "songs_update" ON public.songs
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete songs
CREATE POLICY "songs_delete" ON public.songs
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- SONG_RESOURCES
-- =============================================================================

-- Visible if the parent song is visible (relies on songs RLS for song access)
CREATE POLICY "song_resources_select" ON public.song_resources
  FOR SELECT USING (
    song_id IN (SELECT id FROM public.songs)
  );

-- Only admins can manage song resources
CREATE POLICY "song_resources_insert" ON public.song_resources
  FOR INSERT WITH CHECK (
    song_id IN (
      SELECT s.id FROM public.songs s
      JOIN public.org_members om ON om.org_id = s.org_id
      WHERE om.user_id = auth.uid() AND om.role = 'admin'
    )
  );

CREATE POLICY "song_resources_update" ON public.song_resources
  FOR UPDATE USING (
    song_id IN (
      SELECT s.id FROM public.songs s
      JOIN public.org_members om ON om.org_id = s.org_id
      WHERE om.user_id = auth.uid() AND om.role = 'admin'
    )
  );

CREATE POLICY "song_resources_delete" ON public.song_resources
  FOR DELETE USING (
    song_id IN (
      SELECT s.id FROM public.songs s
      JOIN public.org_members om ON om.org_id = s.org_id
      WHERE om.user_id = auth.uid() AND om.role = 'admin'
    )
  );

-- =============================================================================
-- SETLISTS
-- =============================================================================

-- Visible only for users in the same department
CREATE POLICY "setlists_select" ON public.setlists
  FOR SELECT USING (
    department_id IN (
      SELECT department_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

-- Admins can create setlists
CREATE POLICY "setlists_insert" ON public.setlists
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    AND department_id IN (
      SELECT department_id FROM public.org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins and leaders can update setlists in their department
CREATE POLICY "setlists_update" ON public.setlists
  FOR UPDATE USING (
    department_id IN (
      SELECT department_id FROM public.org_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'leader')
    )
  );

-- Only admins can delete setlists
CREATE POLICY "setlists_delete" ON public.setlists
  FOR DELETE USING (
    department_id IN (
      SELECT department_id FROM public.org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- SETLIST_SONGS
-- =============================================================================

-- Visible if the parent setlist is visible (relies on setlists RLS)
CREATE POLICY "setlist_songs_select" ON public.setlist_songs
  FOR SELECT USING (
    setlist_id IN (SELECT id FROM public.setlists)
  );

-- Admins and leaders can manage setlist songs
CREATE POLICY "setlist_songs_insert" ON public.setlist_songs
  FOR INSERT WITH CHECK (
    setlist_id IN (
      SELECT sl.id FROM public.setlists sl
      JOIN public.org_members om ON om.department_id = sl.department_id
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'leader')
    )
  );

CREATE POLICY "setlist_songs_update" ON public.setlist_songs
  FOR UPDATE USING (
    setlist_id IN (
      SELECT sl.id FROM public.setlists sl
      JOIN public.org_members om ON om.department_id = sl.department_id
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'leader')
    )
  );

CREATE POLICY "setlist_songs_delete" ON public.setlist_songs
  FOR DELETE USING (
    setlist_id IN (
      SELECT sl.id FROM public.setlists sl
      JOIN public.org_members om ON om.department_id = sl.department_id
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'leader')
    )
  );

-- =============================================================================
-- USER_PREFERENCES
-- =============================================================================

-- Users can only see/manage their own preferences
CREATE POLICY "prefs_select" ON public.user_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "prefs_insert" ON public.user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "prefs_update" ON public.user_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- =============================================================================
-- PUSH_SUBSCRIPTIONS
-- =============================================================================

-- Users can only see/manage their own push subscriptions
CREATE POLICY "push_select" ON public.push_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "push_insert" ON public.push_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_delete" ON public.push_subscriptions
  FOR DELETE USING (user_id = auth.uid());
