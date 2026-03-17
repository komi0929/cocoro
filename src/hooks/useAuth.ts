/**
 * kokoro — useAuth フック
 * Supabase Authセッション管理
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isGuest: false,
  });

  const supabase = createSupabaseBrowser();

  useEffect(() => {
    // 初期セッション取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        isGuest: session?.user?.is_anonymous ?? false,
      });
    });

    // セッション変更リスナー
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          isGuest: session?.user?.is_anonymous ?? false,
        });
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  return { ...state, signOut };
}
