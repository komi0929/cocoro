/**
 * cocoro — Supabase Client
 * ブラウザ用 + サーバー用クライアント
 */

import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Fallback for build-time prerendering when env vars are unavailable
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

/** Returns true only when REAL Supabase credentials are configured */
export function isSupabaseConfigured(): boolean {
  return !SUPABASE_URL.includes('placeholder');
}

// ========== Browser Client (Client Components) ==========
export function createSupabaseBrowser() {
  return createBrowserClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}

// ========== Server Client (Server Actions / API Routes) ==========
export function createSupabaseServer() {
  return createClient<Database>(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
}

// ========== Singleton for client-side ==========
let browserClient: ReturnType<typeof createSupabaseBrowser> | null = null;

export function getSupabase() {
  if (typeof window === 'undefined') {
    // Server-side: always create new client
    return createSupabaseServer();
  }
  if (!browserClient) {
    browserClient = createSupabaseBrowser();
  }
  return browserClient;
}
