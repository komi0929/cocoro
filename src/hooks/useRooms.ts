/**
 * cocoro — useRooms フック
 * Supabase roomsテーブルからルーム一覧取得 + リアルタイム更新
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowser, isSupabaseConfigured } from '@/lib/supabase';

// Room type (manual definition to avoid Supabase type inference issues)
export interface RoomRow {
  id: string;
  name: string;
  emoji: string;
  vibe: string | null;
  host_id: string | null;
  max_participants: number;
  is_active: boolean;
  theme: string;
  created_at: string;
}

export interface RoomWithCount extends RoomRow {
  participantCount: number;
  phase?: string;
  density?: number;
}

export function useRooms() {
  const [rooms, setRooms] = useState<RoomWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  const configured = isSupabaseConfigured();
  const supabase = configured ? createSupabaseBrowser() : null;

  const fetchRooms = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRooms((data as unknown as RoomRow[]).map((r: RoomRow) => ({ ...r, participantCount: 0 })));
      }
    } catch {
      // Supabase not configured — silent fail
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchRooms();

    if (!supabase) return;

    // Realtime subscription
    const channel = supabase
      .channel('rooms-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        fetchRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createRoom = useCallback(async (name: string, emoji?: string, theme?: string) => {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    const { data, error } = await supabase
      .from('rooms')
      .insert({ name, emoji: emoji ?? '☕', theme: theme ?? 'cosmos' } as never)
      .select()
      .single();

    if (!error && data) {
      const row = data as unknown as RoomRow;
      setRooms(prev => [{ ...row, participantCount: 0 }, ...prev]);
    }
    return { data, error };
  }, [supabase]);

  return { rooms, loading, fetchRooms, createRoom };
}
