/**
 * cocoro - Supabase Client
 * Central Supabase instance with env variable validation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  // Support both VITE_ and NEXT_PUBLIC_ prefixes
  const url = import.meta.env.VITE_SUPABASE_URL
    || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('YOUR_PROJECT_ID')) {
    console.warn('[cocoro] Supabase not configured. Running in offline/localStorage mode.');
    supabaseInstance = createClient('https://placeholder.supabase.co', 'placeholder-key');
    return supabaseInstance;
  }

  supabaseInstance = createClient(url, key, {
    realtime: {
      params: { eventsPerSecond: 30 },
    },
  });

  return supabaseInstance;
}

/** Check if Supabase is properly configured */
export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL
    || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key && !url.includes('YOUR_PROJECT_ID'));
}
