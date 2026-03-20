/**
 * cocoro - User Store (Supabase Auth)
 * Secure authentication with email + password via Supabase
 * Demo mode still uses local state (no Supabase required)
 */

import { create } from 'zustand';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { UserAccount, AvatarConfig } from '@/types/cocoro';

const LOCAL_STORAGE_KEY = 'cocoro-user-offline';

interface UserState {
  user: UserAccount | null;
  isLoggedIn: boolean;
  isDemo: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateAvatar: (config: AvatarConfig) => void;
  enterDemoMode: () => UserAccount;
  clearError: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  isDemo: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    set({ isLoading: true });

    if (!isSupabaseConfigured()) {
      // Offline mode: load from localStorage
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          const user = JSON.parse(raw) as UserAccount;
          set({ user, isLoggedIn: true, isLoading: false });
          return;
        }
      } catch { /* ignore */ }
      set({ isLoading: false });
      return;
    }

    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const user: UserAccount = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'ユーザー',
          email: session.user.email || '',
          avatarConfig: session.user.user_metadata?.avatarConfig || {
            species: 'cat',
            color: '#A0D8F0',
            item: 'none',
          },
          createdAt: new Date(session.user.created_at).getTime(),
        };
        set({ user, isLoggedIn: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const user: UserAccount = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'ユーザー',
            email: session.user.email || '',
            avatarConfig: session.user.user_metadata?.avatarConfig || {
              species: 'cat',
              color: '#A0D8F0',
              item: 'none',
            },
            createdAt: new Date(session.user.created_at).getTime(),
          };
          set({ user, isLoggedIn: true });
        } else {
          if (!get().isDemo) {
            set({ user: null, isLoggedIn: false });
          }
        }
      });
    } catch {
      set({ isLoading: false });
    }
  },

  register: async (name, email, password) => {
    set({ error: null, isLoading: true });

    if (!isSupabaseConfigured()) {
      // Offline mode registration
      const user: UserAccount = {
        id: crypto.randomUUID(),
        name,
        email,
        avatarConfig: { species: 'cat', color: '#A0D8F0', item: 'none' },
        createdAt: Date.now(),
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
      set({ user, isLoggedIn: true, isLoading: false });
      return true;
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            avatarConfig: { species: 'cat', color: '#A0D8F0', item: 'none' },
          },
        },
      });

      if (error) {
        const msg = error.message === 'User already registered'
          ? 'このメールは登録済みです'
          : error.message === 'Password should be at least 6 characters'
            ? 'パスワードは6文字以上にしてね'
            : error.message;
        set({ error: msg, isLoading: false });
        return false;
      }

      if (data.user) {
        const user: UserAccount = {
          id: data.user.id,
          name,
          email,
          avatarConfig: { species: 'cat', color: '#A0D8F0', item: 'none' },
          createdAt: Date.now(),
        };
        set({ user, isLoggedIn: true, isLoading: false });
        return true;
      }

      set({ isLoading: false });
      return false;
    } catch (err) {
      set({ error: '登録に失敗しました', isLoading: false });
      return false;
    }
  },

  login: async (email, password) => {
    set({ error: null, isLoading: true });

    if (!isSupabaseConfigured()) {
      // Offline mode login
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as UserAccount;
          if (saved.email === email) {
            set({ user: saved, isLoggedIn: true, isLoading: false });
            return true;
          }
        }
      } catch { /* ignore */ }
      set({ error: 'メールが見つかりません', isLoading: false });
      return false;
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        const msg = error.message === 'Invalid login credentials'
          ? 'メールかパスワードが違うよ'
          : error.message;
        set({ error: msg, isLoading: false });
        return false;
      }

      if (data.user) {
        const user: UserAccount = {
          id: data.user.id,
          name: data.user.user_metadata?.name || email.split('@')[0],
          email,
          avatarConfig: data.user.user_metadata?.avatarConfig || {
            species: 'cat',
            color: '#A0D8F0',
            item: 'none',
          },
          createdAt: new Date(data.user.created_at).getTime(),
        };
        set({ user, isLoggedIn: true, isLoading: false });
        return true;
      }

      set({ isLoading: false });
      return false;
    } catch {
      set({ error: 'ログインに失敗しました', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    if (isSupabaseConfigured()) {
      await getSupabase().auth.signOut();
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    set({ user: null, isLoggedIn: false, isDemo: false });
  },

  updateAvatar: (config) => {
    const user = get().user;
    if (!user) return;
    const updated = { ...user, avatarConfig: config };
    set({ user: updated });

    if (get().isDemo) return;

    if (!isSupabaseConfigured()) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } else {
      // Persist to Supabase user metadata
      getSupabase().auth.updateUser({
        data: { avatarConfig: config },
      });
    }
  },

  enterDemoMode: () => {
    const demoUser: UserAccount = {
      id: 'demo-' + crypto.randomUUID(),
      name: 'ゲスト',
      email: '',
      avatarConfig: { species: 'cat', color: '#A0D8F0', item: 'none' },
      createdAt: Date.now(),
    };
    set({ user: demoUser, isLoggedIn: true, isDemo: true, isLoading: false });
    return demoUser;
  },

  clearError: () => set({ error: null }),
}));
