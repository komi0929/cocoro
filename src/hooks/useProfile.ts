/**
 * cocoro — useProfile フック
 * Supabase profilesテーブルとの連携
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';

export interface ProfileRow {
  id: string;
  display_name: string;
  avatar_id: string;
  bio: string | null;
  reputation_score: number;
  total_sessions: number;
  total_minutes: number;
  created_at: string;
  updated_at: string;
}

export function useProfile(userId: string | null | undefined) {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(!!userId);

  const supabase = createSupabaseBrowser();

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    setLoading(true);

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          setProfile(data as unknown as ProfileRow);
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const updateProfile = useCallback(async (updates: Partial<Pick<ProfileRow, 'display_name' | 'avatar_id' | 'bio'>>) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('profiles')
      .update(updates as never)
      .eq('id', userId)
      .select()
      .single();
    if (!error && data) {
      setProfile(data as unknown as ProfileRow);
    }
    return data;
  }, [userId, supabase]);

  return { profile, loading, updateProfile };
}
