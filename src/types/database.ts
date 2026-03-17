/**
 * kokoro — Database Types (Supabase auto-generated style)
 * Supabase CLI `supabase gen types` の出力を模倣
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_id: string;
          bio: string | null;
          reputation_score: number;
          total_sessions: number;
          total_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_id?: string;
          bio?: string | null;
          reputation_score?: number;
          total_sessions?: number;
          total_minutes?: number;
        };
        Update: {
          display_name?: string;
          avatar_id?: string;
          bio?: string | null;
          reputation_score?: number;
          total_sessions?: number;
          total_minutes?: number;
        };
      };
      rooms: {
        Row: {
          id: string;
          name: string;
          emoji: string;
          vibe: string | null;
          host_id: string | null;
          max_participants: number;
          is_active: boolean;
          theme: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          emoji?: string;
          vibe?: string | null;
          host_id?: string | null;
          max_participants?: number;
          is_active?: boolean;
          theme?: string;
        };
        Update: {
          name?: string;
          emoji?: string;
          vibe?: string | null;
          host_id?: string | null;
          max_participants?: number;
          is_active?: boolean;
          theme?: string;
        };
      };
      room_visits: {
        Row: {
          id: string;
          user_id: string;
          room_id: string;
          joined_at: string;
          left_at: string | null;
          duration_min: number | null;
        };
        Insert: {
          user_id: string;
          room_id: string;
          joined_at?: string;
        };
        Update: {
          left_at?: string;
          duration_min?: number;
        };
      };
      friendships: {
        Row: {
          id: string;
          user_a: string;
          user_b: string;
          status: 'pending' | 'accepted' | 'blocked';
          created_at: string;
        };
        Insert: {
          user_a: string;
          user_b: string;
          status?: 'pending' | 'accepted' | 'blocked';
        };
        Update: {
          status?: 'pending' | 'accepted' | 'blocked';
        };
      };
      reputation_events: {
        Row: {
          id: string;
          user_id: string;
          room_id: string;
          action: string;
          delta: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          room_id: string;
          action: string;
          delta: number;
        };
        Update: never;
      };
    };
  };
}
