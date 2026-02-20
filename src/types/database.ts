// Auto-generated TypeScript types matching the Supabase database schema.
// Keep in sync with supabase/migrations/.

export type AppRole = 'admin' | 'leader' | 'member';
export type SongCategory = 'Lobpreis' | 'Anbetung' | 'Rock' | 'Pop' | 'Ballade' | 'Sonstiges';
export type EventType = 'Sonntag' | 'Montag' | 'Event';
export type ResourceType = 'spotify' | 'youtube' | 'other';

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      departments: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      org_members: {
        Row: {
          id: string;
          org_id: string;
          department_id: string;
          user_id: string;
          role: AppRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          department_id: string;
          user_id: string;
          role?: AppRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          department_id?: string;
          user_id?: string;
          role?: AppRole;
          created_at?: string;
        };
      };
      songs: {
        Row: {
          id: string;
          org_id: string;
          department_id: string | null;
          title: string;
          artist: string | null;
          original_key: string | null;
          tempo: number | null;
          category: SongCategory;
          tags: string[];
          content: string;
          version: number;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          department_id?: string | null;
          title: string;
          artist?: string | null;
          original_key?: string | null;
          tempo?: number | null;
          category?: SongCategory;
          tags?: string[];
          content?: string;
          version?: number;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          department_id?: string | null;
          title?: string;
          artist?: string | null;
          original_key?: string | null;
          tempo?: number | null;
          category?: SongCategory;
          tags?: string[];
          content?: string;
          version?: number;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      song_resources: {
        Row: {
          id: string;
          song_id: string;
          label: string;
          url: string;
          resource_type: ResourceType;
          created_at: string;
        };
        Insert: {
          id?: string;
          song_id: string;
          label: string;
          url: string;
          resource_type?: ResourceType;
          created_at?: string;
        };
        Update: {
          id?: string;
          song_id?: string;
          label?: string;
          url?: string;
          resource_type?: ResourceType;
          created_at?: string;
        };
      };
      setlists: {
        Row: {
          id: string;
          org_id: string;
          department_id: string;
          title: string;
          date: string;
          event_type: EventType;
          published_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          department_id: string;
          title: string;
          date: string;
          event_type?: EventType;
          published_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          department_id?: string;
          title?: string;
          date?: string;
          event_type?: EventType;
          published_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      setlist_songs: {
        Row: {
          id: string;
          setlist_id: string;
          song_id: string;
          position: number;
          note: string | null;
        };
        Insert: {
          id?: string;
          setlist_id: string;
          song_id: string;
          position?: number;
          note?: string | null;
        };
        Update: {
          id?: string;
          setlist_id?: string;
          song_id?: string;
          position?: number;
          note?: string | null;
        };
      };
      user_preferences: {
        Row: {
          user_id: string;
          font_size: number;
          favorite_song_ids: string[];
          default_transpose: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          font_size?: number;
          favorite_song_ids?: string[];
          default_transpose?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          font_size?: number;
          favorite_song_ids?: string[];
          default_transpose?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
          last_used_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
          last_used_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          created_at?: string;
          last_used_at?: string | null;
        };
      };
    };
    Enums: {
      app_role: AppRole;
      song_category: SongCategory;
      event_type: EventType;
      resource_type: ResourceType;
    };
  };
};

// Convenience type aliases for Row types
export type Organization = Database['public']['Tables']['organizations']['Row'];
export type Department = Database['public']['Tables']['departments']['Row'];
export type OrgMember = Database['public']['Tables']['org_members']['Row'];
export type Song = Database['public']['Tables']['songs']['Row'];
export type SongResource = Database['public']['Tables']['song_resources']['Row'];
export type Setlist = Database['public']['Tables']['setlists']['Row'];
export type SetlistSong = Database['public']['Tables']['setlist_songs']['Row'];
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
export type PushSubscription = Database['public']['Tables']['push_subscriptions']['Row'];

// Lightweight song type for list views (excludes content and version)
export type SongListItem = Pick<
  Song,
  'id' | 'org_id' | 'department_id' | 'title' | 'artist' | 'original_key' | 'tempo' | 'category' | 'tags' | 'created_at' | 'updated_at'
>;

// JWT app_metadata shape (from custom access token hook)
export type AppMetadata = {
  org_id: string | null;
  department_id: string | null;
  role: AppRole;
};
